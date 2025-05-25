"use client";

import { useAuthStore } from "./authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { isAuthenticated, userSession, isLoading, clearAuth } = useAuthStore();
    return {
    isAuthenticated,
    userSession,
    isLoading,
    user: userSession?.user?.user,
    logout: clearAuth
  };
}

export function useRequireAuth(redirectTo = "/auth/login") {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    isAuthenticated,
    isLoading
  };
}
