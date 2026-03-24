import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle2, XCircle, ScanLine, ArrowRight } from "lucide-react";
import { getStats } from "../lib/api";
import type { Stats } from "../lib/types";
import StatusBadge from "../components/StatusBadge";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="admin-card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-1">{value}</p>
        <p className="text-xs text-text-3 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <div className="admin-card p-6 border-danger/30 bg-danger/5 max-w-md">
          <p className="text-sm font-semibold text-danger">Could not reach backend</p>
          <p className="text-xs text-text-3 mt-1">
            Set <code className="font-mono bg-surface-2 px-1 rounded">VITE_API_URL</code> in your Vercel environment variables to your Render backend URL.
          </p>
          <code className="block mt-3 text-xs font-mono text-text-2 bg-surface-2 rounded-xl p-3">
            VITE_API_URL=https://your-app.onrender.com
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-1">Dashboard</h1>
        <p className="text-sm text-text-3 mt-1">Product ingestion pipeline overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products"  value={stats?.total ?? 0}    icon={Package}      color="bg-info/10 text-info" />
        <StatCard label="Pending Review"  value={stats?.pending ?? 0}  icon={Clock}        color="bg-warning/10 text-warning" />
        <StatCard label="Approved"        value={stats?.approved ?? 0} icon={CheckCircle2} color="bg-skin-mint/15 text-skin-charcoal" />
        <StatCard label="Rejected"        value={stats?.rejected ?? 0} icon={XCircle}      color="bg-danger/10 text-danger" />
      </div>

      {/* Quick action */}
      <div className="admin-card p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-1">Scan a new product</p>
          <p className="text-xs text-text-3 mt-0.5">Upload front and back images to start the pipeline</p>
        </div>
        <Link to="/admin/scan" className="btn-primary">
          <ScanLine size={15} />
          Start scan
        </Link>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-text-2">Recent activity</p>
          <Link to="/admin/pending" className="flex items-center gap-1 text-xs text-skin-sky hover:underline">
            View pending <ArrowRight size={11} />
          </Link>
        </div>

        {!stats ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="admin-card p-4 animate-pulse">
                <div className="h-3.5 w-48 bg-surface-2 rounded" />
                <div className="h-3 w-32 bg-surface-2 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="admin-card p-8 text-center">
            <p className="text-sm text-text-3">No products yet. Scan your first product to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((p) => (
              <div key={p.id} className="admin-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-1">{p.name ?? "Untitled"}</p>
                  <p className="text-xs text-text-3 mt-0.5">{p.brand ?? "Unknown brand"} · {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}