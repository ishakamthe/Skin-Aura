import { Search, Sliders, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenFilters: () => void;
  activeFilterCount?: number;
}

const Navbar = ({ searchQuery, onSearchChange, onOpenFilters, activeFilterCount = 0 }: NavbarProps) =>
<nav className="fixed top-0 w-full z-50 glass-nav px-4 md:px-6 py-4 flex items-center justify-between gap-4">
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <div className="w-8 h-8 bg-primary rounded-lg rotate-12 flex items-center justify-center shadow-sm">
        <span className="text-primary-foreground font-bold text-lg -rotate-12">S</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline">SkinAura</span>
    </Link>

    <div className="flex-1 max-w-xl relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary skin-transition pointer-events-none" size={18} />
      <input
      type="text"
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search skincare products..."
      className="input-skin pl-10 pr-28 mx-px" />
    
      <button
      onClick={onOpenFilters}
      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-background hover:bg-muted px-3 py-1.5 rounded-xl text-sm font-medium skin-transition border border-border">
      
        <Sliders size={14} />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>

    <Link
    to="/help"
    className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium skin-transition shrink-0">
    
      <HelpCircle size={18} />
      <span className="hidden sm:inline">Help</span>
    </Link>
  </nav>;


export default Navbar;
