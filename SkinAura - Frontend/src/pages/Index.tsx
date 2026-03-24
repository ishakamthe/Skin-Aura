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
    const backendUrl = "https://skin-aura.onrender.com";

    fetch(`${backendUrl}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        console.log("DATA:", data);
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("ERROR:", err);
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
      />

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          paginatedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate(`/product/${p.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Index;
