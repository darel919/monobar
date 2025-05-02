"use client"

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import WatchBackdropDisplay from "@/components/WatchBackdropDisplay";
import { getMovieData } from "@/lib/api";
import Loading from "../loading";
import usePlaybackStore from "@/store/playbackStore";

export default function InfoPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const [loading, setLoading] = useState(true);
  const [infoData, setInfoData] = useState(null);
  const [error, setError] = useState(null);
  const isDev = process.env.NODE_ENV === "development";
  const storeContentId = usePlaybackStore(state => state.storeContentId);
  const router = useRouter();

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
    getMovieData(id)
      .then(data => {
        setInfoData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, type]);

  const handlePlay = () => {
    storeContentId(id, type, infoData.playUrl);
    router.push(`/watch`);
  };

  if (!id || !type) {
    return (
      <ErrorState 
        message="Invalid Request" 
        actionText="Return to Home" 
        actionDesc="The request is invalid. Please check the URL or try again."
        action="home"
      />
    );
  }

  if (error) {
    return (
      <ErrorState 
        message="Currently, this title is unavailable." 
        actionText="Try Again" 
        actionDesc="We are having trouble loading this title. Please try again."
        action="reload"
      />
    );
  }

  if (!infoData) {
    return <Loading/>; // or a loading spinner
  }

  if(loading) {
    return <Loading/>
  }

  return (
    <div className="min-h-screen flex items-end justify-start pb-16 px-8">
      <section className="w-full md:w-[50vw] h-full flex flex-col">
        {infoData.RemoteTrailers && infoData.RemoteTrailers[0] ? (
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} src={infoData.RemoteTrailers[0].Url} playTrailer={isDev ? false : true} className="absolute inset-0 -z-2" />
        ) : (
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} className="absolute inset-0 -z-2" />
        )}
        <section className="flex flex-col w-full h-full p-4">
          {infoData.ImageTags.Logo ? (
            <img loading="eager" src={infoData.ImageTags.Logo} alt={infoData.Name} className="h-32 w-fit max-w-72 object-contain mb-4 pointer-events-none" />
          ) : (
            <h1 className="text-6xl font-bold mb-8">{infoData.Name}</h1>
          )}
          <h2 className="text-lg leading-[1.75]">{infoData.Overview}</h2>
          <button onClick={handlePlay} className="my-4 px-12 btn btn-neutral hover:btn-accent w-full sm:w-fit">
            <a className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              <span>Play</span>
            </a>
          </button>
        </section>
      </section>
    </div>
  );
}