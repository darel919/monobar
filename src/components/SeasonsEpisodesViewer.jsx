"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SeasonsEpisodesViewer({ seriesData, currentEpisodeId, mode = "info" }) {
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const [nextEpisode, setNextEpisode] = useState(null);
    const router = useRouter();
    const isWatchMode = mode === "watch";
    const currentEpisodeRef = useRef(null);
    const nextEpisodeRef = useRef(null);

    const findNextEpisode = (currentId) => {
        if (!seriesData?.availableSeasons) return null;

        for (const season of seriesData.availableSeasons) {
            const episodeIndex = season.episodes?.findIndex(ep => ep.Id === currentId);
            if (episodeIndex !== -1 && episodeIndex !== undefined) {
                if (episodeIndex < season.episodes.length - 1) {
                    return season.episodes[episodeIndex + 1];
                }
                
                const seasonIndex = seriesData.availableSeasons.indexOf(season);
                for (let i = seasonIndex + 1; i < seriesData.availableSeasons.length; i++) {
                    if (seriesData.availableSeasons[i].episodes?.length > 0) {
                        return seriesData.availableSeasons[i].episodes[0];
                    }
                }
                break;
            }
        }
        return null;
    };

    useEffect(() => {
        if (seriesData?.availableSeasons?.length > 0) {
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

    useEffect(() => {
        if (currentEpisodeId) {
            const next = findNextEpisode(currentEpisodeId);
            setNextEpisode(next);
        }
    }, [currentEpisodeId, seriesData]);    
    useEffect(() => {
        if (currentEpisodeId && currentEpisodeRef.current && mode !== "watch") {
            const scrollTimeout = setTimeout(() => {
                currentEpisodeRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);

            return () => clearTimeout(scrollTimeout);
        }
    }, [currentEpisodeId, selectedSeason, mode]);

    const handleSeasonChange = (season) => {
        setSelectedSeason(season);
        if (season.episodes?.length > 0) {
            setSelectedEpisode(season.episodes[0]);
        }
    };    
    const handleEpisodeClick = (episode) => {
        setSelectedEpisode(episode);
        router.replace(`/watch?id=${episode.Id}&type=Episode&seriesId=${seriesData.Id}`);
    };    const formatRuntime = (ticks) => {
        if (!ticks) return '';
        const totalMinutes = Math.floor(ticks / 600000000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatRuntimeDetailed = (ticks) => {
        if (!ticks) return '';
        const totalSeconds = Math.floor(ticks / 10000000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        <div className={`flex ${isWatchMode ? 'flex-col h-full' : 'flex-col'}`}>
            {/* Season Selector */}
            <div className={`px-3 py-4 border-b border-base-300 ${isWatchMode ? '' : 'bg-base-200'}`}>
                <h3 className={`font-semibold mb-3 text-lg md:text-xl`}>Seasons</h3>
                
                {/* Mobile: Horizontal scroll, Desktop: Flex wrap */}
                <div className="md:hidden">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {seriesData.availableSeasons.map((season) => (
                            <button
                                key={season.Id}
                                onClick={() => handleSeasonChange(season)}
                                className={`btn btn-sm whitespace-nowrap flex-shrink-0 px-4 py-2 min-h-[2.5rem] ${
                                    selectedSeason?.Id === season.Id 
                                        ? 'btn-primary' 
                                        : 'btn-ghost'
                                }`}
                            >
                                Season {season.IndexNumber || season.Name}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Desktop: Traditional flex wrap */}
                <div className="hidden md:flex gap-2 flex-wrap">
                    {seriesData.availableSeasons.map((season) => (
                        <button
                            key={season.Id}
                            onClick={() => handleSeasonChange(season)}
                            className={`btn btn-sm ${
                                selectedSeason?.Id === season.Id 
                                    ? 'btn-primary' 
                                    : 'btn-ghost'
                            }`}
                        >
                            Season {season.IndexNumber || season.Name}
                        </button>
                    ))}
                </div>
            </div>            
            {/* Episodes List */}
            <div className={`flex-1 ${isWatchMode ? 'md:overflow-y-auto' : 'overflow-y-auto'}`}>
                {selectedSeason?.episodes?.length > 0 ? (
                    <div className="px-3 py-4 md:p-4">
                        <h4 className={`font-semibold mb-4 text-base md:text-lg`}>
                            Episodes ({selectedSeason.episodes.length})
                        </h4>
                        
                        {/* Mobile-optimized episode list */}
                        <div className="space-y-3 md:space-y-4">
                            {selectedSeason.episodes.map((episode, index) => (
                                <div 
                                    key={episode.Id}
                                    ref={currentEpisodeId === episode.Id ? currentEpisodeRef : 
                                         nextEpisode?.Id === episode.Id ? nextEpisodeRef : null}
                                    onClick={() => handleEpisodeClick(episode)}
                                    className={`rounded-xl cursor-pointer transition-all duration-200 touch-manipulation active:scale-[0.98]
                                        ${currentEpisodeId === episode.Id ? 'bg-primary/10 border-primary shadow-lg' : 
                                          
                                          selectedEpisode?.Id === episode.Id ? 'bg-base-200 border-base-300 shadow-md' : 
                                          'bg-base-100 border-base-200 hover:bg-base-200 hover:border-base-300 hover:shadow-md'}`}
                                >
                                    {/* Mobile Layout */}
                                    <div className="md:hidden">
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                {/* Episode number badge */}
                                                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        {episode.IndexNumber || index + 1}
                                                    </span>
                                                </div>
                                                
                                                {/* Episode info */}
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-semibold text-base leading-tight mb-1 line-clamp-2">
                                                        {episode.Name}
                                                    </h5>
                                                      <div className="flex items-center gap-3 mb-2">
                                                        {episode.CommunityRating && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-yellow-500">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                                </svg>
                                                                {episode.CommunityRating.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {episode.PremiereDate && (
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {formatDate(episode.PremiereDate)}
                                                        </p>
                                                    )}
                                                    
                                                    {episode.Overview && !isWatchMode && (
                                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                            {episode.Overview}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                              {/* Episode thumbnail - Mobile */}
                                            {episode.ImageTags?.Primary && (
                                                <div className="mt-3 w-full h-32 bg-base-300 rounded-lg overflow-hidden relative">
                                                    <img
                                                        src={episode.ImageTags.Primary}
                                                        alt={`Episode ${episode.IndexNumber}`}
                                                        className="w-full h-full object-cover"
                                                    />                                                    {/* YouTube-style duration badge - Mobile */}
                                                    {episode.RunTimeTicks && isWatchMode && (
                                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                            {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Status indicators */}
                                            {currentEpisodeId === episode.Id && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                    <span className="text-primary font-medium text-sm">
                                                        Currently Playing
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {nextEpisode?.Id === episode.Id && isWatchMode && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                                    <span className="text-secondary font-medium text-sm">Up Next</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Desktop Layout */}
                                    <div className="hidden md:block p-2">
                                        <div className="flex items-start gap-3">                                            {/* Episode Thumbnail - Desktop */}
                                            <div className="flex-shrink-0 bg-base-300 rounded overflow-hidden w-32 h-18 relative">
                                                {episode.ImageTags?.Primary ? (
                                                    <>
                                                        <img
                                                            src={episode.ImageTags.Primary}
                                                            alt={`Episode ${episode.IndexNumber}`}
                                                            className="w-full h-full object-cover"
                                                        />                                                        {/* YouTube-style duration badge - Desktop */}
                                                        {episode.RunTimeTicks && isWatchMode && (
                                                            <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded text-[10px] leading-none">
                                                                {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-base-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 opacity-50">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Episode Info - Desktop */}
                                            <div className="flex-1 min-w-0">                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-primary text-sm">
                                                        {episode.IndexNumber + '.' || index + 1}
                                                    </span>
                                                    <h5 className="font-semibold truncate">
                                                        {episode.Name}
                                                    </h5>
                                                </div>
                                                
                                                <div className="flex items-center text-gray-500 mb-2 text-xs gap-3">
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
                                                
                                                {/* Desktop Status indicators */}
                                                {currentEpisodeId === episode.Id && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                        <span className="text-primary font-medium text-xs">
                                                            Currently Playing
                                                        </span>
                                                    </div>
                                                )}

                                                {nextEpisode?.Id === episode.Id && isWatchMode && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-secondary font-medium text-xs">Up Next</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
