import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ScanLine, Clock, Package } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/scan", label: "Scan Product", icon: ScanLine },
  { href: "/admin/pending", label: "Pending Review", icon: Clock },
  { href: "/admin/products", label: "Products", icon: Package },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-skin-mint/20 flex items-center justify-center">
            <span className="text-skin-charcoal text-xs font-bold">SA</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-1 leading-none">Skin Aura</p>
            <p className="text-[11px] text-text-3 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150",
                active
                  ? "bg-skin-mint/10 text-skin-charcoal font-medium"
                  : "text-text-2 hover:bg-surface-2 hover:text-text-1"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-skin-charcoal" : "text-text-3"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground skin-transition w-full"
        >
          ← Back to main site
        </Link>
        <p className="text-[11px] text-text-3 px-3">Ingestion Pipeline v1.0</p>
      </div>
    </aside>
  );
}