import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import FloatingMapButton from "./components/FloatingMapButton";
import { useLocation } from "react-router-dom";

function AqiButtons({ isAqiOpen, setIsAqiOpen }: { isAqiOpen: boolean; setIsAqiOpen: (v: boolean) => void }) {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return (
    <>
      <FloatingMapButton onClick={() => setIsAqiOpen(true)} />
      <AqiMapPanel isOpen={isAqiOpen} onClose={() => setIsAqiOpen(false)} />
    </>
  );
}
import AqiMapPanel from "./components/AqiMapPanel";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminScan from "./admin/pages/AdminScan";
import AdminPending from "./admin/pages/AdminPending";
import AdminProducts from "./admin/pages/AdminProducts";

const queryClient = new QueryClient();

const App = () => {
  const [isAqiOpen, setIsAqiOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/help" element={<Help />} />
            {/* Admin section */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="scan" element={<AdminScan />} />
              <Route path="pending" element={<AdminPending />} />
              <Route path="products" element={<AdminProducts />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AqiButtons isAqiOpen={isAqiOpen} setIsAqiOpen={setIsAqiOpen} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;