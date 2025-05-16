import { searchMedia } from '@/lib/api';
import LibraryViewDisplay from '@/components/libraryViewDisplay';

export default async function SearchPage({ searchParams }) {
  const query = searchParams.q;

  if (!query) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <p className="text-gray-400">Please enter a search query</p>
      </div>
    );
  }

  let results = [];
  let error = null;

  try {
    results = await searchMedia(query);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <h1 className="text-2xl font-bold mb-4">
        Search results for: {query}
      </h1>

      {error ? (
        <div className="text-red-500">{error}</div>
      ) : results.length > 0 ? (
        <LibraryViewDisplay data={results}/>
      ) : (
        <div className="text-gray-400">No results found for "{query}"</div>
      )}
    </div>
  );
}