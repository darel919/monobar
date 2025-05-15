"use client"

import { useEffect, useRef, useCallback, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginChapter from 'artplayer-plugin-chapter';
import usePlaybackStore from "@/store/playbackStore";
import { LOCAL_API_BASE_URL } from "@/lib/api";
import { getOrCreateGenSessionId } from '@/lib/genSessionId';
import { useRouter } from 'next/navigation';

export default function Player({ poster, fullData }) {
    const artRef = useRef();
    const router = useRouter();
    const isDev = process.env.NODE_ENV === 'development';
    const stopPlayback = usePlaybackStore(useCallback(state => state.stopPlayback, []));
    const status = usePlaybackStore(useCallback(state => state.status, []));
    const src = usePlaybackStore(useCallback(state => state.src, []));
    const id = usePlaybackStore(useCallback(state => state.id, []));
    const type = usePlaybackStore(useCallback(state => state.type, []));
    const [playbackEnded, setPlaybackEnded] = useState(false);

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

    function postStatus(intent, data) {
        const sessionId = getOrCreateGenSessionId();
        if (!sessionId) return;
        return fetch(`${LOCAL_API_BASE_URL}/status`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId,
                'X-Environment': process.env.NODE_ENV,
            },
            body: JSON.stringify({ 
                intent, 
                playSessionId: sessionId,
                ...data 
            })
        });
    }

    useEffect(() => {
        if (!poster || !src || status !== 'playing') return;
        if (!artRef.current) return;
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
            subtitle: selectedSubtitle ? {
                url: selectedSubtitle.url,
                type: 'vtt',
                escape: false,
                encoding: 'utf-8',
            } : {},
            settings: subtitles.length > 0 ? [
                {
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
                },
            ] : [],
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
                            maxBufferLength: 60,
                            maxMaxBufferLength: 120,
                            xhrSetup: xhr => {
                                xhr.setRequestHeader('X-Environment', process.env.NODE_ENV);
                            }
                        });
                        hls.on(Hls.Events.ERROR, function (event, data) {
                            if (data.fatal) {
                                handlePlayerError(data);
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
        };        const stopStatusInterval = () => {
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
        });        const handleEnd = () => {
            try {
                postStatus('stop', getStatusData());
                stopStatusInterval();
                stopPlayback();
                if (id && type) {
                    window.location.href = `/info?id=${id}&type=${type}`;
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error during playback end:', error);
                window.location.href = id && type ? `/info?id=${id}&type=${type}` : '/';
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
        artRef.current.art = art;        return () => {
            clearInterval(timeupdateInterval);
            if (art && typeof art.destroy === 'function') {
                art.off('error', handlePlayerError);
                art.off('ended', handleEnd);
                art.video.removeEventListener('ended', handleEnd);
                postStatus('stop', getStatusData());
                stopPlayback();
                art.destroy(false);
            }
        };
    }, [src, poster, status, stopPlayback]);

    if (status !== 'playing') return null;

    return <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0" />;
}