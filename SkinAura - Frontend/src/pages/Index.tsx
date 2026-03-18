import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterPanel from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import SkinFooter from "@/components/SkinFooter";
import { MOCK_PRODUCTS } from "@/data/mockProducts";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filteredProducts = useMemo(
    () =>
    MOCK_PRODUCTS.filter(
      (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    if (searchQuery) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(t);
    }
    setIsLoading(false);
  }, [searchQuery]);

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
        onOpenFilters={() => setIsFilterOpen(true)} />
      
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

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
                      onClick={() => navigate(`/product/${p.id}`)} />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 pt-6">
                      
                      {/* Prev */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted skin-transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={16} />
                      </button>

                      {/* Page buttons */}
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

                      {/* Next */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted skin-transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight size={16} />
                      </button>
                    </motion.div>
                  )}

                  {/* Results count */}
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                </>
              ) : searchQuery ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16">
                  <p className="text-muted-foreground text-lg">No products found for "{searchQuery}"</p>
                  <p className="text-muted-foreground/60 text-sm mt-2">Try adjusting your search or filters.</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </div>
      </main>

      <SkinFooter />
    </div>
  );
};

export default Index;
