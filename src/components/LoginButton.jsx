"use client";

import { openLoginWindow, redirectToLogin } from "@/lib/authUtils";
import { useState } from "react";

export default function LoginButton({ redirectPath, className = "" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    setIsLoading(true);
    setError(null);
    
    const currentPath = redirectPath || window.location.pathname;
      const popupOpened = openLoginWindow(currentPath, (errorMessage) => {
      setError(errorMessage);
      setIsLoading(false);
      
      setTimeout(() => {
        redirectToLogin(currentPath);
      }, 1000);
    });
      if (!popupOpened) {
      redirectToLogin(currentPath);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`
          btn btn-primary btn-lg
          flex items-center space-x-2
          ${isLoading ? 'loading' : ''}
          ${className}
        `}
      >
        {!isLoading && (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </span>
      </button>
      
      {error && (
        <div className="alert alert-warning max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <p className="text-sm text-gray-600 text-center max-w-sm">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
