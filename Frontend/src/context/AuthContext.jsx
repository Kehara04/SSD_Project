import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI, setAuthToken } from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const saveSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setAuthToken(nextToken);
  };

  const clearSession = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.post("/auth/login", { email, password });
      saveSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const { data } = await authAPI.get("/auth/me");
      const nextUser = data.user;
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
    } catch {
      clearSession();
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      loading,
      login,
      logout: clearSession,
      refreshMe,
      isAuthenticated: Boolean(token && user)
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);