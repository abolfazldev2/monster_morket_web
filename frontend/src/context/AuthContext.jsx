import React, { createContext, useContext, useEffect, useState } from "react";

import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mm_access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("mm_access_token");
        localStorage.removeItem("mm_refresh_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password });
    localStorage.setItem("mm_access_token", data.access);
    localStorage.setItem("mm_refresh_token", data.refresh);
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  };

  const register = async (payload) => {
    await authApi.register(payload);
    return login(payload.username, payload.password);
  };

  const logout = () => {
    localStorage.removeItem("mm_access_token");
    localStorage.removeItem("mm_refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAdmin: user?.role && user.role !== "CUSTOMER" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
