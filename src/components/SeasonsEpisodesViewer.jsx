"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SeasonsEpisodesViewer({ seriesData, currentEpisodeId, mode = "info" }) {
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const router = useRouter();
    const isWatchMode = mode === "watch";
    const currentEpisodeRef = useRef(null);    
    useEffect(() => {
        if (seriesData?.availableSeasons?.length > 0) {
            // Find the season containing the current episode or default to first season
            let targetSeason = seriesData.availableSeasons[0];
            let targetEpisode = null;

            if (currentEpisodeId) {
                for (const season of seriesData.availableSeasons) {
                    const episode = season.episodes?.find(ep => ep.Id === currentEpisodeId);
                    if (episode) {
                        targetSeason = season;
                        targetEpisode = episode;
                        break;
                    }
                }
            }

            if (!targetEpisode && targetSeason?.episodes?.length > 0) {
                targetEpisode = targetSeason.episodes[0];
            }

            setSelectedSeason(targetSeason);
            setSelectedEpisode(targetEpisode);
        }
    }, [seriesData, currentEpisodeId]);

    // Auto-scroll to current episode
    useEffect(() => {
        if (currentEpisodeId && currentEpisodeRef.current) {
            const scrollTimeout = setTimeout(() => {
                currentEpisodeRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);

            return () => clearTimeout(scrollTimeout);
        }
    }, [currentEpisodeId, selectedSeason]);

    const handleSeasonChange = (season) => {
        setSelectedSeason(season);
        if (season.episodes?.length > 0) {
            setSelectedEpisode(season.episodes[0]);
        }
    };    const handleEpisodeClick = (episode) => {
        setSelectedEpisode(episode);
        router.push(`/watch?id=${episode.Id}&type=Episode&seriesId=${seriesData.Id}`);
    };

    const formatRuntime = (ticks) => {
        if (!ticks) return '';
        const totalMinutes = Math.floor(ticks / 600000000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (!seriesData?.availableSeasons?.length) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p>No seasons available</p>
            </div>
        );
    }    return (
        <div className={`flex ${isWatchMode ? 'flex-col h-full bg-base-200' : 'flex-col'}`}>
            {/* Season Selector */}
            <div className={`p-4 border-b border-base-300 ${isWatchMode ? '' : 'bg-base-200'}`}>
                <h3 className={`font-semibold mb-3 ${isWatchMode ? 'text-lg' : 'text-xl'}`}>Seasons</h3>
                <div className={`flex gap-2 ${isWatchMode ? 'flex-col' : 'flex-wrap'}`}>
                    {seriesData.availableSeasons.map((season) => (
                        <button
                            key={season.Id}
                            onClick={() => handleSeasonChange(season)}
                            className={`btn ${isWatchMode ? 'btn-sm w-full' : 'btn-sm'} ${
                                selectedSeason?.Id === season.Id 
                                    ? 'btn-primary' 
                                    : 'btn-ghost'
                            }`}
                        >
                            Season {season.IndexNumber || season.Name}
                        </button>
                    ))}
                </div>
            </div>            {/* Episodes List */}
            <div className={`flex-1 ${isWatchMode ? 'lg:overflow-y-auto' : 'overflow-y-auto'}`}>
                {selectedSeason?.episodes?.length > 0 ? (
                    <div className="p-4 space-y-3">
                        <h4 className={`font-semibold mb-3 ${isWatchMode ? 'text-sm' : 'text-md'}`}>
                            Episodes ({selectedSeason.episodes.length})
                        </h4>                        {selectedSeason.episodes.map((episode, index) => (
                            <div
                                key={episode.Id}
                                ref={currentEpisodeId === episode.Id ? currentEpisodeRef : null}
                                onClick={() => handleEpisodeClick(episode)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                    currentEpisodeId === episode.Id
                                        ? 'bg-primary/20 border-primary'
                                        : selectedEpisode?.Id === episode.Id
                                        ? 'bg-base-300 border-base-300'
                                        : 'bg-base-100 border-base-300 hover:bg-base-200'
                                }`}
                            >
                                <div className={`flex items-start gap-3 ${isWatchMode ? 'flex-col' : ''}`}>
                                    {/* Episode Thumbnail */}
                                    <div className={`flex-shrink-0 bg-base-300 rounded overflow-hidden ${
                                        isWatchMode ? 'w-full h-20' : 'w-24 h-14'
                                    }`}>
                                        {episode.ImageTags?.Primary ? (
                                            <img
                                                src={episode.ImageTags.Primary}
                                                alt={`Episode ${episode.IndexNumber}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-base-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 opacity-50">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Episode Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-medium text-primary ${isWatchMode ? 'text-xs' : 'text-sm'}`}>
                                                {episode.IndexNumber || index + 1}
                                            </span>
                                            <h5 className={`font-semibold truncate ${isWatchMode ? 'text-sm' : ''}`}>
                                                {episode.Name}
                                            </h5>
                                        </div>
                                        
                                        <div className={`flex items-center gap-3 text-gray-500 mb-2 ${
                                            isWatchMode ? 'text-xs flex-col items-start gap-1' : 'text-xs'
                                        }`}>
                                            {episode.RunTimeTicks && (
                                                <span>{formatRuntime(episode.RunTimeTicks)}</span>
                                            )}
                                            {episode.PremiereDate && (
                                                <span>{formatDate(episode.PremiereDate)}</span>
                                            )}
                                            {episode.CommunityRating && (
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                    </svg>
                                                    {episode.CommunityRating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>

                                        {episode.Overview && !isWatchMode && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {episode.Overview}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Current Episode Indicator */}
                                {currentEpisodeId === episode.Id && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        <span className={`text-primary font-medium ${isWatchMode ? 'text-xs' : 'text-xs'}`}>
                                            Currently Playing
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        <p>No episodes available for this season</p>
                    </div>
                )}
            </div>
        </div>
    );
}
