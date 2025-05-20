"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import usePlaybackStore from '@/store/playbackStore';
import { getHome } from '@/lib/api';
import SearchBar from './SearchBar';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [homeData, setHomeData] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const { id, type } = usePlaybackStore(state => state);

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
  }, []);

  if (pathname === '/watch') {
    const href = id && type ? `/info?id=${id}&type=${type}` : '/';

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
      <div className={`navbar min-h-16 h-full transition-colors duration-200 ${isScrolled ? 'bg-secondary shadow-md' : 'bg-transparent'} px-2 sm:px-6`}>
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
              <ul className="menu p-4 w-80 min-h-full bg-secondary">
                <li>
                  <Link href="/" className='text-lg' onClick={() => document.getElementById('navbar-menu').checked = false}>Home</Link>
                </li>
                <li>
                  <Link href="/request" className='text-lg' onClick={() => document.getElementById('navbar-menu').checked = false}>Request</Link>
                </li>
                {homeData && homeData.map((item) => (
                  <li key={item.Id}>
                    <Link 
                      href={`/library?id=${item.Id}`} 
                      className='text-lg'
                      onClick={() => document.getElementById('navbar-menu').checked = false}
                    >
                      {item.Name}
                    </Link>
                  </li>
                ))}
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

        {/* Right section - Account Icon */}
        {/* <div className="flex-none">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
           
          </div>
        </div> */}
      </div>
    </div>
  );
}