"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from 'js-cookie';
import { getJellyId } from './api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userSession: null,
      isLoading: true,
      lastLogoutTime: null,      
      isLoggingOut: false,
      jellyUserId: null,
      jellyAccessToken: null,
      isJellyLoading: false,
      jellyAuthFailed: false,
      jellyAuthError: null,
        isSuperadmin: (state) => {
        return state.userSession?.user?.user?.user_metadata?.role === 'superadmin';
      },fetchJellyId: async (providerId) => {
        if (!providerId) {
          return;
        }
        
        try {
          set({ isJellyLoading: true, jellyAuthFailed: false, jellyAuthError: null });
          const data = await getJellyId(providerId);
            if (data && data.access_token && data.userId) {
            // Store in cookies for server-side access
            const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
            Cookies.set('jellyAccessToken', data.access_token, {
              path: '/',
              sameSite: 'lax',
              secure: isSecureContext,
              expires: 7 // 7 days
            });
            Cookies.set('jellyUserId', data.userId, {
              path: '/',
              sameSite: 'lax',
              secure: isSecureContext,
              expires: 7 // 7 days
            });
              set({ 
              jellyAccessToken: data.access_token,
              jellyUserId: data.userId,
              jellyAuthFailed: false, 
              jellyAuthError: null
            });          } else {
            set({ 
              jellyAccessToken: null,
              jellyUserId: null,
              jellyAuthFailed: true, 
              jellyAuthError: 'Server did not return valid Jelly credentials'
            });
          }        } catch (error) {
          set({ 
            jellyAccessToken: null,
            jellyUserId: null,
            jellyAuthFailed: true, 
            jellyAuthError: error.message || 'Unknown error occurred'
          });
        } finally {
          set({ isJellyLoading: false });
        }
      },        clearJellyAuth: () => {
        // Remove from cookies
        Cookies.remove('jellyAccessToken');
        Cookies.remove('jellyUserId');
        
        set({ 
          jellyAccessToken: null,
          jellyUserId: null,
          jellyAuthFailed: false, 
          jellyAuthError: null
        });
      },

      dismissJellyWarning: () => {
        set({ 
          jellyAuthFailed: false, 
          jellyAuthError: null 
        });
      },      
      retryJellyAuth: async () => {
        const currentState = get();
        if (currentState.userSession?.user?.user?.user_metadata?.provider_id) {
          // Reset the failed state before retrying
          set({ jellyAuthFailed: false, jellyAuthError: null });
          await get().fetchJellyId(currentState.userSession.user.user.user_metadata.provider_id);
        } else {
          throw new Error('No valid user session available for Jelly authentication');
        }
      },

      hasJellyAuth: () => {
        const state = get();
        const cookieAccessToken = Cookies.get('jellyAccessToken');
        const cookieUserId = Cookies.get('jellyUserId');
        return Boolean(
          (state.jellyAccessToken && state.jellyUserId) || 
          (cookieAccessToken && cookieUserId)
        );
      },        handleAuthSuccess: async (userSessionData) => {
        if (!userSessionData) return;

        console.log('handleAuthSuccess called with:', userSessionData);

        set({ 
          userSession: userSessionData,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Extract provider_id for Jelly authentication - handle different data structures
        const providerId = userSessionData?.user?.user_metadata?.provider_id || 
                          userSessionData?.user?.user?.user_metadata?.provider_id ||
                          userSessionData?.user?.id;
        
        console.log('Extracted provider ID:', providerId);
        
        if (providerId) {
          try {
            await get().fetchJellyId(providerId);
          } catch (error) {
            console.error('Failed to authenticate with Jelly:', error);
          }
        }
      },
      clearAuth: async () => {
        set({ isLoggingOut: true });

        get().clearJellyAuth();
          const domains = ['.darelisme.my.id', '.server.drl', 'localhost', 'monobar.server.drl', 'monobar.darelisme.my.id'];
        const paths = ['/', '/auth'];
        const cookieNames = ['user-session', 'session', 'auth-token', 'access_token', 'refresh_token', 'connect.sid', 'jellyAccessToken', 'jellyUserId'];
          domains.forEach(domain => {
          paths.forEach(path => {
            cookieNames.forEach(cookieName => {
              Cookies.remove(cookieName, { domain, path });
              Cookies.remove(cookieName, { path });
              Cookies.remove(cookieName);
            });
          });
        });

        localStorage.removeItem('user-session');
        localStorage.removeItem('auth-storage');
        sessionStorage.clear();

        try {
          await fetch(process.env.NEXT_PUBLIC_API_BASE_PATH_URL + '/dws/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.warn('Backend logout failed:', error);
        }

        set({
          isAuthenticated: false,
          userSession: null,
          isLoading: false,
          lastLogoutTime: Date.now()
        });

        setTimeout(() => {
          set({ isLoggingOut: false });
        }, 1000);
      },      fetchUserSession: async () => {
        try {
          set({ isLoading: true });          
          const storedSession = localStorage.getItem('user-session');
          
          if (storedSession) {
            try {
              const userData = JSON.parse(storedSession);
                if (userData?.id && userData?.user_metadata?.provider_id) {
                // Reconstruct the correct nested structure for userSession
                const reconstructedSession = {
                  user: {
                    user: userData
                  }
                };
                
                set({
                  userSession: reconstructedSession,
                  isAuthenticated: true,
                  isLoading: false
                });                  
                const cookieJellyAccessToken = Cookies.get('jellyAccessToken');
                const cookieJellyUserId = Cookies.get('jellyUserId');
                
                if (cookieJellyAccessToken && cookieJellyUserId) {
                  set({ 
                    jellyAccessToken: cookieJellyAccessToken,
                    jellyUserId: cookieJellyUserId
                  });
                } else if (userData.user_metadata?.provider_id) {
                  await get().fetchJellyId(userData.user_metadata.provider_id);
                }

                return reconstructedSession;
              }
            } catch (e) {
              console.error('Invalid stored session:', e);
            }
          }          
          const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_PATH_URL+'/dws/user?loginWithCookies=true', {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user session');
          }

          const data = await response.json();
          const userSessionData = data.data;

          get().handleAuthSuccess(userSessionData);
          return userSessionData;
        } catch (error) {
          console.error('Error fetching user session:', error);
          await get().clearAuth();
          return null;
        } finally {
          set({ isLoading: false });
        }
      },      
      initializeAuth: async () => {
        const currentStore = get();
        
        if (currentStore.lastLogoutTime && (Date.now() - currentStore.lastLogoutTime < 2000)) {
          set({ isLoading: false, isAuthenticated: false, userSession: null });
          return null;
        }
        
        if (currentStore.isAuthenticated && currentStore.userSession) {
          const cookieJellyAccessToken = Cookies.get('jellyAccessToken');
          const cookieJellyUserId = Cookies.get('jellyUserId');
          
          if (cookieJellyAccessToken && cookieJellyUserId && !currentStore.jellyAccessToken) {
            set({ 
              jellyAccessToken: cookieJellyAccessToken,
              jellyUserId: cookieJellyUserId
            });          
          } 
            else if (!cookieJellyAccessToken && !cookieJellyUserId && currentStore.userSession?.user?.user?.user_metadata?.provider_id) {
            await get().fetchJellyId(currentStore.userSession.user.user.user_metadata.provider_id);
          }
          
          set({ isLoading: false });
          return currentStore.userSession;
        }

        const storedSession = localStorage.getItem('user-session');
        if (!storedSession) {
          set({ isLoading: false, isAuthenticated: false, userSession: null });
          return null;
        }

        return await currentStore.fetchUserSession();
      },      checkAuthStatus: () => {
        const storedSession = localStorage.getItem('user-session');
        const currentState = get();
        
        // If everything is already properly set, skip unnecessary work
        if (currentState.isAuthenticated && currentState.jellyAccessToken && currentState.jellyUserId) {
          return;
        }
          if (storedSession && !currentState.isAuthenticated) {
          try {
            const userData = JSON.parse(storedSession);
            if (userData?.id && userData?.user_metadata?.provider_id) {
              // Reconstruct the correct nested structure
              const reconstructedSession = {
                user: {
                  user: userData
                }
              };
              
              set({
                userSession: reconstructedSession,
                isAuthenticated: true,
                isLoading: false
              });
              
              // Check for Jelly auth in cookies
              const cookieJellyAccessToken = Cookies.get('jellyAccessToken');
              const cookieJellyUserId = Cookies.get('jellyUserId');
              
              if (cookieJellyAccessToken && cookieJellyUserId && !currentState.jellyAccessToken) {
                set({ 
                  jellyAccessToken: cookieJellyAccessToken,
                  jellyUserId: cookieJellyUserId
                });
              }
            }
          } catch (e) {
            console.error('Invalid stored session:', e);
          }
        } else if (!storedSession && currentState.isAuthenticated) {
          set({
            isAuthenticated: false,
            userSession: null,
            isLoading: false
          });
          get().clearJellyAuth();
        } else if (currentState.isAuthenticated && !currentState.jellyAccessToken) {
          const cookieJellyAccessToken = Cookies.get('jellyAccessToken');
          const cookieJellyUserId = Cookies.get('jellyUserId');
          
          if (cookieJellyAccessToken && cookieJellyUserId) {
            set({ 
              jellyAccessToken: cookieJellyAccessToken,
              jellyUserId: cookieJellyUserId
            });
          }
        }
      }}),    {
      name: "auth-storage",      
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userSession: state.userSession,
        lastLogoutTime: state.lastLogoutTime,
        isLoggingOut: state.isLoggingOut,
        jellyAuthFailed: state.jellyAuthFailed
      })
    }
  )
);

if (typeof window !== 'undefined') {  window.addEventListener('storage', (e) => {
    if (e.key === 'user-session') {
      useAuthStore.getState().checkAuthStatus();
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'AUTH_SUCCESS') {
      setTimeout(() => {
        useAuthStore.getState().checkAuthStatus();
      }, 100);
    }
  });

  const checkAuthSuccess = () => {
    const authSuccess = localStorage.getItem('authSuccess');
    if (authSuccess === 'true') {
      localStorage.removeItem('authSuccess');
      useAuthStore.getState().checkAuthStatus();
    }
  };

  const authCheckInterval = setInterval(checkAuthSuccess, 1000);
  
  setTimeout(() => {
    clearInterval(authCheckInterval);
  }, 30000);
}
