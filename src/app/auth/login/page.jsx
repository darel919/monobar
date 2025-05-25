"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import LoginButton from "@/components/LoginButton";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectPath = searchParams.get('redirect');
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectPath || "/");
    }
  }, [isAuthenticated, isLoading, redirectPath, router]);
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-sm text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-xl font-mono font-bold mb-6">Login to DWS using your Google Account</h1>
      <LoginButton redirectPath={redirectPath} />
    </div>
  );
}
