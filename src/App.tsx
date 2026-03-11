import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navigation from "@/components/layout/Navigation";
import { VapiFloatingWidget } from "@/components/VapiFloatingWidget";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DASHBOARD_ROUTES = ["/dashboard", "/dashboard/"];

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isDashboard = DASHBOARD_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <>
      {/* Show app navigation on /features, /pricing, /dashboard */}
      {!isLanding && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Float Vapi widget only on dashboard */}
      {isDashboard && <VapiFloatingWidget />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
