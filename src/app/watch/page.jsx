"use client"

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import usePlaybackStore from "@/store/playbackStore";
import ErrorState from "@/components/ErrorState";
import Player from "@/components/WatchPlayer";
import SeasonsEpisodesViewer from "@/components/SeasonsEpisodesViewer";
import { getMovieData } from "@/lib/api";

export default function WatchPage() {    
    const [watchData, setWatchData] = useState(null);
    const [seriesData, setSeriesData] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [pageActive, setPageActive] = useState(true);
    const [currentEpisodeId, setCurrentEpisodeId] = useState(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const seriesId = searchParams.get('seriesId');
    const status = usePlaybackStore(state => state.status);
    const error = usePlaybackStore(state => state.error);
    const initializePlayback = usePlaybackStore(state => state.initializePlayback);
    const stopPlayback = usePlaybackStore(state => state.stopPlayback);
    const isDev = process.env.NODE_ENV === "development";    
    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            if (!id || !type) return;

            setWatchData(null);
            setFetchError(null);

            try {
                const data = await getMovieData(id, "info");
                if (!mounted) return;

                if (!data) {
                    setFetchError("No data returned.");
                    setWatchData(null);
                    return;
                }                
                if (type === 'Series') {
                    if (data.availableSeasons && data.availableSeasons.length > 0) {
                        const firstSeason = data.availableSeasons[0];
                        if (firstSeason.episodes && firstSeason.episodes.length > 0) {
                            const firstEpisode = firstSeason.episodes[0];
                            if (isDev) {
                                console.log("Redirecting from series to first episode:", firstEpisode);
                            }
                            router.replace(`/watch?id=${firstEpisode.Id}&type=Episode&seriesId=${id}`);
                            return;
                        }
                    }
                    // If no episodes found, show error
                    setFetchError("No episodes available for this series.");
                    setWatchData(null);
                    return;
                }

                setWatchData(data);
                if (isDev) {
                    console.log("Watch Data: ", data);
                }
                setFetchError(null);
                document.title = `WATCHING: ${data.Name} - MoNobar`;

                await initializePlayback(id, type);

                if (type === 'Episode' && seriesId) {
                    const series = await getMovieData(seriesId, "info");
                    if (!mounted) return;
                    setSeriesData(series);
                }
            } catch (err) {
                if (!mounted) return;
                setFetchError(err.message);
                setWatchData(null);
                setSeriesData(null);
            }
        }fetchData();
        return () => {
            mounted = false;
        };
    }, [id, type, seriesId, initializePlayback]);    
    useEffect(() => {
        if (id && id !== currentEpisodeId) {

            setWatchData(null);
            setCurrentEpisodeId(id);
        }
    }, [id, currentEpisodeId]);

    useEffect(() => {
        let isRealUnmount = true;
        let unmountTimer = null;
        let routeChangeStarted = false;        
        const handleBeforeUnload = (event) => {
            if (process.env.NODE_ENV === 'development') console.log('Page beforeunload - stopping playback immediately');
            setTimeout(() => {
                routeChangeStarted = true;
                setPageActive(false);
                stopPlayback();
            }, 0);
        };        
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (process.env.NODE_ENV === 'development') console.log('Page hidden - pausing video player but keeping playback state');
            } else {
                if (process.env.NODE_ENV === 'development') console.log('Page visible again - video should resume automatically');
            }
        };

        const handlePopState = () => {
            if (process.env.NODE_ENV === 'development') console.log('Navigation detected - stopping playback immediately');
            setTimeout(() => {
                routeChangeStarted = true;
                setPageActive(false);
                stopPlayback();
            }, 0);
        };
        const handleRouteChangeStart = (targetUrl) => {
            if (process.env.NODE_ENV === 'development') console.log('Next.js route change detected - stopping playback immediately');

            const isLeavingWatchPage = targetUrl && !targetUrl.includes('/watch');
            
            if (isLeavingWatchPage || !targetUrl) {

                setTimeout(() => {
                    routeChangeStarted = true;
                    setPageActive(false);
                    stopPlayback();
                }, 0);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('popstate', handlePopState);

        if (typeof window !== 'undefined' && window.history) {
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;
            
            window.history.pushState = function(...args) {
                const targetUrl = args[2];
                if (window.location.pathname === '/watch') {
                    handleRouteChangeStart(targetUrl);
                }
                return originalPushState.apply(this, args);
            };
            
            window.history.replaceState = function(...args) {
                const targetUrl = args[2];
                if (window.location.pathname === '/watch') {
                    handleRouteChangeStart(targetUrl);
                }
                return originalReplaceState.apply(this, args);
            };
        }        
        return () => {

            if (routeChangeStarted) {
                if (process.env.NODE_ENV === 'development') console.log('WatchPage unmounting after route change - force stopping playback');
                setPageActive(false);
                stopPlayback();
            } else if (process.env.NODE_ENV === 'development') {

                isRealUnmount = false;
                unmountTimer = setTimeout(() => {
                    isRealUnmount = true;
                }, 100);

                if (isRealUnmount) {
                    if (process.env.NODE_ENV === 'development') console.log('WatchPage real unmounting - cleaning up all listeners and stopping playback');
                    setPageActive(false);
                    stopPlayback();
                } else {
                    if (process.env.NODE_ENV === 'development') console.log('WatchPage React strict mode unmount - skipping playback cleanup');
                }
            } else {

                if (process.env.NODE_ENV === 'development') console.log('WatchPage unmounting - cleaning up all listeners and stopping playback');
                setPageActive(false);
                stopPlayback();
            }

            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('popstate', handlePopState);
            
            if (unmountTimer) {
                clearTimeout(unmountTimer);
            }
        };
    }, [stopPlayback]);

    if (!id || !type) {
        return (
            <ErrorState 
                message="Sorry, but this title can't be played" 
                actionText="Go Back" 
                actionDesc="A required identifier or type is missing. Please check the URL or try again."
                action="back"
            />
        );
    }

    if (fetchError) {
        return (
            <ErrorState 
                message="Sorry, but this title can't be played" 
                actionText="Go Back" 
                errorCode={fetchError}
                action="back"
            />
        );
    }

    if (status === 'error' && error) {
        return (
            <ErrorState 
                message="Playback Error" 
                actionText="Go Back" 
                actionDesc="We encountered an error while trying to play this content."
                errorCode={error}
                action="back"
            />
        );
    }      
    return (
        <section className="min-h-screen pt-20 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Side - Player and Episode Data */}
                    <div className="flex-1 min-w-0">
                        {/* Player Section */}
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
                            {watchData && watchData.Id === id && pageActive ? (
                                <Player key={watchData.Id} poster={watchData?.BackdropImageTags} id={id} type={type} fullData={watchData} seriesData={seriesData}/>
                            ) : (
                                <div className="flex justify-center items-center w-full h-full">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            )}
                        </div>                        
                        {/* Episode Data Section */}
                        <div className="bg-base-200 rounded-lg p-6">
                            {watchData ? (
                                <div className="space-y-4">                                    
                                    <div>
                                        {type === 'Episode' && seriesData && (
                                            <section>
                                                <div className="flex flex-col sm:flex-row sm:items-center">
                                                    <div className="flex items-center">
                                                        {seriesData?.ImageTags.Logo ? (
                                                            <img 
                                                                src={seriesData.ImageTags.Logo} 
                                                                alt={seriesData.Name} 
                                                                className="max-w-64 h-9 sm:my-1 my-4" 
                                                            />
                                                        ) : (<h2 className="text-xl font-bold text-primary">{seriesData.Name}</h2>)}
                                                        
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:ml-auto">
                                                        <div className="badge badge-primary font-medium rounded-none">
                                                            Season {watchData.ParentIndexNumber}
                                                        </div>
                                                        <span className="text-base-content/60">•</span>
                                                        <div className="badge badge-secondary font-medium rounded-none">
                                                            Episode {watchData.IndexNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        <h1 className="text-2xl font-bold my-2">{watchData.Name}</h1>

                                    </div>
                                    
                                    {watchData.Overview && (
                                        <div>
                                            {/* <h3 className="text-lg font-semibold mb-2">Overview</h3> */}
                                            <p className="text-base-content/80 leading-relaxed">{watchData.Overview}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                                        {watchData.RunTimeTicks && (
                                            <div>
                                                <span className="font-medium">Runtime:</span> {Math.round(watchData.RunTimeTicks / 600000000)} min
                                            </div>
                                        )}
                                        {watchData.PremiereDate && (
                                            <div>
                                                <span className="font-medium">Air Date:</span> {new Date(watchData.PremiereDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        {watchData.CommunityRating && (
                                            <div>
                                                <span className="font-medium">Rating:</span> {watchData.CommunityRating.toFixed(1)}/10
                                            </div>
                                        )}
                                    </div>

                                    {watchData.Genres && watchData.Genres.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Genres</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {watchData.Genres.map((genre, index) => (
                                                    <span key={index} className="badge badge-outline">{genre}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-32">
                                    <span className="loading loading-spinner loading-md"></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Season Episodes Viewer */}
                    {type === 'Episode' && seriesId && (
                        <div className="w-full lg:w-96 flex-shrink-0">
                            {seriesData ? (
                                <SeasonsEpisodesViewer 
                                    seriesData={seriesData} 
                                    currentEpisodeId={id} 
                                    mode="watch" 
                                />
                            ) : (
                                <div className="bg-base-200 rounded-lg p-6">
                                    <div className="flex justify-center items-center h-32">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}