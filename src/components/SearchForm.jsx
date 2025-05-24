"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchForm({ initialQuery = "", initialAllowLookup = false, onlineLookupError = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [allowLookup, setAllowLookup] = useState(initialAllowLookup);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showLoading, setShowLoading] = useState(false); 
  useEffect(() => {

    if (onlineLookupError === true && allowLookup === true) {
      setAllowLookup(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("allowLookup");
      params.set("error", "lookup");
      
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
      });
    }
  }, [onlineLookupError]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAllowLookup = params.get("allowLookup") === "true";
    if (!onlineLookupError) {
      setAllowLookup(urlAllowLookup);
    }
  }, [searchParams, onlineLookupError]);
  const handleCheckbox = (e) => {
    const checked = e.target.checked;
    setAllowLookup(checked);

    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("allowLookup", "true");
      params.delete("error"); 
      setShowLoading(true);
    } else {
      params.delete("allowLookup");
      params.delete("error");
      setShowLoading(false);
    }

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <>
      <form className="w-full flex flex-col gap-4" action="/search" method="get">
        <input
          type="text"
          name="q"
          className="input input-bordered w-full"
          placeholder="Search..."
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
        />
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
        </label>
        <button type="submit" className="btn btn-primary w-full text-inherit" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Loading
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>
    </>
  );
}
