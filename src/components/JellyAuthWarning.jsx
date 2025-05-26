"use client";

import { useAuthStore } from "@/lib/authStore";
import { useState, useEffect } from "react";

export default function JellyAuthWarning() {
  const { 
    jellyAuthFailed, 
    jellyAuthError, 
    isAuthenticated,
    dismissJellyWarning, 
    retryJellyAuth,
    isJellyLoading,
    hasJellyAuth
  } = useAuthStore();
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  useEffect(() => {
    if (hasJellyAuth() && !jellyAuthFailed) {
      const modal = document.getElementById('jelly_auth_modal');
      if (modal && modal.open) {
        modal.close();
      }
    }
  }, [hasJellyAuth, jellyAuthFailed]);

  if (!isAuthenticated || !jellyAuthFailed) {
    return null;
  }

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      await retryJellyAuth();
    } catch (error) {
      console.error('Retry failed:', error);
      setRetryError(error.message || 'Failed to retry connection. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };
  const openModal = () => {
    setRetryError(null);
    document.getElementById('jelly_auth_modal').showModal();
  };

  return (
    <>
      {/* Warning Button */}
      <button 
        onClick={openModal}
        className="btn btn-sm btn-warning btn-outline"
        title="Personalization services are disabled"
      >
        <svg 
          className="w-4 h-4 mr-1" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        Personalization disabled
      </button>

      {/* DaisyUI Modal */}
      <dialog id="jelly_auth_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-warning flex items-center">
            <svg 
              className="w-6 h-6 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            Personalization Services Disabled
          </h3>
          
          <div className="py-4">
            <p className="text-base-content/80 mb-3">
              Monobar couldn't connect to personalization services using your account. 
              This means you'll have access to basic features only.
            </p>
            
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <h4 className="font-semibold text-sm mb-2">What's affected:</h4>
              <ul className="text-sm text-base-content/70 list-disc list-inside space-y-1">
                <li>Personalized recommendations</li>
                <li>Viewing history sync</li>
                <li>Custom libraries and collections</li>
                <li>Advanced user preferences</li>
              </ul>
            </div>            {jellyAuthError && (
              <div className="bg-error/10 border border-error/20 p-3 rounded-lg mb-4">
                <h4 className="font-semibold text-sm text-error mb-1">Error Details:</h4>
                <p className="text-sm text-error/80">{jellyAuthError}</p>
              </div>
            )}

            {retryError && (
              <div className="bg-error/10 border border-error/20 p-3 rounded-lg mb-4">
                <h4 className="font-semibold text-sm text-error mb-1">Retry Failed:</h4>
                <p className="text-sm text-error/80">{retryError}</p>
              </div>
            )}
          </div>

          <div className="modal-action">
            <button
              onClick={handleRetry}
              disabled={isRetrying || isJellyLoading}
              className="btn btn-warning"
            >
              {isRetrying || isJellyLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Retrying...
                </>
              ) : (
                'Retry Connection'
              )}
            </button>
            
            <button
              onClick={dismissJellyWarning}
              className="btn btn-ghost"
            >
              Don't show again
            </button>
            
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
        
        {/* Close modal when clicking outside */}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
