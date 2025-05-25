"use client";

import { useAuthStore } from "@/lib/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleAuthSuccess } = useAuthStore();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);  
  async function handleAuth() {
    try {
      const accessToken = searchParams.get("at");
      const refreshToken = searchParams.get("rt");
      
      console.log('Auth page - received tokens:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        accessTokenPreview: accessToken ? accessToken.substring(0, 50) + '...' : null
      });
      
      if (accessToken) {
        const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_PATH_URL+'/dws/user?loginWithCookies=true', {
          credentials: 'include'
        });

          if (!response.ok) {
            throw new Error(`Failed to authenticate with backend: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('API response:', data);
        await handleAuthSuccess(data.data);

        window.localStorage.setItem('authSuccess', 'true');
        if (window.opener) {
          try {
            console.log('Notifying parent window of auth success');
            window.opener.localStorage.setItem('authSuccess', 'true');
            window.opener.postMessage({ type: 'AUTH_SUCCESS' }, '*');
            
            // Force the parent window to check auth status
            if (window.opener.useAuthStore) {
              console.log('Calling checkAuthStatus on parent window');
              window.opener.useAuthStore.getState().checkAuthStatus();
            }
            
            console.log('Closing popup window in 500ms');
          } catch (e) {
            console.error("Error notifying parent window:", e);
          }
          
          setTimeout(() => {
            window.close();
          }, 500);
          return;
        }
        
        const redirectPath = localStorage.getItem("redirectAfterAuth") || searchParams.get("redirect") || "/";
        localStorage.removeItem("redirectAfterAuth");
        
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      } else {
        setError("Authentication failed - no tokens received");
        setProcessing(false);
        
        if (window.opener) {
          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          setTimeout(() => {
            router.push("/unauthorized");
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error in auth process:", err);
      setError(`Authentication error: ${err.message}`);
      setProcessing(false);
    }
  }

  useEffect(() => {
    handleAuth();
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 font-mono">
      <div className="mt-4 text-center">
        {processing && !error ? (
          <section className="flex flex-col items-center justify-center">
            <span className="loading loading-spinner loading-lg mb-4"></span>
            <h1 className="font-bold text-4xl mt-8">Validating your authentication session, please wait...</h1>
          </section>
        ) : error ? (
          <section className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-16 text-error">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h1 className="text-4xl font-bold my-8">{error}</h1>
          </section>
        ) : null}
      </div>
    </div>
  );
}
