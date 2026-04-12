import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";

type LazyRouteComponent = React.LazyExoticComponent<React.ComponentType<any>> & {
  preload: () => Promise<unknown>;
};

const lazyWithPreload = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyRouteComponent => {
  const Component = lazy(factory) as LazyRouteComponent;
  Component.preload = factory;
  return Component;
};

// Lazy load pages
const Home = lazyWithPreload(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Login = lazyWithPreload(() => import("./pages/Login"));
const Register = lazyWithPreload(() => import("./pages/Register"));
const Dashboard = lazyWithPreload(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazyWithPreload(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const PublicGallery = lazyWithPreload(() => import("./pages/PublicGallery").then(m => ({ default: m.PublicGallery })));
const About = lazyWithPreload(() => import("./pages/About").then(m => ({ default: m.About })));
const Contact = lazyWithPreload(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Pricing = lazyWithPreload(() => import("./pages/Pricing").then(m => ({ default: m.Pricing })));
const Profile = lazyWithPreload(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const SubmitProject = lazyWithPreload(() => import("./pages/SubmitProject").then(m => ({ default: m.SubmitProject })));

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    let warmed = false;

    const preloadRoutes = () => {
      if (warmed) return;
      warmed = true;

      const warmup: Array<Promise<unknown>> = [PublicGallery.preload(), About.preload(), Contact.preload(), Pricing.preload()];

      if (user) {
        warmup.push(Dashboard.preload(), SubmitProject.preload(), Profile.preload());
        if (user.role === "ADMIN") warmup.push(AdminDashboard.preload());
      } else {
        warmup.push(Login.preload(), Register.preload());
      }

      Promise.allSettled(warmup);
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    const onFirstInteraction = () => {
      preloadRoutes();
      interactionEvents.forEach((evt) => window.removeEventListener(evt, onFirstInteraction, listenerOptions));
      window.clearTimeout(timeoutId);
    };

    const listenerOptions: AddEventListenerOptions = { passive: true, once: true };
    interactionEvents.forEach((evt) => window.addEventListener(evt, onFirstInteraction, listenerOptions));

    const idleWindow = window as WindowWithIdleCallback;
    const timeoutId = window.setTimeout(() => {
      if (typeof idleWindow.requestIdleCallback === "function") {
        idleWindow.requestIdleCallback(preloadRoutes, { timeout: 1200 });
      } else {
        preloadRoutes();
      }
    }, 2500);

    return () => {
      interactionEvents.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
      window.clearTimeout(timeoutId);
    };
  }, [user]);

  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/gallery" element={<PublicGallery />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/submit-project" element={<ProtectedRoute><SubmitProject /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

