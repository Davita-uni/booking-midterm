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

  // New organizers are logged in with status "pending": they only see the
  // account status page until an admin approves them.
  const register = async (form) => startSession(await api("/auth/register", { method: "POST", body: form }));

  // Reloads the current user, e.g. to see whether an admin approved the account.
  const refresh = async () => {
    const data = await api("/auth/me");
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // the local session is cleared either way
    }
    endSession();
    navigate("/login");
  };

  // After a profile edit: keep the header and menus in sync.
  const updateUser = (account) =>
    setUser((u) => ({
      ...u,
      name: account.name,
      email: account.email,
      organization: account.organization,
      currency: account.currency,
    }));

  // The server ends every session when the password changes, so log in again.
  const passwordChanged = () => {
    endSession();
    navigate("/login?password=1", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout, refresh, updateUser, passwordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Where to go after logging in or signing up
export const homeFor = (user) => (user.status === "pending" ? "/account/status" : "/");

export const STATUS_LABEL = { pending: "Pending approval", active: "Active", suspended: "Suspended" };

export const ROLE_LABEL = { admin: "Admin", organizer: "Organizer", attendee: "Attendee" };
