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
    infoData = await getMovieData(id, "info");
    if(isDev) {
      console.log("Info Data: ", infoData);
    }
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
    <div className="min-h-screen flex items-start md:items-end justify-start text-white relative">
      {infoData.BackdropImageTags && (
        infoData.RemoteTrailers && infoData.RemoteTrailers[0] ? (
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} src={infoData.RemoteTrailers[0].Url} playTrailer={isDev ? false : true} className="fixed inset-0 -z-10" title={infoData.OriginalTitle} />
        ) : (
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} className="fixed inset-0 -z-10" />
        )
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[0%] via-black/85 via-[65%] to-transparent to-[200%] md:from-[15%] md:via-[65%] md:to-[175%]" />
      <section className="w-full md:w-[50vw] h-full flex flex-col pb-8 md:pb-24 mt-[50vh] md:mt-[40vh] px-8 sm:px-8 relative">
        <section className="flex flex-col w-full h-full">
          {infoData.ImageTags.Logo ? (
            <img loading="eager" src={infoData.ImageTags.Logo} alt={infoData.Name} className="h-32 w-fit max-w-58 sm:max-w-64 md:max-w-80 object-contain pointer-events-none" />
          ) : (
            <h1
              className="text-6xl font-bold truncate-2-lines"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                paddingBottom: '0.25em'
              }}
            >
              {infoData.Name}
            </h1>
          )}
          <section className="flex flex-col sm:flex-row items-start sm:items-center mt-0 sm:mt-2">
            <span className="mr-1 px-1">{infoData.ProductionYear}</span>
            <div className="flex flex-row items-center gap-1 mt-4 sm:mt-0">
              {infoData.Rating && <span className="badge badge-neutral">{infoData.Rating}</span>}
              {infoData.Genres && infoData.Genres.map((genre, index) => (
                <span key={index} className="badge badge-neutral">{genre}</span>
              ))}
            </div>
          </section>
          <div className="md:h-[25vh] overflow-hidden md:relative">
            <h2 className="text-lg leading-[1.6] sm:leading-[1.75] mt-4 md:after:absolute md:after:bottom-0 md:after:left-0 md:after:w-full md:after:h-32">{infoData.Overview}</h2>
          </div>
          {infoData.playUrl && <ClientPlayButton id={id} type={type} playUrl={infoData.playUrl} />}
        </section>
      </section>
    </div>
  );
}