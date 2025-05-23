"use server";

import { search, getRecommendations } from '@/lib/api';
import LibraryViewDisplay from '@/components/libraryViewDisplay';
import SearchForm from '@/components/SearchForm';

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  const allowLookup = params.allowLookup === 'true';

  let results = [];
  let error = null;

  if (query) {
    try {
      results = await search(query, { includeExternal: allowLookup });
      // console.log("Search Results: ", results);
    } catch (e) {
      error = e.message;
    }
  } else if (allowLookup) {
    try {
      results = await getRecommendations();
      // console.log("Recommendations: ", results);
    } catch (e) {
      error = e.message;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center flex-col p-4 sm:p-8 mt-12">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">Search</h1>
      {/* Search Form */}
      <div className="w-full max-w-xl bg-base-200 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <SearchForm initialQuery={query} initialAllowLookup={allowLookup} />
      </div>
      {/* Results */}
      <div className="w-full max-w-6xl">
        {query && results.length > 0 && (
          <div className="text-base text-center mb-4 text-base-content/70">{results.length} result{results.length !== 1 ? 's' : ''} found</div>
        )}
        {!query && allowLookup && results.length > 0 ? (
          <>
            <div className="text-base text-center mb-4 text-base-content/70">Recommended to request</div>
            <LibraryViewDisplay data={results} viewMode="default_search"/>
          </>
        ) : !query ? (
          <p className="text-gray-400 text-center">Please enter a search query</p>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : results.length > 0 ? (
          <LibraryViewDisplay data={results} viewMode="default_search"/>
        ) : (
          <div className="text-gray-400 text-center">No results found for "{query}"</div>
        )}
      </div>
    </div>
  );
}