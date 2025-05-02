"use server"

import ErrorState from "@/components/ErrorState";
import WatchBackdropDisplay from "@/components/WatchBackdropDisplay";
import { getMovieData } from "@/lib/api";
import Loading from "../loading";
import ClientPlayButton from "@/components/ClientPlayButton";

export default async function InfoPage({ searchParams }) {
  const { id, type } = await searchParams;
  const isDev = process.env.NODE_ENV === "development";

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

  let infoData = null;
  let error = null;
  try {
    infoData = await getMovieData(id);
  } catch (err) {
    error = err.message;
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
    return <Loading/>;
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
          {infoData.playUrl && <ClientPlayButton id={id} type={type} playUrl={infoData.playUrl} />}
        </section>
      </section>
    </div>
  );
}