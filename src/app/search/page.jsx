"use server";

import { search, getRecommendations } from '@/lib/api';
import LibraryViewDisplay from '@/components/libraryViewDisplay';
import SearchForm from '@/components/SearchForm';

export default async function SearchPage({ searchParams }) {  
  const params = await searchParams;
  const query = params.q || '';
  const allowLookup = params.allowLookup === 'true';
  const errorParam = params.error;
  const isDev = process.env.NODE_ENV === "development";
  let results = [];
  let error = null;
  let onlineLookupError = false;
  if (errorParam === 'lookup' && !allowLookup) {
    error = "Unable to use online lookup";
  } else if (query) {
    try {
      results = await search(query, { includeExternal: allowLookup });
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
      }
      error = "Unable to use online lookup";
      onlineLookupError = true;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center flex-col p-4 sm:p-8 mt-12">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">Search</h1>
      {/* Search Form */}
      <div className="w-full max-w-xl bg-base-200 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <SearchForm 
          initialQuery={query} 
          initialAllowLookup={allowLookup} 
          onlineLookupError={onlineLookupError}
        />
      </div>      {/* Results */}
      <div className="w-full max-w-6xl">
        {/* Display error message if there's an error */}
        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
        
        {query && results.length > 0 && (
          <div className="text-base text-center mb-4 text-base-content/70">{results.length} result{results.length !== 1 ? 's' : ''} found</div>
        )}
        
        {!query && allowLookup && results.length > 0 ? (
          <>
            <div className="text-base text-center mb-4 text-base-content/70">Recommended to request</div>
            <LibraryViewDisplay data={results} viewMode="default_search"/>
          </>
        ) : !query && !error ? (
          <p className="text-gray-400 text-center">Please enter a search query</p>
        ) : query && !error && results.length > 0 ? (
          <LibraryViewDisplay data={results} viewMode="default_search"/>
        ) : query && !error && results.length === 0 ? (
          <div className="text-gray-400 text-center">No results found for "{query}"</div>
        ) : null}
      </div>
    </div>
  );
}