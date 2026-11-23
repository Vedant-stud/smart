import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("sca_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sca_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("sca_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("sca_token");
        localStorage.removeItem("sca_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    // The backend's /api/auth/login is a standard OAuth2 password-flow
    // endpoint (FastAPI's OAuth2PasswordRequestForm), which expects
    // form-urlencoded "username"/"password" fields rather than JSON.
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);
    const res = await client.post("/api/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("sca_token", res.data.access_token);
    localStorage.setItem("sca_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (full_name, email, password) => {
    const res = await client.post("/api/auth/register", { full_name, email, password });
    localStorage.setItem("sca_token", res.data.access_token);
    localStorage.setItem("sca_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("sca_token");
    localStorage.removeItem("sca_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
