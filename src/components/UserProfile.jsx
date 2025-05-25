"use client";

import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";

export default function UserProfile({ className = "" }) {
  const { userSession, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !userSession) {
    return null;
  }
  const user = userSession.user.user;
  const handleLogout = async () => {
    try {
      await clearAuth();
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex items-center space-x-4">
          {user.user_metadata?.avatar_url && (
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt={user.user_metadata?.full_name || user.email}
                />
              </div>
            </div>
          )}
          
          <div className="flex-1">
            <h2 className="card-title">
              {user.user_metadata?.full_name || user.email}
            </h2>
            <p className="text-sm opacity-70">{user.email}</p>
            {user.user_metadata?.role && (
              <div className="badge badge-secondary badge-sm mt-1">
                {user.user_metadata.role}
              </div>
            )}
          </div>
        </div>
        
        <div className="card-actions justify-end mt-4">
          <button 
            onClick={handleLogout}
            className="btn btn-outline btn-error btn-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
