"use server"

import { getTypeData, getGenreData } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/libraryViewDisplay";
import LibrarySortControl from "@/components/librarySortControl";
import GenreSortControl from "@/components/genreSortControl";
import { cookies } from "next/headers";

export async function generateMetadata({ searchParams }) {
  const cookieStore = await cookies();
  const params = await searchParams;
  const id = params.id;
  const genreId = params.genreId;
  const sortBy = params.sortBy || cookieStore.get("librarySortBy")?.value || "ProductionYear";
  const sortOrder = params.sortOrder || cookieStore.get("librarySortOrder")?.value || "desc";

  let title = "Monobar Library";
  try {
    let libData;
    if (genreId) {
      libData = await getGenreData({ genreId, sortBy, sortOrder });
      title = (libData?.Name + " - Monobar");
    } else if (id) {
      libData = await getTypeData({ id, sortBy, sortOrder });
      title = libData?.library?.Name || libData?.Name || (title + " - Monobar");
    }
  } catch (err) {
    console.error("Error generating metadata:", err);
    // title = "Monobar Library - Error";
  }
  return { title };
}

export default async function LibraryTypeView({ searchParams }) {
  const cookieStore = await cookies();
  const params = await searchParams;
  let defaultSortBy = cookieStore.get("librarySortBy")?.value || "ProductionYear";
  let defaultSortOrder = cookieStore.get("librarySortOrder")?.value || "desc";
  const id = params.id;
  const genreId = params.genreId;
  const sortBy = params.sortBy || defaultSortBy;
  const sortOrder = params.sortOrder || defaultSortOrder;
  const isDev = process.env.NODE_ENV === "development";

  if (!id && !genreId) {
    return (
      <ErrorState 
        message="Invalid Request" 
        actionText="Return to Home" 
        actionDesc="The request is invalid. Please check the URL or try again."
        action="home"
      />
    );
  }

  let libData = null;
  let error = null;
  try {
    if (genreId) {

      libData = await getGenreData({ genreId, sortBy, sortOrder });
      console.log('genre data:', libData)
    } else {

      libData = await getTypeData({ id, sortBy, sortOrder });
    }
    if(isDev) {
      console.log("Library Data:", libData);
    }
  } catch (err) {
    console.error("Error fetching library data:", err);
    error = err.message;
  }

  if (error) {
    return (
      <ErrorState 
        message={genreId ? "Currently, this genre is unavailable." : "Currently, the MoNobar library is unavailable."} 
        actionText="Try Again" 
        actionDesc={genreId ? "We are having trouble loading this genre. Please try refreshing the page." : "We are having trouble loading the MoNobar content library. Please try refreshing the page."}
        action="reload"
      />
    );
  }

  if (!libData?.content?.length) return null;
  
  return (
    <section className="flex flex-col min-h-screen p-8 mt-12">
      <section className="mb-8 flex sm:flex-row flex-col items-center justify-between">
        <section>
          <h1 className="text-4xl">{libData.library?.Name || libData.Name}</h1>
          <p>{libData.content.length} items found.</p>
        </section>
        {genreId ? (
          <GenreSortControl genreId={genreId} sortBy={sortBy} sortOrder={sortOrder} />
        ) : (
          <LibrarySortControl id={id} sortBy={sortBy} sortOrder={sortOrder} />
        )}
      </section>
      <LibraryViewDisplay data={libData.content} />
    </section>
  );
}
