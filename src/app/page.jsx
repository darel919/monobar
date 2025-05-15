"use server"

import {getHome} from "@/lib/api"
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/libraryViewDisplay";

export default async function Home() {

  let homeData = null;
  let error = null;
  const isDev = process.env.NODE_ENV === "development";
  
  try {
    homeData = await getHome();
    if(isDev) {
      console.log("Home Data: ", homeData);
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

  if (!homeData?.length) return null;
  return (
    <section className="flex flex-col min-h-screen p-8 mt-12">
      <h1 className="text-4xl mb-8">Home</h1>
      {homeData.length > 0 ? (
        <section>
          {homeData.map((item, index) =>
            item.latest.length > 0 ? (
              <div key={index} className="">
                <a href={`/library?id=${item.Id}`} className="hover:underline">
                  <h2 className="text-2xl font-bold mb-4">Latest {item.Name}</h2>
                </a>
                <LibraryViewDisplay data={item.latest} viewMode="posterView" />
              </div>
            ) : null
          )}
        </section>
      ) : null}
    </section>
  );
}
