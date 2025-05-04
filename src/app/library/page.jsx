"use server"

import { getTypeData } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/libraryViewDisplay";
import LibrarySortControl from "@/components/librarySortControl";
import { cookies } from "next/headers";

export default async function LibraryTypeView({ searchParams }) {
  const cookieStore = await cookies();
  const params = await searchParams;
  let defaultSortBy = cookieStore.get("librarySortBy")?.value || "ProductionYear";
  let defaultSortOrder = cookieStore.get("librarySortOrder")?.value || "desc";
  const id = params.id;
  const sortBy = params.sortBy || defaultSortBy;
  const sortOrder = params.sortOrder || defaultSortOrder;
  const isDev = process.env.NODE_ENV === "development";

  if (!id) {
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
    libData = await getTypeData({ id, sortBy, sortOrder });
    if(isDev) {
      console.log("Library Data:", libData);
    }
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <ErrorState 
        message="Currently, the MoNobar library is unavailable." 
        actionText="Try Again" 
        actionDesc="We are having trouble loading the MoNobar content library. Please try refreshing the page."
        action="reload"
      />
    );
  }

  if (!libData?.content?.length) return null;
  return (
    <section className="flex flex-col min-h-screen p-8 mt-12">
      <section className="mb-8 flex sm:flex-row flex-col items-center justify-between">
        <section>
          <h1 className="text-4xl">{libData.library.Name}</h1>
          <p>{libData.content.length} items found.</p>
        </section>
        <LibrarySortControl id={id} sortBy={sortBy} sortOrder={sortOrder} />
      </section>
      <LibraryViewDisplay data={libData.content} />
    </section>
  );
}
