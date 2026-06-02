import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { captureUTMs } from '@/utils/utm';
import { initTrackers, trackPageView } from '@/utils/tracking';
import { getCookieConsent } from '@/components/CookieBanner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { Loader2 } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import LandingPage from '@/pages/LandingPage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import BuyerDashboard from '@/pages/BuyerDashboard';
import AgentDashboard from '@/pages/AgentDashboard';
import CuratorDashboard from '@/pages/CuratorDashboard';
import CompleteRegistration from '@/pages/CompleteRegistration';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import VisitActionPage from '@/pages/VisitActionPage';
import VisitFeedbackPage from '@/pages/VisitFeedbackPage';
import PrivacyPage from '@/pages/PrivacyPage';
import BlogListPage from '@/pages/BlogListPage';
import BlogPostPage from '@/pages/BlogPostPage';
import CookieBanner from '@/components/CookieBanner';
import '@/App.css';

// Tracks pageviews on route changes (only when consent is 'all')
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location]);
  return null;
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex flex-col items-center justify-center">
    <div className="flex items-center gap-2 mb-6">
      <AppLogo className="h-10 w-auto" />
      <span><span className="text-2xl font-bold text-slate-900">Match</span><span className="text-2xl font-bold text-indigo-600">Imovel</span></span>
    </div>
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-600 font-medium">Carregando...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'buyer') return <Navigate to="/dashboard/buyer" replace />;
    if (user.role === 'agent') return <Navigate to="/dashboard/agent" replace />;
    if (user.role === 'curator') return <Navigate to="/dashboard/curator" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect logged-in users away from login/register pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If user is already logged in, redirect to their dashboard
  if (user) {
    if (user.role === 'buyer') return <Navigate to="/dashboard/buyer" replace />;
    if (user.role === 'agent') return <Navigate to="/dashboard/agent" replace />;
    if (user.role === 'curator') return <Navigate to="/dashboard/curator" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    captureUTMs();
    if (getCookieConsent() === 'all') initTrackers();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route 
            path="/dashboard/buyer" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/agent" 
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/curator" 
            element={
              <ProtectedRoute allowedRoles={['curator']}>
                <CuratorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin/login" element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          } />
          <Route path="/complete-registration" element={<CompleteRegistration />} />
          <Route path="/visit-action" element={<VisitActionPage />} />
          <Route path="/visit-feedback" element={<VisitFeedbackPage />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'curator']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'curator']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
        <Analytics />
        <CookieBanner onConsent={(c) => { if (c === 'all') initTrackers(); }} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
