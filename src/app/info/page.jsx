"use server"

import ErrorState from "@/components/ErrorState";
import WatchBackdropDisplay from "@/components/WatchBackdropDisplay";
import { getMovieData } from "@/lib/api";
import Loading from "../loading";
import ClientPlayButton from "@/components/InfoClientPlayButton";
import LibraryViewDisplay from "@/components/LibraryViewDisplay";
import PeopleViewDisplay from "@/components/PeopleViewDisplay";
import SeasonsEpisodesViewer from "@/components/SeasonsEpisodesViewer";
import Link from "next/link";

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams;
  if (!id) return { title: "MoNobar" };
  try {
    const infoData = await getMovieData(id, "info");
    return {
      title: `${infoData.Name} - MoNobar`
    };
  } catch {
    return { title: "MoNobar" };
  }
}

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

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  return (
    <>
      {infoData.BackdropImageTags && (
        infoData.RemoteTrailers && infoData.RemoteTrailers[0] ? (
          <>
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} src={infoData.RemoteTrailers[0].Url} playTrailer={true} className="fixed inset-0 z-0" title={infoData.OriginalTitle} />
          <div className="fixed inset-0 z-5 bg-gradient-to-b from-transparent from-[0%] via-black/85 via-[65%] to-transparent to-[200%] md:from-[15%] md:via-[65%] md:to-[175%] pointer-events-none" /> 
          </>
        ) : (
          <WatchBackdropDisplay backdrop={infoData.BackdropImageTags} className="fixed inset-0 z-0" />
        )
      )}
      <div className="min-h-screen flex flex-col justify-start text-white relative z-10">

      <section className="w-full md:w-[50vw] h-full flex flex-col pb-8 md:pb-24 mt-[50vh] md:mt-[40vh] px-8 sm:px-8 relative">
        <section className="flex flex-col w-full h-full" title={infoData.OriginalTitle ? infoData.OriginalTitle : infoData.Name}>
          {infoData.ImageTags.Logo ? (
            <img loading="eager" src={infoData.ImageTags.Logo} alt={infoData.OriginalTitle ? infoData.OriginalTitle : infoData.Name}  className="h-32 w-fit max-w-58 sm:max-w-64 md:max-w-80 object-contain pointer-events-none" />
          ) : (
            infoData.OriginalTitle ? (
              <h1 className="text-6xl font-bold mb-4">
                {infoData.OriginalTitle}
              </h1>
            ) : (
              <h1 className="text-6xl font-bold mb-4">
                {infoData.Name}
              </h1>
            )
          )}
          <section className="flex flex-col sm:flex-row items-start sm:items-center mt-0 sm:mt-2">
            <span className="px-1" title={formatDate(infoData.PremiereDate)}>
              {infoData.ProductionYear}
            </span>
            <div className="flex flex-row items-center mt-4 sm:mt-0">
              {infoData.Rating && <span className="badge badge-neutral">{infoData.Rating}</span>}              
              <div className="flex flex-wrap gap-1 sm:ml-2">
                {infoData.GenreItems && infoData.GenreItems.map((genre, index) => (
                  <Link 
                    key={index} 
                    href={`/library?genreId=${genre.Id}`}
                    className="badge badge-neutral hover:badge-primary transition-colors cursor-pointer"
                  >
                    {genre.Name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
          {infoData.CommunityRating && (
            <section className="my-2" title="TMDb Rating">
              {(() => {
                let tmdbUrl = null;
                if (infoData.ExternalUrls && Array.isArray(infoData.ExternalUrls)) {
                  const tmdbLink = infoData.ExternalUrls.find(link => link.Name === "MovieDb");
                  tmdbUrl = tmdbLink ? tmdbLink.Url : null;
                }
                return (
                  <>
                    <a
                      href={tmdbUrl || "#"}
                      className={`flex flex-wrap gap-1 badge ${infoData.CommunityRating < 4 ? 'badge-error' : infoData.CommunityRating > 6.5 ? 'badge-success' : 'badge-warning'}`}
                      target={tmdbUrl ? "_blank" : undefined}
                      rel={tmdbUrl ? "noopener noreferrer" : undefined}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      {infoData.CommunityRating !== undefined && (
                        <span>{infoData.CommunityRating.toFixed(1)}</span>
                      )}
                    </a>
                  </>
                );
              })()}
            </section>
          )}
        </section>        
        <section className="my-2">
          {infoData.MediaStreams && infoData.MediaStreams.some(s => s.IsTextSubtitleStream) ? (
            <>
              <p className="text-xs mb-1">Subtitles available: </p>
              <section className="flex flex-wrap gap-1">
                {infoData.MediaStreams.filter(s => s.IsTextSubtitleStream).map((stream, idx) => (
                  <span key={idx} className="badge badge-ghost text-xs">{stream.DisplayLanguage ? stream.DisplayLanguage : stream.DisplayTitle}</span>
                ))}
              </section>
            </>
          ) : (
            type === 'Series' ? null : <p className="text-xs mb-1">No subtitles available</p>
          )}
        </section>        
        <div className="overflow-hidden md:relative my-4">
          <h2 className="text-lg leading-[1.6] sm:leading-[1.75] mt-4 md:after:absolute md:after:bottom-0 md:after:left-0 md:after:w-full md:after:h-32">{infoData.Overview}</h2>
        </div>
        {infoData.playUrl && <ClientPlayButton id={id} type={type} playUrl={infoData.playUrl} seriesData={type === 'Series' ? infoData : null} />}

      </section>
        {/* TV Series Episodes Viewer */}
      {type === 'Series' && infoData.availableSeasons && infoData.availableSeasons.length > 0 && (
        <section className="px-8 my-8">
          <h3 className="text-2xl font-bold mb-4">Episodes</h3>
          <div className="bg-base-200 text-base-content rounded-lg overflow-hidden">
            <SeasonsEpisodesViewer seriesData={infoData} mode="info" />
          </div>
        </section>
      )}

      {infoData.People && infoData.People.length > 0 && (
        <section className="ml-8 my-4">
          <p className="font-bold w-fit p-2 text-white mb-4">Cast and Crew</p>
          <PeopleViewDisplay data={infoData.People} />
        </section>
      )}
      {infoData.recommendation && infoData.recommendation.length > 0 && (
        <section className="px-8 my-4">
        <p className="font-bold w-fit p-2 text-white">Similar to {infoData.Name}</p>
          <LibraryViewDisplay data={infoData.recommendation} viewMode="recommendation" />
        </section>      
      )}
    </div>
    </>
  );
}