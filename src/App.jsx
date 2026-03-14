import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Post from "./pages/Post";
import Repost from "./pages/Repost";
import Accounts from "./pages/Accounts";
import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading...</div>;
  if (!user) return <Navigate to="/landing" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* OAuth callback — accessible without user auth */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected app */}
      <Route
        path="/"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route index element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="post" element={<Post />} />
        <Route path="repost" element={<Repost />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Root redirect: show landing if not logged in */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
