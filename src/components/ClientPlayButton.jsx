"use client";

import { useState } from "react";
import usePlaybackStore from "@/store/playbackStore";
import { useRouter } from "next/navigation";

export default function ClientPlayButton({ id, type, playUrl }) {
    const [isLoading, setIsLoading] = useState(false);
    const storeContentId = usePlaybackStore(state => state.storeContentId);
    const router = useRouter();

    const storeFunc = () => {
        if (id && type && playUrl) {
            setIsLoading(true);
            storeContentId(id, type, playUrl);
            router.push('/watch')
        } else {
            console.error('Unable to start playback. Missing parameters:', { id, type, playUrl });
        }
    }

    return (
        <button onClick={() => storeFunc()} 
            className="my-4 px-12 btn btn-neutral hover:btn-accent w-full sm:w-fit"
            disabled={isLoading}
        >
            <span className="flex items-center gap-2">
                {isLoading ? (
                    <span className="loading loading-spinner"></span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                )}
                <span>{isLoading ? 'Loading...' : 'Play'}</span>
            </span>
        </button>
    );
}