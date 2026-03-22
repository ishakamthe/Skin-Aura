import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterPanel, { type ActiveFilters } from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import SkinFooter from "@/components/SkinFooter";
import { MOCK_PRODUCTS } from "@/data/mockProducts";

const ITEMS_PER_PAGE = 10;

const DEFAULT_FILTERS: ActiveFilters = {
  includeIngredients: [],
  excludeIngredients: [],
  includeCompanies: [],
  excludeCompanies: [],
  minSafety: null,
  minEco: null,
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const navigate = useNavigate();

  const activeFilterCount =
    activeFilters.includeIngredients.length +
    activeFilters.excludeIngredients.length +
    activeFilters.includeCompanies.length +
    activeFilters.excludeCompanies.length +
    (activeFilters.minSafety ? 1 : 0) +
    (activeFilters.minEco ? 1 : 0);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      // Search
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Min safety score
      if (activeFilters.minSafety !== null && p.safety < activeFilters.minSafety) return false;

      // Min eco score
      if (activeFilters.minEco !== null && p.eco < activeFilters.minEco) return false;

      // Include companies
      if (activeFilters.includeCompanies.length > 0 && !activeFilters.includeCompanies.includes(p.brand)) return false;

      // Exclude companies
      if (activeFilters.excludeCompanies.length > 0 && activeFilters.excludeCompanies.includes(p.brand)) return false;

      const ingredientNames = p.ingredients.map((i) => i.name);

      // Include ingredients — product must have ALL selected
      if (activeFilters.includeIngredients.length > 0) {
        const hasAll = activeFilters.includeIngredients.every((ing) => ingredientNames.includes(ing));
        if (!hasAll) return false;
      }

      // Exclude ingredients — product must have NONE of selected
      if (activeFilters.excludeIngredients.length > 0) {
        const hasAny = activeFilters.excludeIngredients.some((ing) => ingredientNames.includes(ing));
        if (hasAny) return false;
      }

      return true;
    });
  }, [searchQuery, activeFilters]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
    if (searchQuery) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(t);
    }
    setIsLoading(false);
  }, [searchQuery, activeFilters]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenFilters={() => setIsFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setActiveFilters}
        currentFilters={activeFilters}
      />

      <main className="pt-32 md:pt-40 px-4 md:px-6 max-w-4xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-center mb-12 md:mb-16">

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Sparkles size={14} />
            AI-Powered Ingredient Analysis
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Your skin deserves clarity.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
            Search trending products for safety and sustainability scores.
          </p>
        </motion.div>

        {/* Active filter tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.includeIngredients.map((ing) => (
              <span key={ing} className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium flex items-center gap-1">
                ✓ {ing}
              </span>
            ))}
            {activeFilters.excludeIngredients.map((ing) => (
              <span key={ing} className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium flex items-center gap-1">
                ✕ {ing}
              </span>
            ))}
            {activeFilters.includeCompanies.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {c}
              </span>
            ))}
            {activeFilters.excludeCompanies.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                ✕ {c}
              </span>
            ))}
            {activeFilters.minSafety && (
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-medium">
                Safety ≥ {activeFilters.minSafety}
              </span>
            )}
            {activeFilters.minEco && (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                Eco ≥ {activeFilters.minEco}
              </span>
            )}
            <button
              onClick={() => setActiveFilters(DEFAULT_FILTERS)}
              className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 skin-transition"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <AnimatePresence mode="wait">
              {paginatedProducts.length > 0 ? (
                <>
                  {paginatedProducts.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                      onClick={() => navigate(`/product/${p.id}`)}
                    />
                  ))}

                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 pt-6">

                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted skin-transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold skin-transition border ${
                            currentPage === page
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}>
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted skin-transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight size={16} />
                      </button>
                    </motion.div>
                  )}

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16">
                  <SlidersHorizontal className="mx-auto mb-4 text-muted-foreground" size={32} />
                  <p className="text-muted-foreground text-lg">No products match your filters</p>
                  <p className="text-muted-foreground/60 text-sm mt-2">Try adjusting your search or filters.</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => setActiveFilters(DEFAULT_FILTERS)}
                      className="mt-4 text-primary font-medium hover:underline text-sm"
                    >
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <SkinFooter />
    </div>
  );
};

export default Index;
