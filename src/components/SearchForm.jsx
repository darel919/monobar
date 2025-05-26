"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseSearchInput, getSearchPlaceholder, buildSearchUrl } from '@/lib/searchUtils';

export default function SearchForm({ initialQuery = "", initialAllowLookup = false, onlineLookupError = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [allowLookup, setAllowLookup] = useState(initialAllowLookup);
  const [lastAllowLookup, setLastAllowLookup] = useState(initialAllowLookup);
  const [activePrefix, setActivePrefix] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();  const [showLoading, setShowLoading] = useState(false);
  const placeholder = activePrefix ? getSearchPlaceholder(`${activePrefix}:`) : getSearchPlaceholder(query);
  const searchInputRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    const queryParam = params.get('q');

    if (typeParam) {
      setActivePrefix(typeParam);
      setQuery(queryParam || ''); 
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    if (typeParam) {
      if (allowLookup) setLastAllowLookup(allowLookup);
      if (allowLookup !== false) setAllowLookup(false);
      if (params.get('allowLookup')) {
        params.delete('allowLookup');
        startTransition(() => {
          router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
        });
      }
    }
  }, [searchParams]);


  const debouncedUpdateURL = useCallback((newQuery, options = {}) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const { hasPrefix, type, query: parsedQuery } = parseSearchInput(newQuery);

      if (!hasPrefix || (hasPrefix && (type && (parsedQuery !== undefined)))) {
        let searchUrl;
        if (hasPrefix && type) {

          if (!parsedQuery) {
            searchUrl = buildSearchUrl('', {
              type,
              allowLookup: allowLookup ? 'true' : undefined,
              ...options
            });
          } else {

            searchUrl = buildSearchUrl(parsedQuery, {
              type,
              allowLookup: allowLookup ? 'true' : undefined,
              ...options
            });
          }
        } else {
          searchUrl = buildSearchUrl(newQuery, {
            allowLookup: allowLookup ? 'true' : undefined,
            ...options
          });
        }
        startTransition(() => {
          router.replace(searchUrl);
        });
      }
    }, 300);
  }, [router, allowLookup]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (onlineLookupError === true && allowLookup === true) {
      setAllowLookup(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("allowLookup");
      params.set("error", "lookup");
      
      if (query) params.set("q", query);
      else params.delete("q");

      startTransition(() => {
        router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
      });
    }
  }, [onlineLookupError, query, allowLookup, router, searchParams]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAllowLookup = params.get("allowLookup") === "true";

    if (!onlineLookupError && activePrefix === null) {
      setAllowLookup(urlAllowLookup);
    }
  }, [searchParams, onlineLookupError, activePrefix]);  useEffect(() => {
    const isInPrefixMode = activePrefix !== null;
    if (isInPrefixMode) {
      if (allowLookup) {
        setLastAllowLookup(allowLookup); 
        setAllowLookup(false);
      }
    } else {
      if (!allowLookup && lastAllowLookup) {
        setAllowLookup(lastAllowLookup);

        const params = new URLSearchParams(window.location.search);
        if (!params.get('allowLookup')) {
          params.set('allowLookup', 'true');
          startTransition(() => {
            router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
          });
        }
      }
    }
  }, [activePrefix, allowLookup, lastAllowLookup, router]);  const handleCheckbox = (e) => {
    const checked = e.target.checked;
    const isInPrefixMode = activePrefix !== null;
    
    if (checked && isInPrefixMode) {
      return;
    }
    
    setAllowLookup(checked);
    setShowLoading(checked);

    let searchUrl;
    if (activePrefix) {
      searchUrl = buildSearchUrl(query, { 
        type: activePrefix,
        allowLookup: checked ? 'true' : undefined,
        error: undefined
      });
    } else {
      searchUrl = buildSearchUrl(query, { 
        allowLookup: checked ? 'true' : undefined,
        error: undefined
      });
    }
    
    startTransition(() => router.replace(searchUrl));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    let searchUrl;
    if (activePrefix) {
      searchUrl = buildSearchUrl(query, { 
        type: activePrefix,
        allowLookup: allowLookup ? 'true' : undefined 
      });
    } else {
      searchUrl = buildSearchUrl(query, { 
        allowLookup: allowLookup ? 'true' : undefined 
      });
    }
    router.push(searchUrl);
  };
  const handleQueryChange = (e) => {
    let newQuery = e.target.value;

    if (activePrefix) {

      setQuery(newQuery);
      debouncedUpdateURL(newQuery ? `${activePrefix}:${newQuery}` : `${activePrefix}:`);
    } else {

      let { type, query: parsedQuery, hasPrefix } = parseSearchInput(newQuery);

      if (type && hasPrefix) {
        setActivePrefix(type);
        setQuery(parsedQuery || '');

        debouncedUpdateURL(parsedQuery ? `${type}:${parsedQuery}` : `${type}:`);
      } else {
        setActivePrefix(null);
        setQuery(newQuery);
        debouncedUpdateURL(newQuery);
      }
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && query === '' && activePrefix) {
      setActivePrefix(null);
      setQuery('');
      debouncedUpdateURL('');
      e.preventDefault();
    }
  };

  const handlePrefixRemove = () => {
    const { query: parsedQuery } = parseSearchInput(query);
    setQuery(parsedQuery || '');
    setActivePrefix(null);

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    debouncedUpdateURL(parsedQuery || '');
  };

  return (
    <form className="w-full flex flex-col gap-4" action="/search" method="get" onSubmit={handleSubmit}>        
      <div className="relative flex items-center w-full">
        {activePrefix && (
          <div className="absolute left-2 flex items-center gap-1 z-10">
            <div className="bg-secondary px-4 py-1 rounded-none text-sm flex items-center gap-2 shadow-sm">
              {activePrefix}
            </div>
          </div>
        )}
        <input
          ref={searchInputRef}
          type="text"
          name="q"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          className={`input input-bordered w-full ${
            activePrefix ? 'pl-22' : ''
          }`}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus
        />
        {showLoading && isPending && (
          <div className="loading loading-spinner loading-sm absolute right-12" />
        )}
      </div>      {/* Hidden inputs for type and q, only set q if there is a query after the prefix */}
      <input type="hidden" name="type" value={activePrefix || ''} />
      {activePrefix && query && (
        <input type="hidden" name="q" value={query} />
      )}
      
      {/* Online Lookup Checkbox - only show if not in prefix mode */}
      {!activePrefix && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="allowLookup"
            value="true"
            checked={allowLookup}
            onChange={handleCheckbox}
            className="checkbox"
          />
          <span className="label-text">Online Lookup</span>
        </label>      )}
      
      <button type="submit" className="btn btn-primary w-full text-inherit" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Loading
          </span>
        ) : 'Search'}
      </button>
    </form>
  );
}
