import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Leaf } from "lucide-react";
import ScoreBadge from "@/components/ScoreBadge";
import SkinFooter from "@/components/SkinFooter";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

const hazardDot: Record<string, string> = {
  low: "bg-skin-safe",
  moderate: "bg-skin-moderate",
  high: "bg-skin-danger",
};

const hazardLabel: Record<string, string> = {
  low: "Low Hazard",
  moderate: "Moderate Hazard",
  high: "High Hazard",
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [product, setProduct] = useState<any | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const backendUrl = import.meta.env.VITE_API_URL ?? "https://skin-aura.onrender.com";
    setLoading(true);

    Promise.all([
      fetch(`${backendUrl}/products`).then((r) => r.json()),
      fetch(`${backendUrl}/ingredients/${id}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([products, ingredients]) => {
        const found = (products as any[]).find((p: any) => p.id === Number(id));
        if (found) {
          setProduct({ ...found, ingredients: Array.isArray(ingredients) ? ingredients : [] });
          const alts = (products as any[])
            .filter((p: any) => p.id !== Number(id) && p.category === found.category)
            .slice(0, 3)
            .map((p: any) => ({ ...p, ingredients: [] }));
          setAlternatives(alts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} onOpenFilters={() => {}} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="max-w-6xl mx-auto pt-28 md:pt-32 px-4 md:px-6 pb-12"
      >
        <button
          onClick={() => navigate("/")}
          className="mb-8 text-muted-foreground hover:text-foreground flex items-center gap-2 skin-transition text-sm font-medium"
        >
          <ChevronRight className="rotate-180" size={18} /> Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Product Image */}
          <div className="aspect-square card-skin p-8 md:p-12 flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full object-contain rounded-2xl mix-blend-multiply"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Product Info */}
          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-xl">{product.brand}</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-3 leading-tight">{product.name}</h1>
            <p className="text-muted-foreground mb-8">{product.description}</p>

            <div className="flex gap-3 mb-10 flex-wrap">
              <ScoreBadge score={product.safety} type="safety" size="lg" />
              <ScoreBadge score={product.eco} type="eco" size="lg" />
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="card-skin p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-muted-foreground" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Safety</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">{product.safety}</span>
                  <span className="text-muted-foreground mb-0.5">/10</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${product.safety * 10}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-sky-300 rounded-full"
                  />
                </div>
              </div>
              <div className="card-skin p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf size={14} className="text-muted-foreground" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eco</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">{product.eco}</span>
                  <span className="text-muted-foreground mb-0.5">/10</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${product.eco * 10}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-green-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <section className="mb-12">
              <h3 className="text-xl font-bold mb-5">Ingredient Analysis</h3>
              {product.ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No ingredient data available.</p>
              ) : (
                <div className="space-y-3">
                  {product.ingredients.map((ing: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center justify-between p-4 card-skin-hover"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${hazardDot[ing.safety] ?? "bg-muted"}`} />
                        <div>
                          <p className="font-bold text-sm">{ing.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ing.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase text-muted-foreground shrink-0 ml-4">
                        {hazardLabel[ing.safety] ?? ing.safety}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Safer Alternatives */}
        {alternatives.length > 0 && (
          <section className="mt-16">
            <h3 className="text-2xl font-bold mb-6">More in This Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alternatives.map((alt, i) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/product/${alt.id}`)}
                  className="card-skin-hover p-5 cursor-pointer group"
                >
                  <div className="w-full aspect-[4/3] bg-muted rounded-2xl overflow-hidden mb-4 flex items-center justify-center p-4">
                    <img
                      src={alt.image}
                      alt={alt.name}
                      className="max-h-full object-contain mix-blend-multiply"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{alt.brand}</p>
                  <h4 className="font-bold group-hover:text-primary skin-transition mt-1">{alt.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alt.description}</p>
                  <div className="flex gap-2 mt-3">
                    <ScoreBadge score={alt.safety} type="safety" />
                    <ScoreBadge score={alt.eco} type="eco" />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </motion.div>

      <SkinFooter />
    </div>
  );
};

export default ProductDetail;