import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdinkraOverlay } from "@/components/brand/AdinkraOverlay";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/app/Discover";
import Matches from "./pages/app/Matches";
import Chat from "./pages/app/Chat";
import Verify from "./pages/app/Verify";
import Profile from "./pages/app/Profile";
import EditProfile from "./pages/app/EditProfile";
import Safety from "./pages/app/Safety";
import Admin from "./pages/app/Admin";
import PaymentsAdmin from "./pages/app/PaymentsAdmin";
import PaymentEventsAdmin from "./pages/app/PaymentEventsAdmin";
import ChatDiagnostics from "./pages/app/ChatDiagnostics";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdinkraOverlay />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/discover" replace />} />
              <Route path="discover" element={<Discover />} />
              <Route path="matches" element={<Matches />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:id" element={<Chat />} />
              <Route path="verify" element={<Verify />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="safety" element={<Safety />} />
              <Route path="admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              <Route path="admin/payments" element={<ProtectedRoute adminOnly><PaymentsAdmin /></ProtectedRoute>} />
              <Route path="admin/payment-events" element={<ProtectedRoute adminOnly><PaymentEventsAdmin /></ProtectedRoute>} />
              <Route path="admin/chat-diagnostics" element={<ProtectedRoute adminOnly><ChatDiagnostics /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
