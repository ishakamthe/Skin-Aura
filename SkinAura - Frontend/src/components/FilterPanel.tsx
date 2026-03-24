import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Loader2 } from "lucide-react";

export interface ActiveFilters {
  includeIngredients: string[];
  excludeIngredients: string[];
  includeCompanies: string[];
  excludeCompanies: string[];
  minSafety: number | null;
  minEco: number | null;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ActiveFilters) => void;
  currentFilters: ActiveFilters;
}

// Same URL as Index.tsx — must be consistent
const BASE = import.meta.env.VITE_API_URL ?? "https://skin-aura.onrender.com";

const FilterDropdown = ({
  label, items, selected, onToggle, placeholder, loading,
}: {
  label: string; items: string[]; selected: string[];
  onToggle: (item: string) => void; placeholder: string; loading?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-muted rounded-xl p-3 font-medium text-sm skin-transition hover:bg-muted/80"
      >
        <span>{label} {selected.length > 0 && `(${selected.length})`}</span>
        {loading
          ? <Loader2 size={14} className="animate-spin text-muted-foreground" />
          : <ChevronDown size={16} className={`skin-transition ${open ? "rotate-180" : ""}`} />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="input-skin text-sm py-2"
              />
              <div className="max-h-36 overflow-y-auto space-y-1">
                {loading ? (
                  <p className="text-sm text-muted-foreground px-3 py-2 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Loading…
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">No results</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item}
                      onClick={() => onToggle(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm skin-transition ${
                        selected.includes(item)
                          ? "bg-primary/20 text-foreground font-medium"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterPanel = ({ isOpen, onClose, onApply, currentFilters }: FilterPanelProps) => {
  const [includeIngredients, setIncludeIngredients] = useState<string[]>(currentFilters.includeIngredients);
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>(currentFilters.excludeIngredients);
  const [includeCompanies, setIncludeCompanies] = useState<string[]>(currentFilters.includeCompanies);
  const [excludeCompanies, setExcludeCompanies] = useState<string[]>(currentFilters.excludeCompanies);
  const [minSafety, setMinSafety] = useState<number | null>(currentFilters.minSafety);
  const [minEco, setMinEco] = useState<number | null>(currentFilters.minEco);

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (!isOpen || fetchedOnce) return;

    setLoadingIngredients(true);
    fetch(`${BASE}/ingredients`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: string[]) => setIngredients(data.length > 0 ? data : []))
      .catch(() => setIngredients([]))
      .finally(() => setLoadingIngredients(false));

    setLoadingBrands(true);
    fetch(`${BASE}/brands`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: string[]) => setBrands(data.length > 0 ? data : []))
      .catch(() => setBrands([]))
      .finally(() => { setLoadingBrands(false); setFetchedOnce(true); });
  }, [isOpen, fetchedOnce]);

  const toggle = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleApply = () => {
    onApply({ includeIngredients, excludeIngredients, includeCompanies, excludeCompanies, minSafety, minEco });
    onClose();
  };

  const handleClearAll = () => {
    setIncludeIngredients([]); setExcludeIngredients([]);
    setIncludeCompanies([]); setExcludeCompanies([]);
    setMinSafety(null); setMinEco(null);
    onApply({ includeIngredients: [], excludeIngredients: [], includeCompanies: [], excludeCompanies: [], minSafety: null, minEco: null });
  };

  const activeCount = includeIngredients.length + excludeIngredients.length + includeCompanies.length + excludeCompanies.length + (minSafety ? 1 : 0) + (minEco ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60]" />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-[70] shadow-2xl p-6 md:p-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold">
                Filters {activeCount > 0 && <span className="text-base font-semibold text-primary ml-1">({activeCount} active)</span>}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full skin-transition"><X size={20} /></button>
            </div>

            <div className="space-y-8">
              <section>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Ingredients</label>
                <div className="space-y-3">
                  <FilterDropdown label="Include ingredients" items={ingredients} selected={includeIngredients} onToggle={(i) => toggle(includeIngredients, setIncludeIngredients, i)} placeholder="Search to include..." loading={loadingIngredients} />
                  <FilterDropdown label="Exclude ingredients" items={ingredients} selected={excludeIngredients} onToggle={(i) => toggle(excludeIngredients, setExcludeIngredients, i)} placeholder="Search to exclude..." loading={loadingIngredients} />
                </div>
              </section>

              <section>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Min. Safety Score</label>
                <div className="flex gap-2">
                  {[5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => setMinSafety(minSafety === num ? null : num)} className={`flex-1 py-3 rounded-xl border border-border font-bold skin-transition ${minSafety === num ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"}`}>
                      {num}+
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Min. Eco Score</label>
                <div className="flex gap-2">
                  {[5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => setMinEco(minEco === num ? null : num)} className={`flex-1 py-3 rounded-xl border border-border font-bold skin-transition ${minEco === num ? "bg-skin-mint text-secondary-foreground" : "hover:bg-skin-mint hover:text-secondary-foreground"}`}>
                      {num}+
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Companies</label>
                <div className="space-y-3">
                  <FilterDropdown label="Include companies" items={brands} selected={includeCompanies} onToggle={(i) => toggle(includeCompanies, setIncludeCompanies, i)} placeholder="Search companies..." loading={loadingBrands} />
                  <FilterDropdown label="Exclude companies" items={brands} selected={excludeCompanies} onToggle={(i) => toggle(excludeCompanies, setExcludeCompanies, i)} placeholder="Search companies..." loading={loadingBrands} />
                </div>
              </section>

              <div className="pt-4 space-y-3">
                <button onClick={handleApply} className="w-full py-4 btn-primary-skin">Apply Filters</button>
                <button onClick={handleClearAll} className="w-full text-muted-foreground font-medium hover:underline text-sm">Clear all filters</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;