'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { search } from '@/lib/api';
import { parseSearchInput, getSearchPlaceholder, buildSearchUrl, SEARCH_TYPES } from '@/lib/searchUtils';
import Link from 'next/link';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrefix, setActivePrefix] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchContainerRef = useRef(null);
  const router = useRouter();
  
  const placeholder = activePrefix ? SEARCH_TYPES[activePrefix].placeholder : 'Search';

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
        setHasSearched(false);
        return;
      }

      const fullQuery = activePrefix ? `${activePrefix}:${searchQuery}` : searchQuery;
      setIsLoading(true);
      try {
        const data = await search(searchQuery, { type: activePrefix });
        setResults(data.slice(0, 5));
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activePrefix]);

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    const { type, hasPrefix } = parseSearchInput(newQuery);

    if (activePrefix) {
      if (newQuery === '') {
        setActivePrefix(null);
        setSearchQuery('');
        return;
      }
      setSearchQuery(newQuery);
    } else {
      if (type && hasPrefix) {
        setActivePrefix(type);
        setSearchQuery('');
      } else {
        setSearchQuery(newQuery);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && searchQuery === '' && activePrefix) {
      setActivePrefix(null);
      setSearchQuery('');
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || activePrefix) {
      const fullQuery = activePrefix ? `${activePrefix}:${searchQuery}` : searchQuery;
      const searchUrl = buildSearchUrl(fullQuery);
      router.push(searchUrl);
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>      
    <div className="relative flex items-center w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative w-full">            
            {activePrefix && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <div className="bg-base-300/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {activePrefix}
                  <button
                    type="button"
                    onClick={() => {
                      setActivePrefix(null);
                      setSearchQuery('');
                      if (window.location.pathname === '/search') {
                        router.replace('/search');
                      }
                    }}
                    className="hover:text-error transition-colors opacity-50 hover:opacity-100"
                    aria-label="Clear search type"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}            {!activePrefix && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowResults(true)}              
              className={`input w-full bg-base-200 hover:bg-base-300 focus:bg-base-100 border-none rounded-full ${activePrefix ? 'pl-28' : 'pl-10'} pr-4`}
              placeholder={placeholder}
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="loading loading-spinner loading-sm opacity-50">

                </div>
              </div>
            )}
          </div>
        </form>
      </div>{showResults && searchQuery.trim() !== '' && (
        <div className="absolute top-full w-full">
          <div className="relative mt-2">
            <div className="absolute w-full bg-base-200 rounded-2xl shadow-xl overflow-hidden">
              {isLoading ? (
                <div className="p-4 text-sm opacity-50 flex items-center gap-2">
                  <div className="loading loading-spinner loading-xs"></div>
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div>
                  {results.map((item, index) => (
                    <Link
                      key={index}
                      href={activePrefix === 'genre' ? `/library?genreId=${item.id}` : `/info?id=${item.id}&type=${item.type || "Movie"}`}
                      className="block px-4 py-2 hover:bg-base-300 transition-colors"
                      onClick={() => setShowResults(false)}
                    >
                      <section className="py-1">
                        <h2 className="text-lg">{item.OriginalTitle || item.Name} {item.ProductionYear && <span className='opacity-50'>({item.ProductionYear})</span>}</h2>
                        <h2 className="text-xs truncate opacity-50">{item.Overview}</h2>
                      </section>
                    </Link>
                  ))}
                  {results.length === 5 && (
                    <Link
                      href={buildSearchUrl(activePrefix ? `${activePrefix}:${searchQuery}` : searchQuery)}
                      className="block px-4 py-3 text-sm hover:bg-base-300/50 transition-colors border-t border-base-300/20font-medium text-primary"
                      onClick={() => setShowResults(false)}
                    >
                      View all results...
                    </Link>
                  )}
                </div>
              ) : (!isLoading && hasSearched && searchQuery.trim() !== '') ? (
                <div className="p-4 text-sm opacity-50">No results found</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
