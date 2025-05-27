"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateGenSessionId } from '@/lib/genSessionId';
import { getEnvironmentHeader, getCookieValue } from '@/lib/api';

export default function ClientPlayButton({ id, type, playUrl, seriesData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playbackData, setPlaybackData] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function detectIsHome() {
            if(process.env.NODE_ENV === "development") return;
            if (window.location.hostname === "monobar.server.drl") return;
            try {
                const res = await fetch(process.env.NEXT_PUBLIC_DARELISME_PING_URL, { 
                    cache: "no-store", 
                    timeout: 5000 
                });
                if (res.ok) return;
                
                localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
                window.location.href = process.env.NEXT_PUBLIC_APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
            } catch {
                localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
                window.location.href = process.env.NEXT_PUBLIC_APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
            }
        }
        detectIsHome();
    }, []);

    useEffect(() => {
        let mounted = true;        
        const fetchPlaybackData = async () => {
            if (!id || !type || !playUrl) {
                setError('Missing required parameters');
                setIsLoading(false);
                return;
            }

            // For TV series, use nextUpEpisode if available
            let actualPlayUrl = playUrl;
            let actualId = id;
            let actualType = type;
            
            if (type === 'Series' && seriesData?.nextUpEpisode?.playUrl) {
                actualPlayUrl = seriesData.nextUpEpisode.playUrl;
                actualId = seriesData.nextUpEpisode.Id;
                actualType = 'Episode';
            }            
            try {
                const headers = {
                    "X-Environment": getEnvironmentHeader(),
                    "X-Session-ID": getOrCreateGenSessionId(),
                    'Origin': typeof window !== 'undefined' ? window.location.origin : ''
                };

                const jellyAccessToken = await getCookieValue('jellyAccessToken');
                const jellyUserId = await getCookieValue('jellyUserId');
                
                if (jellyAccessToken && jellyUserId) {
                    headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
                }

                const response = await fetch(actualPlayUrl, {
                    method: 'GET',
                    headers
                });
                
                if (!mounted) return;

                if (!response.ok) {
                    throw new Error(`Failed to start playback: ${response.statusText}`);
                }

                const data = await response.json();
                if (!data.playbackUrl) {
                    throw new Error('Invalid playback response from server');
                }

                setPlaybackData({ ...data, episodeId: actualId, episodeType: actualType });
                setError(null);
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchPlaybackData();

        return () => {
            mounted = false;
            setIsLoading(false);
            setError(null);
            setPlaybackData(null);
        };    }, [id, type, playUrl, seriesData]);

    const handleCantPlay = () => {
        alert("Cannot play this title. Please try another title.");
    };
      const handlePlay = () => {
        setIsLoading(true);
        if (playbackData) {
            if (type === 'Series' && playbackData.episodeId) {
                router.push(`/watch?id=${playbackData.episodeId}&type=${playbackData.episodeType}&seriesId=${id}`);
            } else {
                router.push(`/watch?id=${id}&type=${type}`);
            }
        }
    };

    if (isLoading) {
        return (
            <button className="my-4 px-12 btn w-full sm:w-fit btn-disabled">
                <span className="flex items-center gap-2">
                    <span className="loading loading-spinner"></span>
                    <span>Loading...</span>
                </span>
            </button>
        );
    }

    if (error || !playbackData) {
        return (
            <button className="my-4 px-12 btn w-full sm:w-fit btn-error cursor-not-allowed" onClick={handleCantPlay}>
                <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>Cannot Play</span>
                </span>
            </button>
        );
    }

    return (
        <button 
            onClick={handlePlay}
            className="my-4 px-12 btn w-full sm:w-fit btn-neutral hover:btn-accent"
        >
            <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                <span>Play</span>
            </span>
        </button>
    );
}