import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingMapButtonProps {
  onClick: () => void;
}

const FloatingMapButton = ({ onClick }: FloatingMapButtonProps) => (
  <motion.button
    onClick={onClick}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:shadow-xl skin-transition group"
    style={{ boxShadow: "0 4px 20px hsl(200 70% 80% / 0.4)" }}
    aria-label="Open AQI Map"
  >
    <MapPin size={22} className="text-foreground group-hover:scale-110 skin-transition" />
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 skin-transition whitespace-nowrap pointer-events-none">
      AQI Map
    </span>
  </motion.button>
);

export default FloatingMapButton;
