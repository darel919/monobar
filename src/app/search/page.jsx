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
    <div className="container min-h-screen mx-auto px-4 pt-24">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      {/* Search Form */}
      <form action="/search" method="get" className="mb-8 flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="text"
          name="q"
          placeholder="Search for movies..."
          defaultValue={query}
          className="input input-bordered flex-grow"
        />
        <label className="flex items-center gap-2" title="Checking this option will include external movie lookup results. This may take longer to load.">
          <input
            type="checkbox"
            name="allowLookup"
            value="true"
            defaultChecked={allowLookup}
            className="checkbox"
          />
          Include External Movie Lookup
        </label>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      {/* Results */}
      {!query ? (
        <p className="text-gray-400">Please enter a search query</p>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : results.length > 0 ? (
        <LibraryViewDisplay data={results} viewMode="default_search"/>
      ) : (
        <div className="text-gray-400">No results found for "{query}"</div>
      )}
    </div>
  );
}