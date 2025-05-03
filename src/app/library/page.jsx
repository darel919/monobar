"use server"

import { getTypeData } from "@/lib/api";
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/libraryViewDisplay";
import SortControls from "@/components/librarySortControl";

export default async function LibraryTypeView({ searchParams }) {
  const { id, sortBy = "ProductionYear", sortOrder = "desc" } = await searchParams;
  const sortOptions = [
    { value: "DateCreated", label: "Date Created" },
    { value: "SortName", label: "Sort Name" },
    { value: "ProductionYear", label: "Production Year" },
    { value: "CommunityRating", label: "Ratings" },
    { value: "Random", label: "Random" },
    { value: "Runtime", label: "Runtime" },
  ];

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
    // console.log("Library Data:", libData);
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
        <SortControls id={id} sortBy={sortBy} sortOrder={sortOrder} />
      </section>
      <LibraryViewDisplay data={libData.content} />
    </section>
  );
}
