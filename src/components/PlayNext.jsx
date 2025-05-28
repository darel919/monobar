"use client"

import { useState, useEffect } from 'react';
import usePlaybackStore from '@/store/playbackStore';

export default function PlayNext({ 
    visible, 
    secondsRemaining, 
    nextEpisodeInfo, 
    onPlayNext, 
    onCancel,
    showThreshold,
    autoProgressThreshold
}) {
    const storeShowThreshold = usePlaybackStore(state => state.playNextShowThreshold);
    const storeAutoProgressThreshold = usePlaybackStore(state => state.playNextAutoProgressThreshold);
    
    const actualShowThreshold = showThreshold ?? storeShowThreshold;
    const actualAutoProgressThreshold = autoProgressThreshold ?? storeAutoProgressThreshold;    const [progress, setProgress] = useState(0);    
    useEffect(() => {
        if (visible && secondsRemaining > 0) {
            const totalProgressTime = actualShowThreshold - actualAutoProgressThreshold;
            const progressPercent = ((actualShowThreshold - secondsRemaining) / totalProgressTime) * 100;
            setProgress(Math.min(100, Math.max(0, progressPercent)));
        }
    }, [visible, secondsRemaining, actualShowThreshold, actualAutoProgressThreshold]);

    if (!visible || !nextEpisodeInfo) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50 bg-base-200/95 backdrop-blur-sm rounded-lg shadow-xl border border-base-300 w-80 overflow-hidden">
            {/* Progress bar background */}
            <div className="absolute inset-0 bg-primary/20">
                <div 
                    className="h-full bg-primary/40 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            {/* Content */}
            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    {/* <h3 className="text-lg font-semibold text-base-content">Play Next</h3> */}
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost btn-xs"
                        aria-label="Cancel auto play"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-2 mb-4">
                    <p className="text-sm text-base-content/80">
                        Season {nextEpisodeInfo.seasonNumber} • Episode {nextEpisodeInfo.episodeNumber}
                    </p>
                    <p className="font-medium text-base-content line-clamp-2">
                        {nextEpisodeInfo.title}
                    </p>
                </div>                  
                <div className="flex items-center justify-between">                      <span className="text-sm text-base-content/60">
                        {secondsRemaining <= actualAutoProgressThreshold ? 'Loading next episode...' : `Playing next episode in ${secondsRemaining}s`}
                    </span>
                    <button
                        onClick={onPlayNext}
                        className="btn btn-primary btn-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                        Play Now
                    </button>
                </div>
            </div>
        </div>
    );
}
