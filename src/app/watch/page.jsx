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

            await initializePlayback(id, type);

            try {
                const data = await getMovieData(id, "info");
                if (!mounted) return;

                if (!data) {
                    setFetchError("No data returned.");
                    setWatchData(null);
                } else {
                    setWatchData(data);
                    if (isDev) {
                        console.log("Watch Data: ", data);
                    }
                    setFetchError(null);
                    document.title = `WATCHING: ${data.Name} - MoNobar`;
                }

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
        }

        fetchData();
        return () => {
            mounted = false;
        };
    }, [id, type, seriesId, initializePlayback]);    // STRICT unmounting protocol - handle page exit
    useEffect(() => {
        let isRealUnmount = true;
        let unmountTimer = null;
        let routeChangeStarted = false;        const handleBeforeUnload = (event) => {
            if (process.env.NODE_ENV === 'development') console.log('Page beforeunload - stopping playback immediately');
            routeChangeStarted = true;
            setPageActive(false);
            stopPlayback();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (process.env.NODE_ENV === 'development') console.log('Page hidden - stopping playback immediately');
                routeChangeStarted = true;
                setPageActive(false);
                stopPlayback();
            }
        };

        const handlePopState = () => {
            if (process.env.NODE_ENV === 'development') console.log('Navigation detected - stopping playback immediately');
            routeChangeStarted = true;
            setPageActive(false);
            stopPlayback();
        };

        const handleRouteChangeStart = () => {
            if (process.env.NODE_ENV === 'development') console.log('Next.js route change detected - stopping playback immediately');
            routeChangeStarted = true;
            setPageActive(false);
            stopPlayback();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('popstate', handlePopState);

        if (typeof window !== 'undefined' && window.history) {
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;
            
            window.history.pushState = function(...args) {
                if (window.location.pathname === '/watch') {
                    handleRouteChangeStart();
                }
                return originalPushState.apply(this, args);
            };
            
            window.history.replaceState = function(...args) {
                if (window.location.pathname === '/watch') {
                    handleRouteChangeStart();
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
        <section className="min-h-screen pt-20 pb-16">
            {type === 'Episode' && seriesId ? (
                seriesData ? (                
                <div className="flex flex-col md:flex-row mx-auto">
                    <div className="flex-1 min-w-0">
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                            {watchData && pageActive && (
                                <Player poster={watchData?.BackdropImageTags} id={id} type={type} fullData={watchData}/>
                            )}
                        </div>
                    </div>
                        <div className="w-full md:w-[300px] flex-shrink-0 md:mx-4 mx-0">
                            <SeasonsEpisodesViewer 
                                seriesData={seriesData} 
                                currentEpisodeId={id} 
                                mode="watch" 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center min-h-[40vh] w-full">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                )
            ) : (
                watchData && pageActive && (
                    <Player poster={watchData?.BackdropImageTags} id={id} type={type} fullData={watchData}/>
                )
            )}
        </section>
    )
}