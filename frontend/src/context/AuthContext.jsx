import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("codoverse_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (activeToken) => {
    const t = activeToken || token;
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    // When called with an explicit token (e.g. right after OAuth redirect),
    // make sure the context's token state is actually updated to match —
    // otherwise `user` gets set but `token` stays null, and every
    // subsequent API call goes out with no Authorization header.
    if (activeToken && activeToken !== token) {
      setToken(activeToken);
    }
    try {
      const data = await api.me(t);
      setUser(data.user);
    } catch {
      localStorage.removeItem("codoverse_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("codoverse_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup({ name, email, password });
    localStorage.setItem("codoverse_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("codoverse_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
