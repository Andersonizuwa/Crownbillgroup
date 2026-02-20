import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Trade from "./pages/Trade";
import Crypto from "./pages/Crypto";
import Dashboard from "./pages/Dashboard";
import WhyFidelity from "./pages/WhyFidelity";
import FundAccount from "./pages/FundAccount";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import Portfolio from "./pages/Portfolio";
import CustomerService from "./pages/CustomerService";
import Profile from "./pages/Profile";
import Grants from "./pages/Grants";
import GrantApplication from "./pages/GrantApplication";
import Investment from "./pages/Investment";
import ProprietaryAlgorithm from "./pages/ProprietaryAlgorithm";
import ProprietaryAlgorithmApply from "./pages/ProprietaryAlgorithmApply";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";
import SessionTimeoutModal from "./components/SessionTimeoutModal";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const authContext = useAuth();
  const { user, isLoading } = authContext || {};

  if (!authContext) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const authContext = useAuth();
  const { user, isAdmin, isLoading } = authContext || {};

  if (!authContext) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const authContext = useAuth();
  const { showTimeoutWarning, timeUntilTimeout, logout, extendSession } = authContext || {};

  const handleLogout = async () => {
    if (logout) {
      await logout();
      window.location.href = '/';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {authContext && (
            <SessionTimeoutModal
              isOpen={showTimeoutWarning || false}
              timeRemaining={timeUntilTimeout || 300}
              onLogout={handleLogout}
              onExtend={extendSession || (() => { })}
            />
          )}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route path="/trade" element={
              <ProtectedRoute>
                <Trade />
              </ProtectedRoute>
            } />
            <Route path="/crypto" element={
              <ProtectedRoute>
                <Crypto />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/fund-account" element={
              <ProtectedRoute>
                <FundAccount />
              </ProtectedRoute>
            } />
            <Route path="/withdraw" element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/grants" element={
              <ProtectedRoute>
                <Grants />
              </ProtectedRoute>
            } />
            <Route path="/grant-application" element={
              <ProtectedRoute>
                <GrantApplication />
              </ProtectedRoute>
            } />
            <Route path="/proprietary-algorithm" element={
              <ProtectedRoute>
                <ProprietaryAlgorithm />
              </ProtectedRoute>
            } />
            <Route path="/proprietary-algorithm/apply" element={
              <ProtectedRoute>
                <ProprietaryAlgorithmApply />
              </ProtectedRoute>
            } />

            {/* Public Routes */}
            <Route path="/why-fidelity" element={<WhyFidelity />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/customer-service" element={<CustomerService />} />

            {/* Admin Route */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
