import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API } from "@/lib/api";

const TOKEN_KEY = "blacusa-token";
const AuthContext = createContext(null);

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

// Authenticated axios client (token attached automatically). Used by admin + readers.
export const adminClient = axios.create({ baseURL: API });
adminClient.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
adminClient.interceptors.response.use((response) => {
  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("text/html") || (typeof response.data === "string" && response.data.trim().startsWith("<!DOCTYPE"))) {
    throw new Error("Expected JSON, but received HTML. Verify REACT_APP_BACKEND_URL environment variable.");
  }
  return response;
});

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null=checking, false=anon, obj=logged in
  const [ready, setReady] = useState(false);

  const check = useCallback(async () => {
    if (!getToken()) { setUser(false); setReady(true); return; }
    try {
      const { data } = await adminClient.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
