"use client";

import { useAuthStore } from "@/lib/authStore";
import { useEffect } from "react";

export default function SessionInitializer() {
  const { initializeAuth, checkAuthStatus, isLoading } = useAuthStore();  useEffect(() => {
    initializeAuth();
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [initializeAuth, checkAuthStatus]);
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-base-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-sm opacity-70">Initializing session...</p>
        </div>
      </div>
    );
  }

  return null;
}
