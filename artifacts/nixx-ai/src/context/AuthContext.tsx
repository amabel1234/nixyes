import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

interface StoredUser {
  id: number;
  email: string;
  username: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "nx-users-db";
const SESSION_KEY = "nx-session-user";

let _idCounter = 0;

function getStoredUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const u = JSON.parse(stored) as AuthUser;
        setUser(u);
        setToken("local-token");
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) {
      throw new Error("Email atau password salah. Belum punya akun? Silakan daftar dulu.");
    }
    const authUser: AuthUser = { id: found.id, email: found.email, username: found.username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setToken("local-token");
    setUser(authUser);
  };

  const register = async (email: string, username: string, password: string) => {
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email sudah terdaftar. Silakan masuk atau gunakan email lain.");
    }
    _idCounter = _idCounter || Date.now();
    const newUser: StoredUser = {
      id: ++_idCounter,
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password,
    };
    users.push(newUser);
    saveUsers(users);
    const authUser: AuthUser = { id: newUser.id, email: newUser.email, username: newUser.username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setToken("local-token");
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
