import { ShieldCheck, Leaf } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
  type?: "safety" | "eco";
  size?: "sm" | "lg";
}

const ScoreBadge = ({ score, type = "safety", size = "sm" }: ScoreBadgeProps) => {
  const getColorClass = (s: number) => {
    if (s >= 8.5) return "score-safe";
    if (s >= 7) return "bg-secondary/60 text-secondary-foreground";
    if (s >= 5) return "score-moderate";
    return "score-danger";
  };

  const Icon = type === "safety" ? ShieldCheck : Leaf;

  if (size === "lg") {
    return (
      <div className={`${getColorClass(score)} px-5 py-2.5 rounded-2xl font-bold tracking-tight flex items-center gap-2 text-base`}>
        <Icon size={18} />
        <span>{score.toFixed(1)}</span>
        <span className="text-xs font-medium opacity-70">/10</span>
      </div>
    );
  }

  return (
    <div className={`${getColorClass(score)} px-3 py-1 rounded-full text-xs font-bold tracking-tight flex items-center gap-1.5`}>
      <Icon size={12} />
      {score.toFixed(1)}
    </div>
  );
};

export default ScoreBadge;
