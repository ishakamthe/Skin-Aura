import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  // ✅ FETCH FROM RENDER BACKEND
  useEffect(() => {
    setIsLoading(true);
    const backendUrl = import.meta.env.VITE_API_URL ?? "https://skin-aura.onrender.com";
    fetch(`${backendUrl}/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        // Ingredients are NOT fetched here — they load on the product detail page.
        // Fetching 400 ingredient lists in parallel would timeout Render's free tier.
        setProducts(Array.isArray(data) ? data.map(p => ({ ...p, ingredients: p.ingredients ?? [] })) : []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      });
  }, []);

  // ✅ SEARCH FILTER
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4">
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

      {/* ── Hero with background video ── */}
      <section className="relative h-[92vh] min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Gradient overlay — top strong (for navbar), centre soft, bottom fades to background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/30 to-background pointer-events-none" />
        {/* Radial vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(247,243,238,0.55)_100%)] pointer-events-none" />

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative z-10 text-center px-4 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm text-foreground border border-foreground/15 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Sparkles size={14} />
            AI-Powered Ingredient Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight drop-shadow-sm">
            Your skin deserves clarity.
          </h1>
          <p className="text-foreground/70 text-base md:text-xl max-w-md mx-auto leading-relaxed">
            Search trending products for safety and sustainability scores.
          </p>
          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="mt-12 flex justify-center"
          >
            <svg className="w-6 h-6 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Product list section ── */}
      <main className="px-4 md:px-6 max-w-4xl mx-auto pb-12 pt-10">

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
                      className="flex items-center justify-center gap-1.5 pt-6 flex-wrap">

                      {/* Prev */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted skin-transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={16} />
                      </button>

                      {/* Windowed page numbers — max 5 visible */}
                      {(() => {
                        const half = 2;
                        let start = Math.max(1, currentPage - half);
                        let end   = Math.min(totalPages, start + 4);
                        if (end - start < 4) start = Math.max(1, end - 4);
                        const items: React.ReactNode[] = [];
                        if (start > 1) { items.push(<button key={1} onClick={() => handlePageChange(1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold skin-transition border border-border text-muted-foreground hover:text-foreground hover:bg-muted">1</button>); }
                        if (start > 2) { items.push(<span key="el1" className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm select-none">...</span>); }
                        for (let pg = start; pg <= end; pg++) {
                          const p = pg;
                          items.push(
                            <button key={p} onClick={() => handlePageChange(p)}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold skin-transition border ${
                                currentPage === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}>{p}</button>
                          );
                        }
                        if (end < totalPages - 1) { items.push(<span key="el2" className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm select-none">...</span>); }
                        if (end < totalPages) { items.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold skin-transition border border-border text-muted-foreground hover:text-foreground hover:bg-muted">{totalPages}</button>); }
                        return items;
                      })()}

                      {/* Next */}
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