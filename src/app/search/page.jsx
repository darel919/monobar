"use server";

import { search } from '@/lib/api';
import LibraryViewDisplay from '@/components/libraryViewDisplay';

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  const allowLookup = params.allowLookup === 'true';

  let results = [];
  let error = null;

  if (query) {
    try {
      results = await search(query, { includeExternal: allowLookup });
      console.log("Search Results: ", results);
    } catch (e) {
      error = e.message;
    }
  }

  return (
    <div className="container min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 mt-12">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">Search</h1>
      {/* Search Form */}
      <div className="w-full max-w-xl bg-base-200 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <form action="/search" method="get" className="w-full flex flex-col gap-4">
          <div className="relative flex items-center">
            <input
              type="text"
              name="q"
              placeholder="Search for movies..."
              defaultValue={query}
              className="input input-bordered w-full pr-12 text-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <button type="submit" className="absolute right-2 btn btn-primary btn-sm px-4 py-1 rounded-lg shadow-md">Go</button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none text-base-content/80">
            <input
              type="checkbox"
              name="allowLookup"
              value="true"
              defaultChecked={allowLookup}
              className="checkbox checkbox-primary"
            />
            <span className="text-sm sm:text-base">Include External Movie Lookup
              <span className="ml-1 text-xs text-base-content/50" title="Checking this option will include external movie lookup results. This may take longer to load.">(slower)</span>
            </span>
          </label>
        </form>
      </div>
      {/* Results */}
      <div className="w-full max-w-6xl">
        {query && results.length > 0 && (
          <div className="text-base text-center mb-4 text-base-content/70">{results.length} result{results.length !== 1 ? 's' : ''} found</div>
        )}
        {!query ? (
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