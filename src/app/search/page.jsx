"use server";

import { search, getRecommendations } from '@/lib/api';
import LibraryViewDisplay from '@/components/LibraryViewDisplay';
import SearchForm from '@/components/SearchForm';
import { getSearchTypeDisplayName } from '@/lib/searchUtils';
import GenresView from '@/components/GenreViewDisplay';
import { Suspense } from 'react';

export default async function SearchPage({ searchParams }) {  
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || null;
  let allowLookup = params.allowLookup === 'true';
  const errorParam = params.error;
  const isDev = process.env.NODE_ENV === "development";
  let results = [];
  let error = null;
  let onlineLookupError = false;  if (errorParam === 'lookup' && !allowLookup) {
    error = "Unable to use online lookup";
  } else if (query) {
    try {
      results = await search(query, { includeExternal: allowLookup, type });
      if (isDev) {
        console.log("Search Results: ", results);
      }
    } catch (e) {
      error = e.message;
    }
  } else if (allowLookup) {
    try {
      results = await getRecommendations();
      if (isDev) {
        console.log("Recommendations: ", results);
      }    
    } catch (e) {
      if (isDev) {
        console.log("getRecommendations error: ", e);
      }      error = "Unable to use online lookup";
      onlineLookupError = true;
    }
  }

  const initialQuery = query;

  const searchTypeDisplay = type ? getSearchTypeDisplayName(type) : null;
  return (
    <div className="flex min-h-screen items-center justify-center flex-col p-4 sm:p-8 mt-16">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">
        Search{searchTypeDisplay && ` - ${searchTypeDisplay}`}
      </h1>      {/* Search Form */}
      <div className="w-full max-w-xl bg-base-200 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <Suspense fallback={
          <div className="flex items-center justify-center p-4">
            <div className="loading loading-spinner loading-md"></div>
            <span className="ml-2 text-sm text-gray-500">Loading search...</span>
          </div>
        }>
          <SearchForm 
            initialQuery={initialQuery} 
            initialAllowLookup={allowLookup} 
            onlineLookupError={onlineLookupError}
          />
        </Suspense>
      </div>{/* Results */}
      <div className="w-full max-w-6xl">
        {/* Display error message if there's an error */}
        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
          {query && results.length > 0 && (
          <div className="text-base text-center mb-4 text-base-content/70">
            {results.length} result{results.length !== 1 ? 's' : ''} found{searchTypeDisplay && ` for ${searchTypeDisplay.toLowerCase()}`}
          </div>
        )}
          {!query && allowLookup && results.length > 0 ? (
          <>
            <div className="text-base text-center mb-4 text-base-content/70">Recommended to request</div>
            <LibraryViewDisplay data={results} viewMode="default_search"/>
          </>
        ) : !query && type === 'genre' ? (
          <GenresView />
        ) : !query && !error ? (
          <p className="text-gray-400 text-center">Please enter a search query</p>        ) : query && !error && results.length > 0 ? (
          <LibraryViewDisplay 
            data={results} 
            viewMode={type === 'genre' ? "default_search_genre" : "default_search"}
          />
        ) : query && !error && results.length === 0 ? (
          <div className="text-gray-400 text-center">
            No results found for "{query}"{searchTypeDisplay && ` in ${searchTypeDisplay.toLowerCase()}`}
          </div>
        ) : null}
      </div>
    </div>
  );
}