"use client"

import { useEffect, useState } from "react";
import usePlaybackStore from "@/store/playbackStore";
import ErrorState from "@/components/ErrorState";
import Player from "@/components/Player";
import { getMovieData } from "@/lib/api";

export default function WatchPage() {
    const { id, type } = usePlaybackStore(state => state);
    const [watchData, setWatchData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (!id || !type) return;
            try {
                const data = await getMovieData(id);
                setWatchData(data);
                document.title = `${data.Name} - MoNobar by DWS`;
            } catch (err) {
                setError(err.message);
            }
        }
        
        fetchData();
    }, [id, type]);

    if (!id || !type) {
        return (
            <ErrorState 
                message="Invalid Request" 
                actionText="Go Back" 
                actionDesc="The request is invalid. Please check the URL or try again."
                action="back"
            />
        );
    }

    if (error) {
        return (
            <ErrorState 
                message="Currently, this title is unavailable." 
                actionText="Go Back" 
                actionDesc={`We are having trouble loading this title. Please try again later.`}
                errorCode={error}
                action="back"
            />
        );
    }

    return (
        <section className="min-h-screen pt-20 pb-16">
            <Player poster={watchData?.BackdropImageTags} id={id} type={type}/>
        </section>
    )
}