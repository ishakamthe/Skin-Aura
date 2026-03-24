import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterPanel, { type ActiveFilters } from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import SkinFooter from "@/components/SkinFooter";

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
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [products, setProducts] = useState<any[]>([]);

  const navigate = useNavigate();

  // ✅ FIXED FETCH
  useEffect(() => {
    setIsLoading(true);

    const backendUrl = "https://skin-aura.onrender.com";

    fetch(`${backendUrl}/products`) // 🔥 FIX HERE
      .then((res) => {
        if (!res.ok) throw new Error("Network response failed");
        return res.json();
      })
      .then((data) => {
        console.log("Products:", data); // optional debug
        setProducts(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      });
  }, []);

  const activeFilterCount =
    activeFilters.includeIngredients.length +
    activeFilters.excludeIngredients.length +
    activeFilters.includeCompanies.length +
    activeFilters.excludeCompanies.length +
    (activeFilters.minSafety ? 1 : 0) +
    (activeFilters.minEco ? 1 : 0);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilters.minSafety !== null && p.safety < activeFilters.minSafety) return false;
      if (activeFilters.minEco !== null && p.eco < activeFilters.minEco) return false;

      if (
        activeFilters.includeCompanies.length > 0 &&
        !activeFilters.includeCompanies.includes(p.brand)
      )
        return false;

      if (
        activeFilters.excludeCompanies.length > 0 &&
        activeFilters.excludeCompanies.includes(p.brand)
      )
        return false;

      // ✅ SAFE INGREDIENT HANDLING (no crash)
      const ingredientNames = p.ingredients?.map((i: any) => i.name) || [];

      if (activeFilters.includeIngredients.length > 0) {
        const hasAll = activeFilters.includeIngredients.every((ing) =>
          ingredientNames.includes(ing)
        );
        if (!hasAll) return false;
      }

      if (activeFilters.excludeIngredients.length > 0) {
        const hasAny = activeFilters.excludeIngredients.some((ing) =>
          ingredientNames.includes(ing)
        );
        if (hasAny) return false;
      }

      return true;
    });
  }, [searchQuery, activeFilters, products]);

  useEffect(() => {
    setCurrentPage(1);

    if (searchQuery && products.length > 0) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, [searchQuery, activeFilters, products.length]);

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
    <div className="min-h-screen bg-background text-foreground">
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

      <main className="pt-32 px-4 max-w-4xl mx-auto pb-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-full text-sm mb-4">
            <Sparkles size={14} />
            AI-Powered Ingredient Analysis
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Your skin deserves clarity.
          </h1>

          <p className="text-muted-foreground">
            Search products for safety & sustainability.
          </p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <AnimatePresence>
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
                    <div className="flex justify-center gap-2 pt-6">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button key={page} onClick={() => handlePageChange(page)}>
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <SlidersHorizontal className="mx-auto mb-3" />
                  <p>No products found</p>
                </div>
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
