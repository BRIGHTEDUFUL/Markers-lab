import React, { createContext, useContext, useState, useEffect } from "react";
import api, { socket } from "../lib/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      socket.connect();
      socket.emit("join", data.user.id);
      if (data.user.role === "ADMIN") {
        socket.emit("join-admin");
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (user: User) => {
    setUser(user);
    socket.connect();
    socket.emit("join", user.id);
    if (user.role === "ADMIN") {
      socket.emit("join-admin");
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
