"use client"

import { useEffect, useState, useCallback } from "react";
import usePlaybackStore from "@/store/playbackStore";
import ErrorState from "@/components/ErrorState";
import Player from "@/components/WatchPlayer";
import { getMovieData } from "@/lib/api";

export default function WatchPage() {
    const id = usePlaybackStore(useCallback(state => state.id, []));
    const type = usePlaybackStore(useCallback(state => state.type, []));
    const status = usePlaybackStore(useCallback(state => state.status, []));
    const error = usePlaybackStore(useCallback(state => state.error, []));
    
    const [watchData, setWatchData] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const isDev = process.env.NODE_ENV === "development";


    useEffect(() => {
        async function fetchData() {
            if (!id || !type) return;
            try {
                const data = await getMovieData(id, "info");
                if (!data) {
                    setFetchError("No data returned.");
                    setWatchData(null);
                } else {
                    setWatchData(data);
                    if(isDev) {
                        console.log("Watch Data: ", data);
                    }
                    setFetchError(null);
                    document.title = `WATCHING: ${data.Name} - MoNobar by DWS`;
                }
            } catch (err) {
                setFetchError(err.message);
                setWatchData(null);
            }
        }

        fetchData();
    }, [id, type]);

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
            <Player poster={watchData?.BackdropImageTags} id={id} type={type} fullData={watchData}/>
        </section>
    )
}