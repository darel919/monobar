"use client";

import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function withAuth(WrappedComponent) {
  return function AuthComponent(props) {
    const { isAuthenticated, isLoading, isLoggingOut } = useAuthStore();
    const router = useRouter();    useEffect(() => {
      if (!isLoading && !isAuthenticated && !isLoggingOut) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, [isAuthenticated, isLoading, isLoggingOut, router]);if (isLoading) {
      return (
        <div className="min-h-screen pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center space-y-4">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-sm opacity-70">Checking authentication...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center space-y-4">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-sm opacity-70">Redirecting to login...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
