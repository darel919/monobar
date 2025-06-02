"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function SeasonsEpisodesViewer({ seriesData, currentEpisodeId, mode = "info" }) {
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const [nextEpisode, setNextEpisode] = useState(null);
    const [allowAutoScroll, setAllowAutoScroll] = useState(true);
    const router = useRouter();
    const isWatchMode = mode === "watch";const currentEpisodeRef = useRef(null);
    const nextEpisodeRef = useRef(null);
    const latestEpisodeRef = useRef(null);

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
    const findLatestUnplayedEpisode = () => {
        if (!seriesData?.availableSeasons) return null;

        for (const season of seriesData.availableSeasons) {
            if (!season.episodes?.length) continue;
            
            let highestWatchedIndex = -1;
            
            // Find the highest watched episode index in this season
            for (let i = 0; i < season.episodes.length; i++) {
                if (isEpisodeWatched(season.episodes[i])) {
                    highestWatchedIndex = i;
                }
            }
            
            // Return the next unwatched episode after the highest watched
            for (let i = highestWatchedIndex + 1; i < season.episodes.length; i++) {
                if (!isEpisodeWatched(season.episodes[i])) {
                    return season.episodes[i];
                }
            }
        }
        
        // If all episodes are watched, return the very first episode (S01E01)
        if (seriesData.availableSeasons[0]?.episodes?.length > 0) {
            return seriesData.availableSeasons[0].episodes[0];
        }
        
        return null;
    };

    const isEpisodeWatched = (episode) => {
        return episode.UserData?.Played || false;
    };    
    const latestUnplayedEpisode = useMemo(() => {
        return findLatestUnplayedEpisode();
    }, [seriesData, selectedSeason]);

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
        if (mode === 'info' && !currentEpisodeId && latestUnplayedEpisode && seriesData?.availableSeasons && !selectedSeason && allowAutoScroll) {
            const targetSeason = seriesData.availableSeasons.find(season => 
                season.episodes?.some(episode => episode.Id === latestUnplayedEpisode.Id)
            );
            
            if (targetSeason) {
                setSelectedSeason(targetSeason);
            }
        }
    }, [latestUnplayedEpisode, mode, currentEpisodeId, seriesData, selectedSeason, allowAutoScroll]);
    
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
    useEffect(() => {
        if (mode === 'info' && selectedSeason?.episodes?.length > 0 && !currentEpisodeId && latestUnplayedEpisode && allowAutoScroll) {
            const scrollTimeout = setTimeout(() => {
                if (latestEpisodeRef.current) {
                    // Check if we're on desktop
                    if (window.innerWidth >= 768) {
                        // Desktop: Horizontal scroll
                        const container = latestEpisodeRef.current.closest('.md\\:overflow-x-auto');
                        
                        if (container) {
                            const elementLeft = latestEpisodeRef.current.offsetLeft;
                            const elementWidth = latestEpisodeRef.current.offsetWidth;
                            const containerWidth = container.offsetWidth;
                            const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
                            
                            container.scrollTo({
                                left: Math.max(0, scrollLeft),
                                behavior: 'smooth'
                            });
                        }                    
                    } else {
                        // Mobile: Vertical scroll to bottom of selected episode
                        const verticalContainer = latestEpisodeRef.current.closest('.h-96');
                        if (verticalContainer) {
                            const elementTop = latestEpisodeRef.current.offsetTop;
                            const elementHeight = latestEpisodeRef.current.offsetHeight;
                            const containerHeight = verticalContainer.offsetHeight;
                            const scrollTop = elementTop + elementHeight - containerHeight;
                            
                            verticalContainer.scrollTo({
                                top: Math.max(0, scrollTop),
                                behavior: 'smooth'
                            });
                        } else {
                            // Fallback
                            latestEpisodeRef.current.scrollIntoView({
                                behavior: 'smooth',
                                block: 'end',
                                inline: 'center'
                            });
                        }
                    }
                }            
            }, 1000);            
                return () => clearTimeout(scrollTimeout);
        }
    }, [selectedSeason, mode, currentEpisodeId, latestUnplayedEpisode, allowAutoScroll]);    
    const handleSeasonChange = (season) => {
        setSelectedSeason(season);
        setAllowAutoScroll(false);
        if (season.episodes?.length > 0) {
            setSelectedEpisode(season.episodes[0]);
        }
          // Reset scroll position to beginning when switching seasons
        setTimeout(() => {
            if (window.innerWidth >= 768) {
                // Desktop: Reset horizontal scroll
                const container = document.querySelector('.md\\:overflow-x-auto');
                if (container) {
                    container.scrollTo({
                        left: 0,
                        behavior: 'smooth'
                    });
                }
            } else {
                // Mobile: Reset vertical scroll for episodes container
                const container = document.querySelector('.h-96.overflow-y-auto');
                if (container) {
                    container.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100);
    };
    const handleScrollToUnwatched = () => {
        const episodeInCurrentSeason = selectedSeason?.episodes?.find(ep => ep.Id === latestUnplayedEpisode?.Id);
        
        if (episodeInCurrentSeason && latestEpisodeRef.current) {
            // Check if we're on desktop with horizontal scroll
            const horizontalContainer = latestEpisodeRef.current.closest('.md\\:overflow-x-auto');
            
            if (horizontalContainer && window.innerWidth >= 768) {
                // Desktop: Horizontal scroll
                const elementLeft = latestEpisodeRef.current.offsetLeft;
                const elementWidth = latestEpisodeRef.current.offsetWidth;
                const containerWidth = horizontalContainer.offsetWidth;
                const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
                
                horizontalContainer.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth'                });
            } else {
                // Mobile: Vertical scroll to bottom of selected episode
                const verticalContainer = latestEpisodeRef.current.closest('.h-96');
                if (verticalContainer) {
                    const elementTop = latestEpisodeRef.current.offsetTop;
                    const elementHeight = latestEpisodeRef.current.offsetHeight;
                    const containerHeight = verticalContainer.offsetHeight;
                    const scrollTop = elementTop + elementHeight - containerHeight;
                    
                    verticalContainer.scrollTo({
                        top: Math.max(0, scrollTop),
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback
                    latestEpisodeRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end',
                        inline: 'nearest'
                    });
                }
            }
        } else if (latestUnplayedEpisode) {
            // Switch to correct season first
            const targetSeason = seriesData.availableSeasons.find(season => 
                season.episodes?.some(episode => episode.Id === latestUnplayedEpisode.Id)
            );
            
            if (targetSeason) {
                setSelectedSeason(targetSeason);
                setTimeout(() => {
                    if (latestEpisodeRef.current) {
                        // Check if we're on desktop with horizontal scroll
                        const horizontalContainer = latestEpisodeRef.current.closest('.md\\:overflow-x-auto');
                        
                        if (horizontalContainer && window.innerWidth >= 768) {
                            // Desktop: Horizontal scroll
                            const elementLeft = latestEpisodeRef.current.offsetLeft;
                            const elementWidth = latestEpisodeRef.current.offsetWidth;
                            const containerWidth = horizontalContainer.offsetWidth;
                            const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
                            
                            horizontalContainer.scrollTo({
                                left: Math.max(0, scrollLeft),
                                behavior: 'smooth'
                            });                        
                        } else {
                            // Mobile: Vertical scroll to bottom of selected episode
                            const verticalContainer = latestEpisodeRef.current.closest('.h-96');
                            if (verticalContainer) {
                                const elementTop = latestEpisodeRef.current.offsetTop;
                                const elementHeight = latestEpisodeRef.current.offsetHeight;
                                const containerHeight = verticalContainer.offsetHeight;
                                const scrollTop = elementTop + elementHeight - containerHeight;
                                
                                verticalContainer.scrollTo({
                                    top: Math.max(0, scrollTop),
                                    behavior: 'smooth'
                                });
                            } else {
                                // Fallback
                                latestEpisodeRef.current.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'end',
                                    inline: 'nearest'
                                });
                            }
                        }
                    }
                }, 100);
            }
        }
    };
    const handleEpisodeClick = (episode) => {
        setSelectedEpisode(episode);
        router.replace(`/watch?id=${episode.Id}&type=Episode&seriesId=${seriesData.Id}`);
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
    const getWatchProgress = (episode) => {
        if (!episode.UserData) return 0;
        
        // Use PlayedPercentage if available
        if (episode.UserData.PlayedPercentage !== undefined && episode.UserData.PlayedPercentage !== null) {
            return Math.min(episode.UserData.PlayedPercentage, 100);
        }
        
        // Fall back to calculating from PlaybackPositionTicks
        if (!episode.RunTimeTicks) return 0;
        if (!episode.UserData.PlaybackPositionTicks) return 0;        
        return Math.min((episode.UserData.PlaybackPositionTicks / episode.RunTimeTicks) * 100, 100);
    };    
    const hasWatchProgress = (episode) => {
        const progress = getWatchProgress(episode);
        return progress > 0 && progress < 100;
    };

    if (!seriesData?.availableSeasons?.length) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p>No seasons available</p>
            </div>
        );
    }    
    return (
        <div className={`flex ${isWatchMode ? 'flex-col h-full' : 'flex-col'}`}>            {/* Season Selector */}
            <div className={`p-4`}>
                {/* <h3 className={`font-semibold mb-3 text-lg md:text-xl`}>Seasons</h3> */}
                
                {/* Mobile: Horizontal scroll, Desktop: Flex wrap */}
                <div className="md:hidden">
                    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                        {seriesData.availableSeasons.map((season) => (
                            <div
                                key={season.Id}
                                onClick={() => handleSeasonChange(season)}
                                className={`cursor-pointer whitespace-nowrap flex-shrink-0 px-2 py-3 transition-all duration-200 border-b-2 ${
                                    selectedSeason?.Id === season.Id 
                                        ? 'border-primary text-primary font-medium' 
                                        : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-content/30'
                                }`}
                            >
                                Season {season.IndexNumber || season.Name}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Desktop: Traditional flex wrap */}
                <div className="hidden md:flex gap-6 flex-wrap">
                    {seriesData.availableSeasons.map((season) => (
                        <div
                            key={season.Id}
                            onClick={() => handleSeasonChange(season)}
                            className={`cursor-pointer px-2 py-3 transition-all duration-200 border-b-2 ${
                                selectedSeason?.Id === season.Id 
                                    ? 'border-primary text-primary font-medium' 
                                    : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-content/30'
                            }`}
                        >
                            Season {season.IndexNumber || season.Name}
                        </div>
                    ))}
                </div>
            </div>
            {/* Episodes List */}
            <div className={`flex-1 ${isWatchMode ? 'md:overflow-y-auto' : 'overflow-y-auto'}`}>
                {selectedSeason?.episodes?.length > 0 ? (                    
                    <div className="px-3 py-4 md:p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className={`font-semibold text-base md:text-lg`}>
                                Episodes ({selectedSeason.episodes.length})
                            </h4>
                            {latestUnplayedEpisode && (
                                <button
                                    onClick={handleScrollToUnwatched}
                                    className="btn btn-sm btn-ghost gap-2 text-xs"
                                    title="Scroll to next unwatched episode"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                    </svg>
                                    Find Unwatched
                                </button>
                            )}
                        </div>
                        <div className={`${mode === 'info' ? 'flex flex-col gap-3 h-96 overflow-y-auto md:flex-row md:gap-4 md:overflow-x-auto md:overflow-y-visible md:h-auto md:pb-4 scrollbar-hide' : 'space-y-3 md:space-y-4'}`}>                            
                            {(() => {
                                return selectedSeason.episodes.map((episode, index) => (
                                <div 
                                    key={episode.Id}
                                    ref={currentEpisodeId === episode.Id ? currentEpisodeRef : 
                                         nextEpisode?.Id === episode.Id ? nextEpisodeRef : 
                                         latestUnplayedEpisode?.Id === episode.Id ? latestEpisodeRef : null}                                    
                                         onClick={() => handleEpisodeClick(episode)}
                                    className={`rounded-xl cursor-pointer transition-all duration-200 touch-manipulation active:scale-[0.98] ${mode === 'info' ? 'flex-shrink-0 w-full md:w-64' : ''}
                                        ${mode === 'info' ? '' : currentEpisodeId === episode.Id ? 'bg-primary/10 border-primary shadow-lg' : 
                                          selectedEpisode?.Id === episode.Id ? 'shadow-md' : 
                                          'hover:shadow-md'}
                                        ${mode !== 'info' ? '' : currentEpisodeId === episode.Id ? 'md:ring-2 md:ring-primary' : 'hover:opacity-80'}`}
                                >                                
                                {/* Mobile Layout - Same as Desktop Card */}
                                    <div className={`${mode === 'info' ? 'md:hidden' : 'md:hidden'}`}>
                                        <div className="p-3">
                                            <div className="flex flex-col h-full">
                                                {/* Episode thumbnail */}
                                                <div className="w-full h-32 bg-base-300 rounded-lg overflow-hidden relative mb-3">
                                                    {episode.ImageTags?.Primary ? (
                                                        <>
                                                            <img
                                                                src={episode.ImageTags.Primary}
                                                                alt={`Episode ${episode.IndexNumber}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            
                                                            {/* Watched indicator overlay */}
                                                            {isEpisodeWatched(episode) && (
                                                                <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Runtime display */}
                                                            {episode.RunTimeTicks && (
                                                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                                    {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Watch progress bar */}
                                                            {hasWatchProgress(episode) && (
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/20 h-1">
                                                                    <div 
                                                                        className="h-full bg-accent transition-all duration-300"
                                                                        style={{ width: `${getWatchProgress(episode)}%` }}
                                                                    />
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

                                                {/* Episode Name */}
                                                <h5 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                                                    S{String(selectedSeason.IndexNumber || 1).padStart(2, '0')}E{String(episode.IndexNumber || index + 1).padStart(2, '0')}: {episode.Name}
                                                </h5>
                                                
                                                {/* Episode sub-data */}
                                                <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                                                    {episode.PremiereDate && (
                                                        <span>{formatDate(episode.PremiereDate)}</span>
                                                    )}
                                                    {episode.CommunityRating && (
                                                        <div className="flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-yellow-500">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                            </svg>
                                                            {episode.CommunityRating.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Overview */}
                                                {episode.Overview && (
                                                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-1">
                                                        {episode.Overview}
                                                    </p>
                                                )}
                                                
                                                {/* Currently Playing / Up Next indicators */}
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
                                                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                                        <span className="text-secondary font-medium text-xs">Up Next</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                      {/* Info Page Card Layout - Desktop */}
                                    {mode === 'info' && (
                                        <div className="hidden md:block p-3">
                                            <div className="flex flex-col h-full">
                                                {/* Episode thumbnail */}
                                                <div className="w-full h-32 bg-base-300 rounded-lg overflow-hidden relative mb-3">
                                                    {episode.ImageTags?.Primary ? (
                                                        <>
                                                            <img
                                                                src={episode.ImageTags.Primary}
                                                                alt={`Episode ${episode.IndexNumber}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            
                                                            {/* Watched indicator overlay */}
                                                            {isEpisodeWatched(episode) && (
                                                                <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Runtime display */}
                                                            {episode.RunTimeTicks && (
                                                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                                    {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Watch progress bar */}
                                                            {hasWatchProgress(episode) && (
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/20 h-1">
                                                                    <div 
                                                                        className="h-full bg-accent transition-all duration-300"
                                                                        style={{ width: `${getWatchProgress(episode)}%` }}
                                                                    />
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

                                                {/* Episode Name */}
                                                <h5 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                                                    S{String(selectedSeason.IndexNumber || 1).padStart(2, '0')}E{String(episode.IndexNumber || index + 1).padStart(2, '0')}: {episode.Name}
                                                </h5>
                                                
                                                {/* Episode sub-data */}
                                                <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                                                    {episode.PremiereDate && (
                                                        <span>{formatDate(episode.PremiereDate)}</span>
                                                    )}
                                                    {episode.CommunityRating && (
                                                        <div className="flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 text-yellow-500">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                            </svg>
                                                            {episode.CommunityRating.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Overview */}
                                                {episode.Overview && (
                                                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-1">
                                                        {episode.Overview}
                                                    </p>
                                                )}
                                                
                                                {/* Currently Playing / Up Next indicators */}
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
                                                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                                        <span className="text-secondary font-medium text-xs">Up Next</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Desktop Layout - For non-info modes */}
                                    {mode !== 'info' && (
                                        <div className="hidden md:block p-2">
                                        <div className="flex items-start gap-3">                                            
                                            {/* Episode Thumbnail - Desktop */}
                                            <div className="flex-shrink-0 bg-base-300 rounded overflow-hidden w-32 h-18 relative">
                                                {episode.ImageTags?.Primary ? (
                                                    <>
                                                        <img
                                                            src={episode.ImageTags.Primary}
                                                            alt={`Episode ${episode.IndexNumber}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        
                                                        {/* Watched indicator overlay - Desktop */}
                                                        {isEpisodeWatched(episode) && (
                                                            <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        
                                                        {/* YouTube-style duration badge - Desktop */}
                                                        {episode.RunTimeTicks && isWatchMode && (
                                                            <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded text-[10px] leading-none">
                                                                {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Progress bar - Desktop */}
                                                        {hasWatchProgress(episode) && (
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/20 h-0.5">
                                                                <div 
                                                                    className="h-full bg-accent transition-all duration-300"
                                                                    style={{ width: `${getWatchProgress(episode)}%` }}
                                                                />
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
                                            <div className="flex-1 min-w-0">                                                
                                                <div className="flex items-center gap-2">
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
                                    )}                                
                                    </div>
                                ));
                            })()}
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
