import type { ProductStatus } from "../lib/types";

const CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-400/10 text-emerald-600 border-emerald-400/20" },
  pending:  { label: "Pending",  className: "bg-yellow-400/10 text-yellow-600 border-yellow-400/20" },
  rejected: { label: "Rejected", className: "bg-red-400/10 text-red-500 border-red-400/20" },
  failed:   { label: "Failed",   className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StatusBadge({ status }: { status: ProductStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}
