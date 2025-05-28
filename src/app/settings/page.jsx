"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import usePlaybackStore from '@/store/playbackStore';

export default function SettingsPage() {
    const router = useRouter();
    const playNextShowThreshold = usePlaybackStore(state => state.playNextShowThreshold);
    const playNextAutoProgressThreshold = usePlaybackStore(state => state.playNextAutoProgressThreshold);
    const setPlayNextShowThreshold = usePlaybackStore(state => state.setPlayNextShowThreshold);
    const setPlayNextAutoProgressThreshold = usePlaybackStore(state => state.setPlayNextAutoProgressThreshold);
    
    const [settings, setSettings] = useState({
        playTrailersAutomatically: true,
        playNextEnabled: true,
        theme: 'system' // 'system', 'dark', 'light'
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {        
        const savedSettings = {
            playTrailersAutomatically: localStorage.getItem('playTrailersAutomatically') !== 'false',
            playNextEnabled: localStorage.getItem('playNextEnabled') !== 'false',
            theme: localStorage.getItem('theme') || 'system'
        };
        setSettings(savedSettings);
        setIsLoaded(true);
    }, []);   
    useEffect(() => {
        if (!isLoaded) return;
        
        const html = document.documentElement;  
        document.title = 'moNobar Settings';        
        const applyTheme = (theme) => {
            console.log('Settings: Applying theme:', theme);
            if (theme === 'system') {
                html.removeAttribute('data-theme');

                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    html.setAttribute('data-theme', 'dark');
                    console.log('Settings: Applied mydark theme (system preference)');
                } else {
                    html.setAttribute('data-theme', 'light');
                    console.log('Settings: Applied dwsLight theme (system preference)');
                }
            } else if (theme === 'dark') {
                html.setAttribute('data-theme', 'dark');
                console.log('Settings: Applied mydark theme');
            } else if (theme === 'light') {
                html.setAttribute('data-theme', 'light');
                console.log('Settings: Applied dwsLight theme');
            } else {
                html.setAttribute('data-theme', theme);
                console.log('Settings: Applied theme:', theme);
            }

            setTimeout(() => {
                const computedStyle = getComputedStyle(document.body);
                const rootStyle = getComputedStyle(document.documentElement);
                console.log('Settings: Body background color:', computedStyle.backgroundColor);
                console.log('Settings: Data theme attribute:', html.getAttribute('data-theme'));
                console.log('Settings: --b1 CSS variable:', rootStyle.getPropertyValue('--b1'));
                console.log('Settings: --b2 CSS variable:', rootStyle.getPropertyValue('--b2'));
                console.log('Settings: --b3 CSS variable:', rootStyle.getPropertyValue('--b3'));
                console.log('Settings: All CSS variables on :root:');
                const allVars = {};
                for (let i = 0; i < rootStyle.length; i++) {
                    const property = rootStyle.item(i);
                    if (property.startsWith('--')) {
                        allVars[property] = rootStyle.getPropertyValue(property);
                    }
                }
                console.log(allVars);
            }, 100);
        };

        applyTheme(settings.theme);
        localStorage.setItem('theme', settings.theme);
    }, [settings.theme, isLoaded]);    
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('playTrailersAutomatically', settings.playTrailersAutomatically.toString());
        localStorage.setItem('playNextEnabled', settings.playNextEnabled.toString());
    }, [settings.playTrailersAutomatically, settings.playNextEnabled, isLoaded]);    
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
    };    const handleShowThresholdChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 15 && value <= 45) {
            setPlayNextShowThreshold(value);
            const maxAutoProgress = Math.max(0, value - 3);
            if (playNextAutoProgressThreshold > maxAutoProgress) {
                setPlayNextAutoProgressThreshold(maxAutoProgress);
            }
        }
    };const handleAutoProgressThresholdChange = (e) => {
        const value = parseInt(e.target.value);
        const maxAllowed = Math.max(0, playNextShowThreshold - 3);
        if (value >= 0 && value <= maxAllowed) {
            setPlayNextAutoProgressThreshold(value);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="loading loading-spinner loading-lg mx-auto block"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 mt-16">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button 
                        onClick={() => router.back()}
                        className="btn btn-ghost btn-sm mb-4 pl-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-4xl font-bold mb-2">Settings</h1>
                    <p className="text-base-content/70">Customize your moNobar experience</p>
                </div>

                <div className="space-y-6">
                    {/* Playback Settings */}
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>
                                Playback
                            </h2>
                              {/* Play Trailers Automatically */}
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4 flex flex-row items-start">
                                    <input 
                                        type="checkbox" 
                                        className="toggle toggle-primary mt-1" 
                                        checked={settings.playTrailersAutomatically}
                                        onChange={handleTrailerToggle}
                                    />
                                    <div className="flex flex-col">
                                        <span className="label-text text-lg font-medium">Play Trailers Automatically</span>
                                        <p className="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                            When enabled, trailers will automatically play on movie's info page.
                                        </p>
                                    </div>
                                </label>
                            </div>                            {/* Play Next for TV Series */}
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4 flex flex-row items-start">
                                    <input 
                                        type="checkbox" 
                                        className="toggle toggle-primary mt-1" 
                                        checked={settings.playNextEnabled}
                                        onChange={handlePlayNextToggle}
                                    />                                    <div className="flex flex-col">                                        <span className="label-text text-lg font-medium">Show "Play Next" for TV Series</span>                                        <p className="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                            When enabled, shows a "Play Next" prompt {playNextShowThreshold} seconds before an episode ends, counting down to {playNextAutoProgressThreshold} seconds when it auto-progresses. You can dismiss it to let the video play to 0 seconds before progressing.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Play Next Timing Settings */}
                            {settings.playNextEnabled && (
                                <div className="ml-8 space-y-4 border-l-2 border-base-300 pl-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Show "Play Next" at (seconds before end)</span>
                                        </label>                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" 
                                                min="15" 
                                                max="45" 
                                                value={playNextShowThreshold} 
                                                className="range range-primary flex-1" 
                                                onChange={handleShowThresholdChange}
                                            />
                                            <input 
                                                type="number" 
                                                min="15" 
                                                max="45" 
                                                value={playNextShowThreshold} 
                                                className="input input-bordered w-20 text-center" 
                                                onChange={handleShowThresholdChange}
                                            />
                                        </div>
                                        <p className="text-xs text-base-content/60 mt-1">Range: 15-45 seconds</p>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Auto-progress at (seconds before end)</span>
                                        </label>                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={Math.max(0, playNextShowThreshold - 3)} 
                                                value={playNextAutoProgressThreshold} 
                                                className="range range-secondary flex-1" 
                                                onChange={handleAutoProgressThresholdChange}
                                            />
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={Math.max(0, playNextShowThreshold - 3)} 
                                                value={playNextAutoProgressThreshold} 
                                                className="input input-bordered w-20 text-center" 
                                                onChange={handleAutoProgressThresholdChange}
                                            />
                                        </div>
                                        <p className="text-xs text-base-content/60 mt-1">Range: 0-{Math.max(0, playNextShowThreshold - 3)} seconds (must be at least 3s before show threshold)</p>
                                    </div>
                                </div>
                            )}
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
                                    onClick={() => {                                        
                                        if (confirm('Are you sure you want to reset all settings to default?')) {
                                            localStorage.removeItem('playTrailersAutomatically');
                                            localStorage.removeItem('playNextEnabled');
                                            localStorage.removeItem('theme');
                                            setSettings({
                                                playTrailersAutomatically: true,
                                                playNextEnabled: true,
                                                theme: 'system'
                                            });
                                            document.documentElement.removeAttribute('data-theme');
                                            window.location.reload();
                                        }
                                    }}
                                >
                                    Reset All Settings
                                </button>
                                <p className="text-sm">
                                    This will restore all settings to their default values.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
