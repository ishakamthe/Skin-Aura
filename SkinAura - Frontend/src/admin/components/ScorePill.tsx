import clsx from "clsx";

interface Props {
  score: number | null;
  type: "safety" | "eco";
  size?: "sm" | "md";
}

function getColor(score: number | null) {
  if (score === null) return "text-text-3 bg-surface-2 border-border";
  if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export default function ScorePill({ score, type, size = "md" }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 border rounded-full font-semibold",
        getColor(score),
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {type === "safety" ? "Safety" : "Eco"}
      <span className="font-bold">{score ?? "—"}</span>
    </span>
  );
}
