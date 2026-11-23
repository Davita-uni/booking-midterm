import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore, setUnauthorizedHandler } from "./api.js";
import { navigate } from "./router.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until we know whether a saved token is still valid
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const endSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
      navigate("/login?expired=1", { replace: true });
    });
    if (!tokenStore.get()) return;
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => endSession())
      .finally(() => setChecking(false));
  }, [endSession]);

  const startSession = (data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) =>
    startSession(await api("/auth/login", { method: "POST", body: { email, password } }));

  const register = async (form) => startSession(await api("/auth/register", { method: "POST", body: form }));

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // the local session is cleared either way
    }
    endSession();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const ROLE_LABEL = { admin: "Admin", organizer: "Organizer", attendee: "Attendee" };
