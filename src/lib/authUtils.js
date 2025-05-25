"use client";

import { useAuthStore } from "./authStore";

export function openLoginWindow(currentPath, onAuthCancelled) {
  localStorage.setItem("redirectAfterAuth", currentPath);
  
  sessionStorage.removeItem("redirectionCompleted");
  sessionStorage.removeItem("authCancelled");
  localStorage.removeItem("authSuccess");
  
  const redirectUrl = encodeURIComponent(`${window.location.origin}/auth`);
  const authUrl = `${process.env.NEXT_PUBLIC_DARELISME_URL}/auth/login?redirectExternal=${redirectUrl}`;
  
  const loginWindow = window.open(authUrl, 'darelismeLogin', 'width=600,height=700');
  
  if (!loginWindow) {
    alert("Please allow popups for this site to enable login");
    if (onAuthCancelled) onAuthCancelled("Popup was blocked");
    return false;
  }
  
  let authDetected = false;
    const checkWindowClosed = setInterval(() => {
    if (authDetected) return;
    
    try {
      // Check multiple indicators of successful auth
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      const authSuccessFlag = localStorage.getItem('authSuccess') === 'true';
      const userSessionExists = localStorage.getItem('user-session');
      
      console.log('Auth check:', { isAuthenticated, authSuccessFlag, hasUserSession: !!userSessionExists });
      
      if (isAuthenticated) {
        console.log('Auth detected via store state');
        clearInterval(checkWindowClosed);
        authDetected = true;
        // Redirect after successful authentication
        const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
        localStorage.removeItem("redirectAfterAuth");
        window.location.href = redirectPath;
        return;
      }
      
      if (authSuccessFlag) {
        console.log('Auth detected via localStorage flag');
        localStorage.removeItem('authSuccess');
        clearInterval(checkWindowClosed);
        authDetected = true;
        // Trigger auth store check and wait a moment
        useAuthStore.getState().checkAuthStatus();
        setTimeout(() => {
          const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
          localStorage.removeItem("redirectAfterAuth");
          window.location.href = redirectPath;
        }, 100);
        return;
      }
      
      if (loginWindow.closed) {
        console.log('Login window closed, performing final auth check');
        clearInterval(checkWindowClosed);
        
        // Give a moment for any final auth processing
        setTimeout(() => {
          const finalAuthCheck = useAuthStore.getState().isAuthenticated;
          const finalStorageCheck = localStorage.getItem('authSuccess') === 'true';
          const finalUserSession = localStorage.getItem('user-session');
          
          console.log('Final auth check:', { finalAuthCheck, finalStorageCheck, hasFinalUserSession: !!finalUserSession });
          
          if (finalAuthCheck || finalStorageCheck || finalUserSession) {
            localStorage.removeItem('authSuccess');
            authDetected = true;
            // Force auth state refresh
            useAuthStore.getState().checkAuthStatus();
            // Redirect after successful authentication
            const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
            localStorage.removeItem("redirectAfterAuth");
            window.location.href = redirectPath;          
          } else {
          sessionStorage.setItem("authCancelled", "true");
          if (onAuthCancelled) onAuthCancelled("Login window was closed");
        }
        }, 500);
      }
    } catch (e) {
      console.error("Error checking auth status:", e);
    }
  }, 500);
  
  return true;
}

export function redirectToLogin(currentPath) {
  localStorage.setItem("redirectAfterAuth", currentPath);
  sessionStorage.removeItem("redirectionCompleted");
  const redirectUrl = encodeURIComponent(`${window.location.origin}/auth`);
  window.location.href = `${process.env.NEXT_PUBLIC_DARELISME_URL}/auth/login?redirectExternal=${redirectUrl}`;
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  
  return {
    isAuthenticated,
    checkAuth: () => {
      return isAuthenticated;
    }
  };
}
