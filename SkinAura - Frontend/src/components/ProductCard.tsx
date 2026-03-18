import { motion } from "framer-motion";
import ScoreBadge from "./ScoreBadge";
import type { Product } from "@/data/mockProducts";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  index?: number;
}

const ProductCard = ({ product, onClick, index = 0 }: ProductCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="card-skin-hover p-4 flex items-center justify-between cursor-pointer group"
  >
    <div className="flex items-center gap-4 md:gap-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-2xl overflow-hidden flex items-center justify-center p-2 shrink-0">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl mix-blend-multiply" />
      </div>
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-widest">{product.brand}</p>
        <h3 className="text-base md:text-lg font-bold group-hover:text-primary skin-transition">{product.name}</h3>
      </div>
    </div>
    <div className="flex gap-2 md:gap-3 shrink-0">
      <ScoreBadge score={product.safety} type="safety" />
      <ScoreBadge score={product.eco} type="eco" />
    </div>
  </motion.div>
);

export default ProductCard;
