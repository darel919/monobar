"use client"

import { useEffect, useRef, useCallback } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import usePlaybackStore from "@/store/playbackStore";

export default function Player({ poster }) {
    const artRef = useRef();
    const isDev = process.env.NODE_ENV === 'development';

    // Memoize selectors to prevent infinite loops
    const stopPlayback = usePlaybackStore(useCallback(state => state.stopPlayback, []));
    const status = usePlaybackStore(useCallback(state => state.status, []));
    const src = usePlaybackStore(useCallback(state => state.src, []));

    const handlePlayerError = (error) => {
        console.error('Artplayer error:', error);
        stopPlayback();
        if (artRef.current?.art?.destroy) {
            artRef.current.art.destroy(false);
        }
    };

    useEffect(() => {
        if (!poster || !src || status !== 'playing') return;

        Artplayer.AUTO_PLAYBACK_TIMEOUT = 15000;
        Artplayer.RECONNECT_SLEEP_TIME  = 3000;
        Artplayer.RECONNECT_TIME_MAX  = 7;
        if(isDev) {
            Artplayer.DEBUG = true;
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
            ],
            customType: {
                m3u8: function playM3u8(video, url, art) {
                    if (Hls.isSupported()) {
                        if (art.hls) art.hls.destroy();
                        const hls = new Hls({
                            debug: isDev,
                            autoStartLoad: true,
                            xhrSetup: xhr => {
                                xhr.setRequestHeader('X-Environment', process.env.NODE_ENV);
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

        art.on('error', handlePlayerError);
        artRef.current.art = art;

        return () => {
            if (art && art.destroy) {
                art.off('error', handlePlayerError);
                stopPlayback();
                art.destroy(false);
                console.warn("Unmounting Artplayer instance");
            }
        };
    }, [src, poster, status, stopPlayback]);

    if (status !== 'playing') return null;

    return <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0" />;
}