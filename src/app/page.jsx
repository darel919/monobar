"use server"

import React from 'react';
import {getHome} from "@/lib/api"
import ErrorState from "@/components/ErrorState";
import LibraryViewDisplay from "@/components/libraryViewDisplay";
import Link from 'next/link';
import HomeRequestList from '@/components/HomeRequestList';
import HeroCarousel from '@/components/HeroCarousel';

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
          {homeData.map((item, index) => (
            <React.Fragment key={`section-${index}`}>
              {item.latest.length > 0 ? (
                  <>
                  <HeroCarousel items={item.latest} />
                  <div key={`latest-${index}`} className="">
                    <a href={`/library?id=${item.Id}`} className="hover:underline">
                      <h2 className="text-2xl font-bold mb-4">Latest {item.Name}</h2>
                    </a>
                  <LibraryViewDisplay data={item.latest} viewMode="posterView" />
                </div></>
              ) : null}
              {item.comingSoon.length > 0 ? (
                <div className="mt-4" title="These titles are currently being downloaded and soon will be available in the library.">
                  <Link href="/request" className="hover:underline">
                    <h2 className="text-2xl font-bold mb-4">Coming Soon to MoNobar</h2>
                    <HomeRequestList />
                  </Link>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </section>
      ) : null}
    </section>
  );
}
