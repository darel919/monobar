"use client";

import withAuth from "@/lib/withAuth";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";

function ProfilePage() {
  const { userSession, clearAuth } = useAuthStore();
  const router = useRouter();
  const user = userSession?.user?.user_metadata || null;
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
    <main className="min-h-screen pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-lg opacity-70">Manage your account and preferences</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - User Info */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* User Profile Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                {user?.avatar_url ? (
                  <div className="avatar mb-4">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img 
                        src={user.avatar_url} 
                        alt={user?.full_name}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder mb-4">
                    <div className="bg-primary text-primary-content rounded-full w-24">
                      <span className="text-3xl font-bold">
                        {user?.full_name}
                      </span>
                    </div>
                  </div>
                )}
                
                <h2 className="card-title text-2xl mb-2">
                  {user?.full_name || "User"}
                </h2>
                <p className="text-sm opacity-70 mb-4">{user?.email}</p>
                
                {user?.role && (
                  <div className="badge badge-secondary badge-lg mb-4">
                    {user.role}
                  </div>
                )}
                  <button 
                  onClick={handleLogout}
                  className="btn btn-outline btn-error w-full"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Account Type</span>
                    <div className="badge badge-primary">Standard</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm opacity-70">Today</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Provider</span>
                    <span className="text-sm opacity-70">Google</span>
                  </div>
                </div>
              </div>
            </div>
          </div>          
          {/* Right Column - Activity */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Activity Placeholder */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity
                </h3>
                
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto opacity-20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2 opacity-60">No Recent Activity</h4>
                  <p className="text-sm opacity-40">Your activity will appear here once you start using the platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default withAuth(ProfilePage);
