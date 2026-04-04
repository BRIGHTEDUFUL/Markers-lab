import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load pages
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Login = lazy(() => import("./pages/Auth").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Auth").then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const PublicGallery = lazy(() => import("./pages/PublicGallery").then(m => ({ default: m.PublicGallery })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const SubmitProject = lazy(() => import("./pages/SubmitProject").then(m => ({ default: m.SubmitProject })));

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

export default function App() {
  const { loading: authLoading } = useAuth();

  return (
    <>
      {authLoading ? (
        <LoadingScreen />
      ) : (
        <Layout>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/gallery" element={<PublicGallery />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/submit-project" element={<ProtectedRoute><SubmitProject /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Layout>
      )}
    </>
  );
}

