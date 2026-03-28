"""
AI pipeline — ported from Skin-Aura-admin ui/backend/pipeline.py.

Flow (runs in a background thread, updating the in-memory product dict):
  1. Extract text  — OpenRouter vision model reads both product images
  2. Structure data — Text model parses raw text into product JSON fields
  3. Score          — Text model applies safety & eco rubrics
  4. Ready          — Sets pipeline_step="ready"; product shows in pending queue
"""

import asyncio
import base64
import io
import json
import logging
import os
import re

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# ── OpenRouter client ─────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

client = AsyncOpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
    timeout=120.0,
    default_headers={
        "HTTP-Referer": "https://skinaura.vercel.app",
        "X-Title": "Skin Aura Admin",
    },
)

# ── Rubrics ───────────────────────────────────────────────────────────────────

SAFETY_RUBRIC = """
SAFETY SCORE (start at 8.0, clamp to 1.0–10.0):

Deductions:
- Synthetic fragrance / parfum / perfume: -1.5
- Any paraben (methylparaben, propylparaben, butylparaben, ethylparaben): -2.0
- SLS — Sodium Lauryl Sulfate: -1.5
- SLES — Sodium Laureth Sulfate: -1.0
- Formaldehyde releasers (DMDM Hydantoin, Quaternium-15, Imidazolidinyl Urea): -2.0
- Phthalates (DBP, DEHP, DEP): -2.0
- Mineral oil or petrolatum: -0.5
- Alcohol Denat / Denatured Alcohol (as primary ingredient): -0.5
- Phenoxyethanol: -0.3
- Artificial colorants (CI numbers): -0.2 each

Additions:
- Plant extracts, natural oils, botanical ingredients: +0.2 each (max +1.0)
- "Dermatologist tested" claim on label: +0.3
- "Hypoallergenic" claim on label: +0.2
"""

ECO_RUBRIC = """
ECO SCORE (start at 6.5, clamp to 1.0–10.0):

Deductions:
- Microbeads / Polyethylene particles: -3.0
- Silicones (Dimethicone, Cyclopentasiloxane, Cyclomethicone): -1.0
- PEG compounds: -0.5
- Mineral oil or petrolatum: -0.5

Additions:
- Majority plant-based / natural ingredient list: +1.0
- Cruelty-free or vegan claim: +0.8
- Certified organic claim: +1.0
- Biodegradable formulation claim: +0.8
- Recyclable packaging mentioned: +0.5
- "Made with sustainable ingredients" or similar: +0.5
"""

# ── Model fallback chains ─────────────────────────────────────────────────────

VISION_MODELS_FALLBACK = [
    "google/gemma-3-27b-it:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "google/gemma-3-12b-it:free",
]

REASONING_MODELS_FALLBACK = [
    "google/gemma-3-12b-it:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-4b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "qwen/qwen2.5-72b-instruct:free",
    "deepseek/deepseek-chat:free",
]

VISION_PROMPT = (
    "These are the front and back images of a skincare product. "
    "Extract ALL visible text from both images verbatim. "
    "Include: product name, brand, tagline, ingredient list, claims, "
    "directions, warnings, certifications, net weight, and any other text. "
    "Preserve the original text exactly as it appears. "
    "Label each section clearly (e.g. FRONT:, BACK:, INGREDIENTS:). "
    "Do not summarise or interpret — just extract the text."
)

# How long to wait before retrying a rate-limited model (seconds).
# Index = attempt number (0-based), so waits are 2s, 4s, 8s, 16s, …
# Capped at 30s for models late in the chain.
_BACKOFF_BASE = 2
_BACKOFF_CAP  = 30


def _backoff(attempt: int) -> float:
    return min(_BACKOFF_BASE ** (attempt + 1), _BACKOFF_CAP)


def _is_rate_limited(response) -> bool:
    """
    Detect a 429 from OpenRouter.
    The AsyncOpenAI client surfaces 429s in two ways:
      1. An exception whose string contains "429".
      2. A response with no choices and an error dict with code 429.
    This helper handles case 2; case 1 is caught in the except block below.
    """
    if response.choices:
        return False
    try:
        raw = response.model_dump()
        err = raw.get("error") or {}
        code = str(err.get("code", ""))
        message = str(err.get("message", ""))
        return code == "429" or "rate" in message.lower() or "rate-limited" in message.lower()
    except Exception:
        return False


def _error_description(response) -> str:
    """Extract a human-readable error string from a no-choices response."""
    try:
        raw = response.model_dump()
        err = raw.get("error") or {}
        return f"[{err.get('code', '?')}] {err.get('message', 'no choices returned')}"
    except Exception:
        return "no choices returned"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _image_to_base64(path: str) -> tuple[str, str]:
    """Resize image to max 1024px on longest side, return (base64_str, media_type)."""
    from PIL import Image
    img = Image.open(path).convert("RGB")
    w, h = img.size
    if max(w, h) > 1024:
        scale = 1024 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode(), "image/jpeg"


def _extract_json(text: str) -> dict:
    """Robustly extract the last JSON object from a model response."""
    text = text.strip()
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    matches = list(re.finditer(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", text, re.DOTALL))
    if not matches:
        matches = list(re.finditer(r"\{.*\}", text, re.DOTALL))
    for match in reversed(matches):
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            continue
    raise ValueError(f"Could not parse JSON from model response: {text[:300]}")


# ── Pipeline steps (async) ────────────────────────────────────────────────────

async def _extract_text_ocr(front_path: str, back_path: str) -> str:
    """Step 1 — vision model extracts all text from both images."""
    front_b64, front_mime = _image_to_base64(front_path)
    back_b64, back_mime = _image_to_base64(back_path)

    last_error = "Unknown error"

    for attempt, model in enumerate(VISION_MODELS_FALLBACK):
        try:
            logger.info("Vision OCR: trying model=%s (attempt %d)", model, attempt + 1)
            response = await client.chat.completions.create(
                model=model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{front_mime};base64,{front_b64}"}},
                        {"type": "image_url", "image_url": {"url": f"data:{back_mime};base64,{back_b64}"}},
                        {"type": "text", "text": VISION_PROMPT},
                    ],
                }],
                max_tokens=2000,
            )

            # ── 429 in response body (no exception raised) ────────────────
            if _is_rate_limited(response):
                wait = _backoff(attempt)
                last_error = f"{model}: rate-limited (429) — waiting {wait}s"
                logger.warning("Vision OCR rate-limited: %s", last_error)
                if attempt < len(VISION_MODELS_FALLBACK) - 1:
                    await asyncio.sleep(wait)
                continue

            # ── Any other error in response body ──────────────────────────
            if not response.choices:
                last_error = f"{model}: {_error_description(response)}"
                logger.warning("Vision OCR failed (no choices): %s", last_error)
                continue

            content = response.choices[0].message.content
            if not content:
                last_error = f"{model}: empty content"
                logger.warning("Vision OCR failed: %s", last_error)
                continue

            logger.info("Vision OCR succeeded: model=%s, chars=%d", model, len(content))
            return content

        except Exception as exc:
            exc_str = str(exc)
            # ── 429 raised as an exception ────────────────────────────────
            if "429" in exc_str or "rate" in exc_str.lower():
                wait = _backoff(attempt)
                last_error = f"{model}: rate-limited exception — waiting {wait}s — {exc_str}"
                logger.warning("Vision OCR rate-limit exception: %s", last_error)
                if attempt < len(VISION_MODELS_FALLBACK) - 1:
                    await asyncio.sleep(wait)
            else:
                last_error = f"{model}: {exc_str}"
                logger.warning("Vision OCR exception: %s", last_error)
            continue

    raise RuntimeError(f"Vision OCR failed across all models. Last error: {last_error}")


async def _call_text_model(prompt: str, max_tokens: int, step: str) -> str:
    """Call a text model with fallback across REASONING_MODELS_FALLBACK."""
    last_error = "Unknown error"

    for attempt, model in enumerate(REASONING_MODELS_FALLBACK):
        try:
            logger.info("%s: trying model=%s (attempt %d)", step, model, attempt + 1)
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
            )

            # ── 429 in response body ──────────────────────────────────────
            if _is_rate_limited(response):
                wait = _backoff(attempt)
                last_error = f"{model}: rate-limited (429) — waiting {wait}s"
                logger.warning("%s rate-limited: %s", step, last_error)
                if attempt < len(REASONING_MODELS_FALLBACK) - 1:
                    await asyncio.sleep(wait)
                continue

            # ── Any other error in response body ──────────────────────────
            if not response.choices:
                last_error = f"{model}: {_error_description(response)}"
                logger.warning("%s failed (no choices): %s", step, last_error)
                continue

            msg = response.choices[0].message
            content = msg.content or getattr(msg, "reasoning", None)
            if not content:
                last_error = f"{model}: null content"
                logger.warning("%s failed (null content): %s", step, last_error)
                continue

            logger.info("%s succeeded: model=%s", step, model)
            return content

        except Exception as exc:
            exc_str = str(exc)
            # ── 429 raised as an exception ────────────────────────────────
            if "429" in exc_str or "rate" in exc_str.lower():
                wait = _backoff(attempt)
                last_error = f"{model}: rate-limited exception — waiting {wait}s — {exc_str}"
                logger.warning("%s rate-limit exception: %s", step, last_error)
                if attempt < len(REASONING_MODELS_FALLBACK) - 1:
                    await asyncio.sleep(wait)
            else:
                last_error = f"{model}: {exc_str}"
                logger.warning("%s exception: %s", step, last_error)
            continue

    raise RuntimeError(f"{step} failed across all models. Last error: {last_error}")


async def _call_structure(raw_text: str) -> dict:
    """Step 2 — parse raw OCR text into structured product JSON."""
    prompt = f"""You are a skincare product database assistant.
Given the raw text extracted from a skincare product label, extract and structure the information.

RAW TEXT:
{raw_text}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "name": "full product name",
  "brand": "brand name",
  "category": "one of: Cleanser, Face Wash, Moisturizer, Serum, Sunscreen, Toner, Mask, Eye Cream, Other",
  "description": "2-3 sentence product description based on claims and purpose found on label",
  "ingredients": [
    {{
      "name": "ingredient name as listed",
      "safety": "low or moderate or high",
      "description": "brief one-line description of what this ingredient does for skin"
    }}
  ]
}}

For ingredient safety:
- low = well-tolerated, gentle, widely regarded as safe (e.g. glycerin, aloe vera, hyaluronic acid)
- moderate = effective but may cause sensitivity in some (e.g. salicylic acid, AHAs, retinol, essential oils)
- high = known irritants, allergens, or controversial (e.g. parabens, SLS, synthetic fragrance, formaldehyde releasers)
"""
    content = await _call_text_model(prompt, max_tokens=3000, step="structure")
    return _extract_json(content)


async def _call_scoring(structured: dict) -> dict:
    """Step 3 — score safety and eco using explicit rubrics."""
    ingredient_names = ", ".join(i["name"] for i in structured.get("ingredients", []))
    prompt = f"""You are a skincare ingredient safety and sustainability expert.
Score the following product using the provided rubrics.

PRODUCT: {structured.get('name', 'Unknown')} by {structured.get('brand', 'Unknown')}
CATEGORY: {structured.get('category', 'Unknown')}
DESCRIPTION: {structured.get('description', '')}
INGREDIENTS: {ingredient_names}

{SAFETY_RUBRIC}

{ECO_RUBRIC}

Apply the rubrics step by step. Show your working briefly in the reasoning fields.
Return ONLY valid JSON (no markdown, no explanation):
{{
  "safety": 7.5,
  "safety_reasoning": "Started at 8.0. Deducted X for Y. Final: 7.5",
  "eco": 6.8,
  "eco_reasoning": "Started at 6.5. Deducted X for Y. Final: 6.8"
}}
"""
    content = await _call_text_model(prompt, max_tokens=4000, step="scoring")
    result = _extract_json(content)
    result["safety"] = round(max(1.0, min(10.0, float(result.get("safety", 5.0)))), 1)
    result["eco"]    = round(max(1.0, min(10.0, float(result.get("eco",    5.0)))), 1)
    return result


# ── Main entry point ──────────────────────────────────────────────────────────

async def _run_async(product: dict, ingredients_by_product: dict,
                     front_path: str, back_path: str):
    """
    Full async pipeline. Mutates `product` dict in-place so the frontend
    polling endpoint (/admin/products/<id>) always sees the latest state.
    `ingredients_by_product` is the shared lookup dict from app.py.
    """
    product_id = product["id"]
    try:
        # ── Step 1: Extract text ──────────────────────────────────────────
        product["pipeline_step"] = "extracting_text"
        raw_text = await _extract_text_ocr(front_path, back_path)

        # ── Step 2: Structure data ────────────────────────────────────────
        product["pipeline_step"] = "structuring_data"
        structured = await _call_structure(raw_text)

        product["name"]        = structured.get("name", "")
        product["brand"]       = structured.get("brand", "")
        product["category"]    = structured.get("category", "Other")
        product["description"] = structured.get("description", "")

        # Store ingredients in the shared lookup so the review card sees them
        ingredients_by_product[product_id] = structured.get("ingredients", [])

        # ── Step 3: Score ─────────────────────────────────────────────────
        product["pipeline_step"] = "scoring"
        scores = await _call_scoring(structured)

        product["safety"] = scores["safety"]
        product["eco"]    = scores["eco"]

        # ── Done ──────────────────────────────────────────────────────────
        product["pipeline_step"]  = "ready"
        product["pipeline_error"] = None
        logger.info(
            "Pipeline complete for product_id=%d  safety=%.1f  eco=%.1f",
            product_id, scores["safety"], scores["eco"],
        )

    except Exception as exc:
        product["pipeline_step"]  = "ready"    # stop the spinner
        product["status"]         = "failed"
        product["pipeline_error"] = str(exc)
        logger.error("Pipeline failed for product_id=%d: %s", product_id, exc)
        raise


def run_in_thread(product: dict, ingredients_by_product: dict,
                  front_path: str, back_path: str):
    """
    Synchronous wrapper called from a background Thread in app.py.
    Creates a fresh event loop (Flask is sync; pipeline is async).
    """
    asyncio.run(_run_async(product, ingredients_by_product, front_path, back_path))
