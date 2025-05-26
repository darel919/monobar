"use client"

import { useState, useEffect } from "react";
import { getAllGenres } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import Link from "next/link";

export default function GenresView() {
  const [genresData, setGenresData] = useState(null);
  const [error, setError] = useState(null);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await getAllGenres();
        if(isDev) {
          console.log("Genres Data:", data);
        }
        setGenresData(data);
      } catch (err) {
        console.error("Error fetching genres:", err);
        setError(err.message);
      }
    };

    fetchGenres();
  }, []);

  if (error) {
    return (
      <ErrorState 
        message="Currently, the genres library is unavailable." 
        actionText="Try Again" 
        actionDesc="We are having trouble loading the genres. Please try refreshing the page."
        action="reload"
      />
    );
  }

  if (!genresData?.length) {
    return (
      <section className="flex flex-col min-h-screen p-8 mt-12">
        <h1 className="text-4xl mb-8">Genres</h1>
        <p>No genres available at the moment.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col min-h-screen p-8 mt-12">
      <section className="mb-8">
        <h1 className="text-4xl">Browse by Genre</h1>
        <p>{genresData.length} genres available.</p>
      </section>
      
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {genresData.map((genre) => (
          <Link 
            key={genre.Id} 
            href={`/library?genreId=${encodeURIComponent(genre.Id)}`}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 transition-all duration-300 hover:scale-105"
          >
            {genre.ImageTags?.Primary ? (
              <img 
                src={genre.posterPath}
                alt={genre.Name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" className="w-12 h-12 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 0A2.25 2.25 0 015.625 3.375h13.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25V5.625z" />
                </svg>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-sm group-hover:text-lg transition-all duration-300">
                {genre.Name}
              </h3>
              {genre.MovieCount > 0 && (
                <p className="text-white/70 text-xs mt-1">
                  {genre.content && genre.content.length} {genre.content.length === 1 ? 'movie' : 'movies'}
                </p>
              )}
            </div>
          </Link>
        ))}
      </section>
    </section>
  );
}
