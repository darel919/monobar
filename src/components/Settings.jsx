"use client";

import { useState, useEffect } from 'react';
import usePlaybackStore from "@/store/playbackStore";
import { homeViewUtils } from '@/lib/homeViewUtils';

export default function Settings({ showBackButton = true, context = 'standalone' }) {
    const playNextShowThreshold = usePlaybackStore(state => state.playNextShowThreshold);
    const playNextAutoProgressThreshold = usePlaybackStore(state => state.playNextAutoProgressThreshold);
    const setPlayNextShowThreshold = usePlaybackStore(state => state.setPlayNextShowThreshold);
    const setPlayNextAutoProgressThreshold = usePlaybackStore(state => state.setPlayNextAutoProgressThreshold);
      const [settings, setSettings] = useState({
        playTrailersAutomatically: true,
        playNextEnabled: true,
        theme: 'system',
        subtitleSize: 'medium',
        homeViewMode: 'posterView'
    });
    const [isLoaded, setIsLoaded] = useState(false);    useEffect(() => {          
        const savedSettings = {
            playTrailersAutomatically: localStorage.getItem('playTrailersAutomatically') !== 'false',
            playNextEnabled: localStorage.getItem('playNextEnabled') !== 'false',
            theme: localStorage.getItem('theme') || 'system',
            subtitleSize: localStorage.getItem('subtitleSize') || 'medium',
            homeViewMode: homeViewUtils.getHomeViewMode()
        };
        setSettings(savedSettings);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        
        const html = document.documentElement;
        
        const applyTheme = (theme) => {
            if (theme === 'system') {
                html.removeAttribute('data-theme');

                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    html.setAttribute('data-theme', 'dark');
                } else {
                    html.setAttribute('data-theme', 'light');
                }
            } else if (theme === 'dark') {
                html.setAttribute('data-theme', 'dark');
            } else if (theme === 'light') {
                html.setAttribute('data-theme', 'light');
            } else {
                html.setAttribute('data-theme', theme);
            }
        };

        applyTheme(settings.theme);
        localStorage.setItem('theme', settings.theme);
    }, [settings.theme, isLoaded]);          useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('playTrailersAutomatically', settings.playTrailersAutomatically.toString());
        localStorage.setItem('playNextEnabled', settings.playNextEnabled.toString());
        localStorage.setItem('subtitleSize', settings.subtitleSize);
        homeViewUtils.setHomeViewMode(settings.homeViewMode);
        
        // Trigger custom event for real-time subtitle updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'subtitleSize',
            newValue: settings.subtitleSize
        }));
    }, [settings.playTrailersAutomatically, settings.playNextEnabled, settings.subtitleSize, settings.homeViewMode, isLoaded]);

    const handleTrailerToggle = () => {
        setSettings(prev => ({
            ...prev,
            playTrailersAutomatically: !prev.playTrailersAutomatically
        }));
    };

    const handlePlayNextToggle = () => {
        setSettings(prev => ({
            ...prev,
            playNextEnabled: !prev.playNextEnabled
        }));
    };      

    const handleThemeChange = (newTheme) => {
        setSettings(prev => ({
            ...prev,
            theme: newTheme
        }));
    };    const handleSubtitleSizeChange = (newSize) => {
        setSettings(prev => ({
            ...prev,
            subtitleSize: newSize
        }));
    };

    const handleHomeViewModeChange = (newMode) => {
        setSettings(prev => ({
            ...prev,
            homeViewMode: newMode
        }));
    };

    const handleShowThresholdChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 15 && value <= 45) {
            setPlayNextShowThreshold(value);
        }
    };

    const handleAutoProgressThresholdChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 0 && value <= Math.max(0, playNextShowThreshold - 3)) {
            setPlayNextAutoProgressThreshold(value);
        }
    };    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {            localStorage.removeItem('playTrailersAutomatically');
            localStorage.removeItem('playNextEnabled');
            localStorage.removeItem('theme');
            localStorage.removeItem('subtitleSize');
            localStorage.removeItem('homeViewMode');            
            setSettings({
                playTrailersAutomatically: true,
                playNextEnabled: true,
                theme: 'system',
                subtitleSize: 'medium',
                homeViewMode: 'default_poster_home'
            });
            document.documentElement.removeAttribute('data-theme');
            window.location.reload();
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }    return (
        <div className="space-y-6 overflow-x-hidden max-w-full">
            {/* Playback Settings */}
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body overflow-x-hidden">
                    <h2 className="card-title text-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                        Playback
                    </h2>
                    {/* Play Trailers Automatically - only show outside of player context */}
                    {context !== 'player' && (
                        <div className="form-control w-full">
                            <label className="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">
                                <input 
                                    type="checkbox" 
                                    className="toggle toggle-primary mt-1" 
                                    checked={settings.playTrailersAutomatically}
                                    onChange={handleTrailerToggle}
                                />
                                <div className="flex flex-col flex-1">
                                    <span className="label-text text-lg font-medium break-normal">Play Trailers Automatically</span>
                                    <p className="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                        When enabled, trailers will automatically play on movie's info page.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                    
                    {/* Play Next for TV Series */}                    
                    <div className="form-control w-full">
                        <label className="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">
                            <input 
                                type="checkbox" 
                                className="toggle toggle-primary mt-1" 
                                checked={settings.playNextEnabled}
                                onChange={handlePlayNextToggle}
                            />
                            <div className="flex flex-col flex-1">
                                <span className="label-text text-lg font-medium break-normal">Show "Play Next" for TV Series</span>
                                <p className="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                    When enabled, shows a "Play Next" prompt {playNextShowThreshold} seconds before an episode ends, counting down to {playNextAutoProgressThreshold} seconds when it auto-progresses. You can dismiss it to let the video play to 0 seconds before progressing.
                                </p>
                            </div>
                        </label>
                    </div>                    
                    {/* Play Next Timing Settings */}
                    {settings.playNextEnabled && (
                        <div className="mt-4 space-y-4">
                            {/* Show "Play Next" Threshold */}
                            <div className="rounded-lg bg-base-300/20 p-4">
                                <div className="form-control">
                                    <span className="text-sm font-medium mb-3">Show "Play Next" at (seconds before end)</span>
                                    <input 
                                        type="range" 
                                        min="15" 
                                        max="45" 
                                        value={playNextShowThreshold} 
                                        className="range range-primary w-full" 
                                        onChange={handleShowThresholdChange}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm opacity-70">15s</span>
                                        <input 
                                            type="number" 
                                            min="15" 
                                            max="45" 
                                            value={playNextShowThreshold} 
                                            className="input input-bordered input-sm w-16 text-center" 
                                            onChange={handleShowThresholdChange}
                                        />
                                        <span className="text-sm opacity-70">45s</span>
                                    </div>
                                </div>
                            </div>

                            {/* Auto-progress Threshold */}
                            <div className="rounded-lg bg-base-300/20 p-4">
                                <div className="form-control">
                                    <span className="text-sm font-medium mb-3">Auto-progress at (seconds before end)</span>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={Math.max(0, playNextShowThreshold - 3)} 
                                        value={playNextAutoProgressThreshold} 
                                        className="range range-secondary w-full" 
                                        onChange={handleAutoProgressThresholdChange}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm opacity-70">0s</span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max={Math.max(0, playNextShowThreshold - 3)} 
                                            value={playNextAutoProgressThreshold} 
                                            className="input input-bordered input-sm w-16 text-center" 
                                            onChange={handleAutoProgressThresholdChange}
                                        />
                                        <span className="text-sm opacity-70">{Math.max(0, playNextShowThreshold - 3)}s</span>
                                    </div>
                                    <p className="text-xs opacity-70 mt-2">Must be at least 3 seconds before show threshold</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subtitle Size Selection */}
                    <div className="form-control">
                        <div className="label">
                            <span className="label-text text-lg font-medium">Subtitle Size</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="subtitleSize" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.subtitleSize === 'small'}
                                    onChange={() => handleSubtitleSizeChange('small')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Small</span>
                                    <p className="text-sm whitespace-normal leading-snug">Compact subtitle size.</p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="subtitleSize" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.subtitleSize === 'medium'}
                                    onChange={() => handleSubtitleSizeChange('medium')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Medium (Default)</span>
                                    <p className="text-sm whitespace-normal leading-snug">Standard subtitle size.</p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="subtitleSize" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.subtitleSize === 'large'}
                                    onChange={() => handleSubtitleSizeChange('large')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Large</span>
                                    <p className="text-sm whitespace-normal leading-snug">Bigger subtitle size.</p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="subtitleSize" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.subtitleSize === 'x-large'}
                                    onChange={() => handleSubtitleSizeChange('x-large')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Extra Large</span>
                                    <p className="text-sm whitespace-normal leading-snug">Maximum subtitle size.</p>
                                </div>
                            </label>
                        </div>
                    </div>                </div>
            </div>

            {/* Home Settings */}
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Home
                    </h2>
                    
                    {/* Home View Mode Selection */}
                    <div className="form-control">
                        <div className="label">
                            <span className="label-text text-lg font-medium">Default View Mode</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {homeViewUtils.getAvailableViewModes().map((mode) => (
                                <label key={mode.id} className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                    <input 
                                        type="radio" 
                                        name="homeViewMode" 
                                        className="radio radio-primary mt-1" 
                                        checked={settings.homeViewMode === mode.id}
                                        onChange={() => handleHomeViewModeChange(mode.id)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="label-text font-medium flex items-center gap-2">
                                            {mode.icon}
                                            {mode.name}
                                        </span>
                                        <p className="text-sm whitespace-normal leading-snug">{mode.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
                        </svg>
                        Appearance
                    </h2>
                    
                    {/* Theme Selection */}
                    <div className="form-control">
                        <div className="label">
                            <span className="label-text text-lg font-medium">Theme</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="theme" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.theme === 'system'}
                                    onChange={() => handleThemeChange('system')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">System (Default)</span>
                                    <p className="text-sm whitespace-normal leading-snug">Automatically match your device settings.</p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="theme" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.theme === 'dark'}
                                    onChange={() => handleThemeChange('dark')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Dark</span>
                                    <p className="text-sm whitespace-normal leading-snug">Dark theme for low-light environments.</p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">
                                <input 
                                    type="radio" 
                                    name="theme" 
                                    className="radio radio-primary mt-1" 
                                    checked={settings.theme === 'light'}
                                    onChange={() => handleThemeChange('light')}
                                />
                                <div className="flex flex-col">
                                    <span className="label-text font-medium">Light</span>
                                    <p className="text-sm whitespace-normal leading-snug">Light theme for bright environments.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Settings */}
            {showBackButton && (
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Reset
                        </h2>
                        
                        <div className="flex flex-row gap-4 items-start">
                            <button 
                                className="btn btn-outline btn-warning"
                                onClick={handleResetSettings}
                            >
                                Reset All Settings
                            </button>
                            <p className="text-sm">
                                This will restore all settings to their default values.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
