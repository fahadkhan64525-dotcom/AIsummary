"use client";

import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from "@/lib/api";
import type { PublicUser } from "@/types";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      try {
        const response = await getCurrentUser();
        if (!ignore) {
          startTransition(() => {
            setUser(response.user);
          });
        }
      } catch {
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async login(input) {
      const nextUser = await apiLogin(input);
      startTransition(() => {
        setUser(nextUser);
      });
    },
    async register(input) {
      const nextUser = await apiRegister(input);
      startTransition(() => {
        setUser(nextUser);
      });
    },
    async logout() {
      await apiLogout();
      startTransition(() => {
        setUser(null);
      });
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
