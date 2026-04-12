import React, { createContext, useContext, useState, useEffect } from "react";
import { insforge, insforgeConfigured } from "../lib/insforge-client";
import { fetchSessionUser } from "../lib/makers-data";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  recoverSession: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      if (!insforgeConfigured) {
        setUser(null);
        setAuthError("Authentication is not configured.");
        return;
      }
      const u = await fetchSessionUser();
      setUser(u);
      setAuthError(null);
    } catch (err: any) {
      setUser(null);
      const msg = typeof err?.message === "string" ? err.message : "";
      if (/refresh|token|jwt|expired|unauthorized|401/i.test(msg)) {
        setAuthError("Your session expired. Please log in again.");
      } else {
        setAuthError("Could not verify your session. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (u: User) => {
    setUser(u);
    setAuthError(null);
  };

  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch {
      // If sign-out API fails, clear local auth state anyway.
    }
    setUser(null);
    setAuthError(null);
  };

  const recoverSession = async () => {
    setLoading(true);
    try {
      await logout();
      await checkAuth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, checkAuth, recoverSession, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
