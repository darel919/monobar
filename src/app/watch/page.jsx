"use server"

import ErrorState from "@/components/ErrorState";
import Player from "@/components/Player";
import { getMovieData } from "@/lib/api";
export default async function WatchPage({searchParams}) {
    const { id, type } = await searchParams;
    let watchData = null
    let error = null;

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
    try {
        watchData = await getMovieData(id);
        console.log(watchData)
    } catch (err) {
        error = err.message;
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
            <Player src={watchData.playUrl} poster={watchData.BackdropImageTags}/>
        </section>
    )
}