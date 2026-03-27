import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, Upload } from "lucide-react";
import ImageDropzone from "../components/ImageDropzone";
import PipelineProgress from "../components/PipelineProgress";
import { scanProduct, getProduct } from "../lib/api";
import type { PipelineStep, ProductStatus } from "../lib/types";

// How often to poll for pipeline_step updates (ms)
const POLL_INTERVAL = 1500;

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

export default function AdminScan() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  // Pipeline polling state
  const [productId, setProductId] = useState<number | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("queued");
  const [pipelineStatus, setPipelineStatus] = useState<ProductStatus>("pending");
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stop polling on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Poll until pipeline_step === "ready" or status === "failed" ───────────
  function startPolling(id: number) {
    setStage("processing");
    setPipelineStep("queued");
    setPipelineStatus("pending");

    pollRef.current = setInterval(async () => {
      try {
        const product = await getProduct(id);
        const step = product.pipeline_step ?? "ready";
        const status = product.status;

        setPipelineStep(step);
        setPipelineStatus(status);

        if (step === "ready" || status === "failed") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          if (status === "failed") {
            setPipelineError(product.pipeline_error ?? "Pipeline failed.");
            setStage("error");
          } else {
            setStage("done");
          }
        }
      } catch (err) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setErrorMsg(err instanceof Error ? err.message : "Polling failed.");
        setStage("error");
      }
    }, POLL_INTERVAL);
  }

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!frontFile || !backFile) return;
    setStage("uploading");
    setErrorMsg("");
    try {
      const { product_id } = await scanProduct(frontFile, backFile);
      setProductId(product_id);
      startPolling(product_id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
      setStage("error");
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFrontFile(null);
    setBackFile(null);
    setProductId(null);
    setPipelineStep("queued");
    setPipelineStatus("pending");
    setPipelineError(null);
    setErrorMsg("");
    setStage("idle");
  };

  const isDisabled = stage !== "idle";

  // ── Done screen ───────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div className="p-8 max-w-xl">
        <div className="admin-card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-skin-mint/10 border border-skin-mint/20 flex items-center justify-center mx-auto mb-4">
            <Upload size={22} className="text-skin-charcoal" />
          </div>
          <p className="text-lg font-semibold text-text-1 mb-1">Product added to queue</p>
          <p className="text-sm text-text-3 mb-6">It's now awaiting review in the Pending queue.</p>
          <div className="flex justify-center gap-3">
            <button onClick={reset} className="btn-ghost">
              <RotateCcw size={14} /> Add another
            </button>
            <button onClick={() => navigate("/admin/pending")} className="btn-primary">
              Review now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-1">Scan Product</h1>
        <p className="text-sm text-text-3 mt-1">
          Upload front and back photos — we'll extract product details automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left: image dropzones ────────────────────────────────────────── */}
        <div className="admin-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <ImageDropzone
              label="Front Image"
              file={frontFile}
              onChange={setFrontFile}
              disabled={isDisabled}
            />
            <ImageDropzone
              label="Back Image"
              file={backFile}
              onChange={setBackFile}
              disabled={isDisabled}
            />
          </div>

          {/* Error banner */}
          {stage === "error" && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
              <p className="text-xs font-semibold text-danger">Error</p>
              <p className="text-xs text-text-2 mt-1">{errorMsg || pipelineError}</p>
            </div>
          )}

          {/* Upload / retry button */}
          {stage === "idle" || stage === "error" ? (
            <button
              onClick={stage === "error" ? reset : handleUpload}
              disabled={(!frontFile || !backFile) && stage === "idle"}
              className="btn-primary w-full justify-center py-3"
            >
              {stage === "error" ? (
                <><RotateCcw size={15} /> Try again</>
              ) : (
                <><Upload size={15} /> Upload &amp; Scan</>
              )}
            </button>
          ) : (
            /* Uploading spinner */
            stage === "uploading" && (
              <button disabled className="btn-primary w-full justify-center py-3 opacity-70">
                <span className="w-4 h-4 border-2 border-foreground/40 border-t-foreground rounded-full animate-spin" />
                Uploading…
              </button>
            )
          )}
        </div>

        {/* ── Right: pipeline progress ─────────────────────────────────────── */}
        <div className="admin-card p-6">
          <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-4">
            Pipeline
          </p>
          <PipelineProgress
            pipelineStep={pipelineStep}
            status={pipelineStatus}
            error={pipelineError}
          />

          {/* Show product ID once created */}
          {productId !== null && (
            <p className="mt-4 text-xs text-text-3">
              Product ID: <span className="font-mono text-text-2">{productId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
