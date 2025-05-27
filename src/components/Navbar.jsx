"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getHome } from '@/lib/api';
import SearchBar from './SearchBar';
import { useAuthStore } from '@/lib/authStore';
import JellyAuthWarning from './JellyAuthWarning';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [homeData, setHomeData] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, userSession, clearAuth, isLoading } = useAuthStore();

  useEffect(() => {
    setIsHydrated(true);
    const cached = sessionStorage.getItem('homeData');
    if (cached) {
      setHomeData(JSON.parse(cached));
    } else {
      const fetchHomeData = async () => {
        try {
          const data = await getHome();
          if (data?.length) {
            setHomeData(data);
            sessionStorage.setItem('homeData', JSON.stringify(data));
          }
        } catch (err) {
          console.error('Failed to load libraries:', err);
        }
      };
      fetchHomeData();
    }
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);  if (pathname === '/watch') {
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const seriesId = searchParams.get('seriesId');
    
    let href = '/';
    if (seriesId) {
      href = `/info?id=${seriesId}&type=Series`;
    } else if (id && type) {
      href = `/info?id=${id}&type=${type}`;
    }

    return (
      <div className="w-full h-16 fixed top-0 left-0 right-0 z-[99]">
        <div className={`navbar min-h-16 h-full transition-colors duration-200 px-2 sm:px-6`}>
          <Link href={href} className="flex items-center flex-row w-12 ">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-16 fixed top-0 left-0 right-0 z-[99]">
      <div className={`navbar min-h-16 h-full transition-colors duration-200 ${isScrolled ? 'bg-base-200 shadow-md' : 'bg-transparent'} px-2 sm:px-6`}>
        {/* Left section */}
        <div className="flex-none flex items-center gap-2">
          <div className="drawer">
            <input id="navbar-menu" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
              <label htmlFor="navbar-menu" className="btn btn-ghost p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
            </div>
            {/* Navigation Drawer */}
            <div className="drawer-side z-[100] left-0">
              <label htmlFor="navbar-menu" aria-label="close sidebar" className="drawer-overlay"></label>              
              <ul className="menu p-4 w-80 min-h-full bg-base-200">
                <li>
                  <Link 
                    href="/" 
                    className={`text-lg${pathname === '/' ? ' bg-base-300 font-bold' : ''}`} 
                    onClick={() => document.getElementById('navbar-menu').checked = false}
                  >
                    Home
                  </Link>
                </li>
                {homeData && homeData.map((item) => (
                  <li key={item.Id}>
                    <Link 
                      href={`/library?id=${item.Id}`} 
                      className={`text-lg${pathname === '/library' && searchParams.get('id') === item.Id ? ' bg-base-300 font-bold' : ''}`}
                      onClick={() => document.getElementById('navbar-menu').checked = false}
                    >
                      {item.Name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link 
                    href="/request" 
                    className={`text-lg${pathname === '/request' ? ' bg-base-300 font-bold' : ''}`} 
                    onClick={() => document.getElementById('navbar-menu').checked = false}
                  >
                    Request
                  </Link>
                </li>
                <div className="divider"></div>
                <li>
                  <Link 
                    href="/settings" 
                    className={`text-lg${pathname === '/settings' ? ' bg-base-300 font-bold' : ''}`} 
                    onClick={() => document.getElementById('navbar-menu').checked = false}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Link href="/" className="hidden sm:flex items-center">
            <Image
              src="/favicon.ico"
              width={48}
              height={48}
              alt="darel's Projects"
              priority
            />
          </Link>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 px-4 max-w-3xl mx-auto">
          <SearchBar />
        </div>        
        {/* Right section - Authentication */}
        <div className="flex-none flex items-center gap-2">
          {/* Jelly Auth Warning Button */}
          <JellyAuthWarning />
          
          {isLoading ? (
            <div className="loading loading-spinner loading-sm"></div>         
           ) : isAuthenticated && userSession ? (
            <div className="dropdown dropdown-end">
              <Link href="/profile" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {userSession.user?.user_metadata?.avatar_url ? (
                    <img 
                      alt={userSession.user?.user_metadata?.full_name || userSession.user?.email}
                      src={userSession.user.user_metadata.avatar_url} 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-content font-bold">
                        {userSession.user?.user_metadata?.full_name?.[0] || userSession.user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link href="/auth/login" className="btn btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}