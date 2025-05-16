'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchMedia } from '@/lib/api';
import Link from 'next/link';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim() === '') {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchMedia(searchQuery);
        setResults(data.slice(0, 5)); // Only show first 5 results
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="relative flex items-center w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            className="w-full h-10 px-4 py-2 bg-base-200/50 border border-transparent rounded-full focus:outline-none focus:border-primary transition-colors"
          />
        </form>
        <div className="absolute right-3">
          <button className="btn btn-ghost btn-sm btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
      {/* Search Results Dropdown */}
      {showResults && searchQuery.trim() !== '' && (
        <div className="absolute w-full mt-2 bg-base-200 rounded-lg shadow-lg z-50">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-400">Loading...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((item, index) => (
                <Link
                  key={item.Id}
                  href={`/info?id=${item.Id}&type=${item.Type}`}
                  className="block px-4 py-2 hover:bg-gray-700 text-sm"
                  onClick={() => setShowResults(false)}
                >
                  {item.Name}
                </Link>
              ))}
              {results.length === 5 && (
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="block px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 border-t border-gray-700"
                  onClick={() => setShowResults(false)}
                >
                  View all results...
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
