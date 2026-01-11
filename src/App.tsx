import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Trade from "./pages/Trade";
import Crypto from "./pages/Crypto";
import Dashboard from "./pages/Dashboard";
import WhyFidelity from "./pages/WhyFidelity";
import FundAccount from "./pages/FundAccount";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import CustomerService from "./pages/CustomerService";
import Profile from "./pages/Profile";
import Grants from "./pages/Grants";
import GrantApplication from "./pages/GrantApplication";
import Investment from "./pages/Investment";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/crypto" element={<Crypto />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/why-fidelity" element={<WhyFidelity />} />
            <Route path="/fund-account" element={<FundAccount />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/customer-service" element={<CustomerService />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/grant-application" element={<GrantApplication />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
