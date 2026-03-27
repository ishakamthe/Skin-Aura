from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from collections import Counter, defaultdict
import copy
import logging
import os
import threading
import uuid
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

import pipeline as ai_pipeline

logging.basicConfig(level=logging.INFO)

# Directory where uploaded product images are stored.
# On Render free tier the filesystem is ephemeral — set UPLOADS_DIR to a
# mounted-disk path (or swap for Cloudinary/S3) for persistence across restarts.
UPLOADS_DIR = os.environ.get("UPLOADS_DIR", "uploads")
Path(UPLOADS_DIR).mkdir(exist_ok=True)

from product import PRODUCTS_DATA
from ingredient import INGREDIENTS_DATA

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Build a mutable in-memory product catalog with status support.
# All existing products default to "approved".
# ---------------------------------------------------------------------------
_products = []
for p in PRODUCTS_DATA["products"]:
    _products.append({**p, "status": p.get("status", "approved")})

# Pending queue: products added via the admin "Add Product" form.
# Format mirrors _products but status="pending".
_pending = []

# Auto-incrementing ID counter (starts after the last static product id)
_next_id = max(p["id"] for p in _products) + 1

# Pre-build ingredient lookup by product_id for performance
_ingredients_by_product = defaultdict(list)
for ing in INGREDIENTS_DATA["ingredients"]:
    _ingredients_by_product[ing["product_id"]].append({
        "name": ing["name"],
        "safety": ing["safety"],
        "description": ing["description"],
    })


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    return "SkinAura API running"


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    """Serve uploaded product images."""
    return send_from_directory(UPLOADS_DIR, filename)


@app.route("/products")
def get_products():
    """Return only approved products with their ingredients."""
    products = []
    for p in _products:
        if p.get("status", "approved") == "approved":
            products.append({
                **p,
                "ingredients": _ingredients_by_product.get(p["id"], []),
            })
    return jsonify(products)


@app.route("/ingredients/<int:product_id>")
def get_ingredients(product_id):
    return jsonify(_ingredients_by_product.get(product_id, []))


@app.route("/ingredients")
def get_all_ingredients():
    """Distinct ingredient names sorted by frequency (most used first)."""
    counts = Counter(i["name"] for i in INGREDIENTS_DATA["ingredients"])
    return jsonify([name for name, _ in counts.most_common()])


@app.route("/brands")
def get_brands():
    """Distinct brand names sorted by frequency (most products first)."""
    approved = [p for p in _products if p.get("status", "approved") == "approved"]
    counts = Counter(p["brand"] for p in approved)
    return jsonify([brand for brand, _ in counts.most_common()])


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@app.route("/admin/stats")
def admin_stats():
    """Dashboard stats: totals by status + 5 most-recent products."""
    total = len(_products) + len(_pending)
    approved = sum(1 for p in _products if p.get("status", "approved") == "approved")
    rejected = sum(1 for p in _products if p.get("status") == "rejected")
    pending = len(_pending)

    # most recent = last 5 entries across both lists (static + pending)
    combined = list(_products) + list(_pending)
    recent = list(reversed(combined[-5:]))
    recent_out = []
    for p in recent:
        recent_out.append({
            "id": p["id"],
            "name": p.get("name"),
            "brand": p.get("brand"),
            "status": p.get("status", "approved"),
        })

    return jsonify({
        "total": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "recent": recent_out,
    })


@app.route("/admin/products/pending")
def admin_pending():
    """Return all products in the pending queue with their ingredients."""
    out = []
    for p in _pending:
        out.append({
            **p,
            "ingredients": _ingredients_by_product.get(p["id"], []),
        })
    return jsonify(out)


# NOTE: /admin/products/scan and /admin/products/<id> must come BEFORE the
# approve/reject routes so Flask does not mistake the string "scan" for an int.

@app.route("/admin/products/scan", methods=["POST"])
def admin_scan_product():
    """Accept front & back image uploads, save them, and queue a pending product."""
    global _next_id
    front = request.files.get("front_image")
    back = request.files.get("back_image")
    if not front or not back:
        return jsonify({"error": "front_image and back_image are required"}), 400

    def save_file(f):
        ext = Path(f.filename).suffix if f.filename else ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = Path(UPLOADS_DIR) / filename
        f.save(dest)
        return str(dest), filename

    front_path, front_filename = save_file(front)
    back_path, back_filename = save_file(back)

    base_url = request.host_url.rstrip("/")
    front_url = f"{base_url}/uploads/{front_filename}"
    back_url = f"{base_url}/uploads/{back_filename}"

    new_product = {
        "id": _next_id,
        "name": "",
        "brand": "",
        "category": "Other",
        "description": "",
        "safety": 5.0,
        "eco": 5.0,
        "image": front_url,
        "image_front": front_url,
        "image_back": back_url,
        "status": "pending",
        "pipeline_step": "queued",
        "pipeline_error": None,
    }
    _next_id += 1
    _pending.append(new_product)

    # Launch the AI pipeline in a background thread.
    # The thread mutates new_product in-place; the polling endpoint
    # (/admin/products/<id>) returns the live state of the same dict.
    t = threading.Thread(
        target=ai_pipeline.run_in_thread,
        args=(new_product, _ingredients_by_product, front_path, back_path),
        daemon=True,
    )
    t.start()

    return jsonify({"product_id": new_product["id"]}), 201


@app.route("/admin/products/<int:product_id>")
def admin_get_product(product_id):
    """Return a single product by ID — used by the frontend to poll pipeline_step."""
    product = next(
        (p for p in _pending + _products if p["id"] == product_id), None
    )
    if product is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify({
        **product,
        "ingredients": _ingredients_by_product.get(product_id, []),
    })


@app.route("/admin/products", methods=["POST"])
def admin_add_product():
    """Add a new product to the pending queue."""
    global _next_id
    data = request.get_json(force=True) or {}

    new_product = {
        "id": _next_id,
        "name": data.get("name", ""),
        "brand": data.get("brand", ""),
        "category": data.get("category", "Other"),
        "description": data.get("description", ""),
        "safety": float(data.get("safety", 5)),
        "eco": float(data.get("eco", 5)),
        "image": data.get("image", ""),
        "status": "pending",
    }
    _next_id += 1
    _pending.append(new_product)

    return jsonify({"id": new_product["id"], "status": "pending"}), 201


@app.route("/admin/products/<int:product_id>/approve", methods=["POST"])
def admin_approve(product_id):
    """Move a product from pending → approved (optionally update fields)."""
    data = request.get_json(force=True) or {}

    # Find in pending
    product = next((p for p in _pending if p["id"] == product_id), None)
    if product is None:
        return jsonify({"error": "Product not found in pending queue"}), 404

    # Apply any edits from the review form
    if "name" in data:
        product["name"] = data["name"]
    if "brand" in data:
        product["brand"] = data["brand"]
    if "category" in data:
        product["category"] = data["category"]
    if "description" in data:
        product["description"] = data["description"]
    if "safety" in data:
        product["safety"] = float(data["safety"])
    if "eco" in data:
        product["eco"] = float(data["eco"])

    # Persist ingredients override in the lookup table
    if "ingredients" in data:
        _ingredients_by_product[product_id] = data["ingredients"]

    product["status"] = "approved"
    _pending.remove(product)
    _products.append(product)

    return jsonify({"id": product_id, "status": "approved"})


@app.route("/admin/products/<int:product_id>/reject", methods=["POST"])
def admin_reject(product_id):
    """Move a product from pending → rejected."""
    product = next((p for p in _pending if p["id"] == product_id), None)
    if product is None:
        return jsonify({"error": "Product not found in pending queue"}), 404

    product["status"] = "rejected"
    _pending.remove(product)
    # Keep rejected products in main list for stats
    _products.append(product)

    return jsonify({"id": product_id, "status": "rejected"})


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # use_reloader=False is critical: the Werkzeug reloader spawns a second
    # process that does NOT share _pending / _products, so the polling
    # endpoint would return 404 for newly scanned products.
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)