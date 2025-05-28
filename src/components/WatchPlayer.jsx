"use client"

import { useEffect, useRef, useCallback, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginChapter from 'artplayer-plugin-chapter';
import usePlaybackStore from "@/store/playbackStore";
import { API_BASE_URL, getEnvironmentHeader } from "@/lib/api";
import { getOrCreateGenSessionId } from '@/lib/genSessionId';
import { useRouter } from 'next/navigation';
import StatsForNerds from "./WatchPlayerStats";

export default function Player({ poster, fullData, id, type }) {
    const artRef = useRef();    
    const router = useRouter();
    const isDev = process.env.NODE_ENV === 'development';    const stopPlayback = usePlaybackStore(useCallback(state => state.stopPlayback, []));
    const stopPlaybackSilent = usePlaybackStore(useCallback(state => state.stopPlaybackSilent, []));
    const setActivePlayer = usePlaybackStore(useCallback(state => state.setActivePlayer, []));
    const clearActivePlayer = usePlaybackStore(useCallback(state => state.clearActivePlayer, []));
    const setCleanupCallback = usePlaybackStore(useCallback(state => state.setCleanupCallback, []));
    const status = usePlaybackStore(useCallback(state => state.status, []));
    const src = usePlaybackStore(useCallback(state => state.src, []));
    const [playbackEnded, setPlaybackEnded] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [playerMounted, setPlayerMounted] = useState(false);
    const playerId = useRef(`player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;

    useEffect(() => {
        if (playbackEnded) {
            if (id && type) {
                router.replace(`/info?id=${id}&type=${type}`);
            } else {
                router.replace('/');
            }
        }
    }, [playbackEnded, router, id, type]);

    const handlePlayerError = (error) => {
        usePlaybackStore.setState({ error: error?.message || error?.type || 'Unknown playback error' });
        stopPlayback();
        if (artRef.current?.art?.destroy) {
            artRef.current.art.destroy(false);
        }
    };

    const getUserPreference = (key, fallback) => {
        if (typeof window === 'undefined') return fallback;
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch {
            return fallback;
        }
    };

    const setUserPreference = (key, value) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, value);
        } catch {}
    };

    const adaptSubtitleFormat = () => {
        if (!fullData?.subtitles?.length) return [];
        try {
            const nameCount = {};
            return fullData.subtitles.map((subitem, index) => {
                let name = subitem.name || subitem.html || `Subtitle ${index+1}`;
                if (nameCount[name]) {
                    nameCount[name] += 1;
                    name = `${name} (${nameCount[name]})`;
                } else {
                    nameCount[name] = 1;
                }
                return {
                    ...subitem,
                    name,
                    html: name,
                    default: index === 0
                };
            });
        } catch (error) {
            return [];
        }
    };    
    async function postStatus(intent, data) {
        const sessionId = getOrCreateGenSessionId();
        if (!sessionId) return;
        
        const headers = { 
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId,
            'X-Environment': process.env.NODE_ENV,
        };   

        try {
            const Cookies = (await import('js-cookie')).default;
            const jellyAccessToken = Cookies.get('jellyAccessToken');
            const jellyUserId = Cookies.get('jellyUserId');
            if (jellyAccessToken && jellyUserId) {
                headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
            }        } catch (error) {
            if (isDev) console.warn('Could not access Jelly auth cookies:', error);
        }

        return fetch(`${API_BASE_URL}/status`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                intent, 
                playSessionId: sessionId,
                ...data 
            })
        });
    }    useEffect(() => {
        if (!poster || !src || status !== 'playing') return;
        if (!artRef.current) return;

        if (playerMounted || artRef.current.art) {
            if (isDev) console.warn('Player already mounted, skipping initialization');
            return;
        }

        setActivePlayer(playerId);
        setPlayerMounted(true);
        
        if (isDev) console.log(`Initializing player ${playerId} for ${type} content`);
        
        Artplayer.AUTO_PLAYBACK_TIMEOUT = 15000;
        Artplayer.RECONNECT_SLEEP_TIME  = 3000;
        Artplayer.RECONNECT_TIME_MAX  = 7;
        const subtitles = adaptSubtitleFormat();
        let subtitlePref = getUserPreference('subtitlePref', null);
        let selectedSubtitle = null;
        if (subtitles.length > 0) {
            if (subtitlePref) {
                selectedSubtitle = subtitles.find(s => s.name === subtitlePref || s.html === subtitlePref);
            }
            if (!selectedSubtitle) {
                selectedSubtitle = subtitles.find(s => /english/i.test(s.name)) || subtitles[0];
            }
        }
        let userQualitySelected = false;
        const art = new Artplayer({
            container: artRef.current,
            url: src,
            poster: poster,
            setting: true,
            autoplay: true,
            fullscreen: true,
            mutex: true,
            subtitleOffset: true,
            lang: navigator.language.toLowerCase(),
            backdrop: true,
            autoPlayback: true,
            hotkey: true,
            pip: true,
            airplay: true,
            theme: '#ff0000',
            type: 'm3u8',
            autoMini: true,
            contextmenu: [
                {
                    html: 'Stats for Nerds',
                    click: function () {
                        setShowStats((prev) => !prev);
                    }
                }
            ],
            subtitle: selectedSubtitle ? {
                url: selectedSubtitle.url,
                type: 'vtt',
                escape: false,
                encoding: 'utf-8',
            } : {},            
            settings: [
                ...(subtitles.length > 0 ? [{
                    width: 250,
                    html: 'Subtitle',
                    tooltip: selectedSubtitle?.name,
                    selector: subtitles,
                    onSelect: function (item) {
                        art.subtitle.switch(item.url, {
                            name: item.html,
                        });
                        setUserPreference('subtitlePref', item.name);
                        return item.html;
                    },
                }] : [])
            ],
            plugins: [
                artplayerPluginHlsControl({
                    quality: {
                        control: true,
                        setting: true,
                        getName: (level) => level.height + 'P',
                        title: 'Quality',
                        auto: 'Auto',
                    },
                    audio: {
                        control: true,
                        setting: true,
                        getName: (track) => track.name,
                        title: 'Audio',
                        auto: 'Auto',
                    }
                }),
                artplayerPluginChapter({
                    chapters: fullData?.Chapters || [],
                }),
            ],
            customType: {
                m3u8: function playM3u8(video, url, art) {
                    if (Hls.isSupported()) {
                        if (art.hls) art.hls.destroy();
                        const hls = new Hls({
                            debug: isDev,
                            autoStartLoad: true,
                            lowLatencyMode: true,
                            maxBufferLength: 120,
                            maxMaxBufferLength: 180,                            
                            xhrSetup: xhr => {
                                xhr.setRequestHeader('X-Environment', getEnvironmentHeader());

                                try {
                                    const Cookies = require('js-cookie');
                                    const jellyAccessToken = Cookies.get('jellyAccessToken');
                                    const jellyUserId = Cookies.get('jellyUserId');
                                    if (jellyAccessToken && jellyUserId) {
                                        xhr.setRequestHeader('Authorization', `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`);
                                    }                                } catch (error) {
                                    if (isDev) console.warn('Could not access auth cookies for HLS request:', error);
                                }
                            }
                        });
                          hls.on(Hls.Events.ERROR, function (event, data) {
                            if (isDev) console.error('HLS Error:', event, data);
                            
                            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                                if (data.response && data.response.code === 401) {
                                    alert('Unauthorized accessing fragments.');

                                    router.replace('/');
                                    return;
                                }
                            }
                            
                            if (data.fatal) {
                                handlePlayerError(data);
                            }
                        });
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            if (hls.levels && hls.levels.length > 0 && !userQualitySelected) {
                                const qualityPref = getUserPreference('qualityPref', null);
                                let initialLevel = hls.levels.length - 1; 
                                if (qualityPref) {
                                    const idx = hls.levels.findIndex(l => l.height + 'P' === qualityPref);
                                    if (idx !== -1) initialLevel = idx;
                                }
                                hls.currentLevel = initialLevel;
                                if (art.setting) {
                                    const qualitySetting = art.setting.find(s => s.html === 'Quality');
                                    if (qualitySetting) {
                                        qualitySetting.tooltip = hls.levels[initialLevel].height + 'P';
                                    }
                                }
                            }
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.hls = hls;
                        art.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        alert("Your browser doesn't support HLS playback.");
                        art.notice.show = 'Unsupported playback format: m3u8';
                    }
                }
            },
        });
        function getStatusData() {
            return {
                currentTime: art.currentTime,
                bufferedRange: art.video && art.video.buffered && art.video.buffered.length > 0 ? {
                    start: art.video.buffered.start(0),
                    end: art.video.buffered.end(0)
                } : null,
                seekableRange: art.video && art.video.seekable && art.video.seekable.length > 0 ? {
                    start: art.video.seekable.start(0),
                    end: art.video.seekable.end(0)
                } : null,
                
                currentSubtitleIndex: art.subtitle && art.subtitle.currentIndex,
                currentAudioIndex: art.hls && art.hls.audioTrack,
                mediaSourceId: fullData?.MediaSourceId,
                itemId: fullData?.Id,
                playbackStartTimeTicks: undefined,
                nowPlayingQueue: undefined            
            };
        }
        
        let timeupdateInterval = null;        
        const startStatusInterval = () => {
            if (timeupdateInterval) clearInterval(timeupdateInterval);
            timeupdateInterval = setInterval(() => {
                postStatus('timeupdate', getStatusData());
            }, 3000);
        };
        
        const stopStatusInterval = () => {
            if (timeupdateInterval) {
                clearInterval(timeupdateInterval);
                timeupdateInterval = null;
            }
        };

        art.on('ready', () => {
            if (!art.paused) {
                postStatus('play', getStatusData());
                startStatusInterval();
            }
        });

        art.on('play', () => {
            postStatus('play', getStatusData());
            startStatusInterval();
        });

        art.on('pause', () => {
            postStatus('pause', getStatusData());
            stopStatusInterval();
        });

        art.on('playing', () => {
            postStatus('unpause', getStatusData());
            startStatusInterval();
        });

        art.on('audioChange', (audio) => {
            if (audio && audio.name) {
                setUserPreference('audioPref', audio.name);
                if (art.hls) {
                    art.hls.stopLoad();
                    const currentTime = art.currentTime;
                    art.hls.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY });
                    setTimeout(() => {
                        art.hls.startLoad();
                        art.currentTime = currentTime;
                    }, 100);
                }
            }
        });

        art.on('seeked', () => {
            postStatus('seek', getStatusData());
        });

        const handleEnd = () => {
            try {
                postStatus('stop', getStatusData());
                stopStatusInterval();
                stopPlayback();
                

                if (type === 'Episode' && fullData?.SeriesId) {
                    router.replace(`/info?id=${fullData.SeriesId}&type=Series`);
                } else if (id && type) {
                    router.replace(`/info?id=${id}&type=${type}`);
                } else {
                    router.replace('/');
                }            } catch (error) {
                if (isDev) console.error('Error during playback end:', error);

                if (type === 'Episode' && fullData?.SeriesId) {
                    window.location.href = `/info?id=${fullData.SeriesId}&type=Series`;
                } else if (id && type) {
                    window.location.href = `/info?id=${id}&type=${type}`;
                } else {
                    window.location.href = '/';
                }
            }
        };
        art.on('ended', handleEnd);
        art.video.addEventListener('ended', handleEnd);

        const audioPref = getUserPreference('audioPref', null);
        if (audioPref && art.hls && art.hls.audioTracks) {
            const idx = art.hls.audioTracks.findIndex(track => track.name === audioPref);
            if (idx !== -1) {
                art.hls.audioTrack = idx;
            }
        }
        art.on('error', handlePlayerError);
        if (art.hls && art.hls.levels && art.hls.currentLevel !== undefined) {
            const currentLevel = art.hls.levels[art.hls.currentLevel];
            if (currentLevel && art.setting) {
                const qualitySetting = art.setting.find(s => s.html === 'Quality');
                if (qualitySetting) {
                    qualitySetting.tooltip = currentLevel.height + 'P';
                }
            }
        }
        if (art.hls) {            art.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                if (isDev) console.warn('Level switched:', data);
                userQualitySelected = true;
                const levelIdx = data.level;
                const level = art.hls.levels[levelIdx];
                if (level && art.setting) {
                    const qualitySetting = art.setting.find(s => s.html === 'Quality');
                    if (qualitySetting) {
                        qualitySetting.tooltip = level.height + 'P';
                    }                }
                if (level && level.height) {
                    setUserPreference('qualityPref', level.height + 'P');
                }
            });
        }
        artRef.current.art = art;

        const immediateCleanup = () => {
            if (isDev) console.log(`Immediate HLS cleanup for ${playerId}`);
            

            stopStatusInterval();
            if (isDev) console.log(`Stopped status interval for ${playerId}`);

            if (art && art.hls) {
                try {
                    art.hls.stopLoad();
                    if (typeof art.hls.destroy === 'function') {
                        art.hls.destroy();
                        art.hls = null;
                    }
                } catch (error) {
                    if (isDev) console.warn('Error during immediate HLS cleanup:', error);
                }
            }
        };
        setCleanupCallback(immediateCleanup);
        
        return () => {
            if (isDev) console.log(`WatchPlayer cleanup initiated for ${playerId}`);

            if (art && art.hls && typeof art.hls.destroy === 'function') {
                if (isDev) console.log(`Immediately stopping HLS for ${playerId} to prevent segment fetching`);
                try {
                    art.hls.stopLoad();
                    art.hls.destroy();
                    art.hls = null;
                } catch (error) {
                    if (isDev) console.warn('Error stopping HLS during immediate cleanup:', error);
                }
            }

            stopStatusInterval();
            if (isDev) console.log(`Stopped status interval for ${playerId} during immediate cleanup`);
            

            const isRealCleanup = process.env.NODE_ENV !== 'development' || 
                                  document.visibilityState === 'hidden' ||
                                  window.location.pathname !== '/watch';            if (!isRealCleanup) {
                if (isDev) console.log(`Skipping full cleanup for ${playerId} - likely React strict mode, but HLS already stopped`);
                setPlayerMounted(false);
                return;
            }
            
            clearInterval(timeupdateInterval);            
            setShowStats(false);
            setPlayerMounted(false);

            clearActivePlayer(playerId);
            
            if (art && typeof art.destroy === 'function') {
                if (isDev) console.log(`Destroying player instance ${playerId}`);
                art.off('error', handlePlayerError);
                art.off('ended', handleEnd);
                art.video.removeEventListener('ended', handleEnd);

                try {
                    postStatus('stop', getStatusData()).catch(error => {
                        if (isDev) console.warn('Stop status failed:', error);
                    });
                } catch (error) {
                    if (isDev) console.warn('Unable to send stop status during cleanup:', error);
                }
                
                stopPlaybackSilent();
                art.destroy(false);

                if (artRef.current) {
                    artRef.current.art = null;
                }
            }
            
            if (isDev) console.log(`WatchPlayer cleanup completed for ${playerId}`);
        };
    }, [src, poster, status, stopPlayback, stopPlaybackSilent]);

    const handleCloseStats = () => {
        setShowStats(false);
    };

    if (status !== 'playing') return null;

    return (
        <>
            <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0" />
            <StatsForNerds
                visible={showStats}
                onClose={handleCloseStats}
                art={artRef.current?.art}
            />
        </>
    );
}