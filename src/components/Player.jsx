"use client"

import { useEffect, useRef, useCallback } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import usePlaybackStore from "@/store/playbackStore";

export default function Player({ poster, fullData }) {
    const artRef = useRef();
    const isDev = process.env.NODE_ENV === 'development';

    const stopPlayback = usePlaybackStore(useCallback(state => state.stopPlayback, []));
    const startPlayback = usePlaybackStore(state => state.startPlayback);
    const status = usePlaybackStore(useCallback(state => state.status, []));
    const src = usePlaybackStore(useCallback(state => state.src, []));
    const playSessionId = usePlaybackStore(useCallback(state => state.playSessionId, []));

    const handlePlayerError = (error) => {
        console.error('Artplayer error:', error);
        console.log('Calling stopPlayback on error');
        stopPlayback();
        if (artRef.current?.art?.destroy) {
            artRef.current.art.destroy(false);
        }
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
            console.error("Error adapting subtitle format:", error);
            return [];
        }
    };
    useEffect(() => {
        if (!src) return;
        let sessionId = null;
        try {
            const match = src.match(/[?&]genSessionId=([^&]+)/);
            sessionId = match ? match[1] : null;
            if (sessionId && playSessionId !== sessionId) {
                usePlaybackStore.setState({ playSessionId: sessionId });
                console.warn("Set playSessionId in store:", sessionId);
            }
        } catch (e) {
        }
    }, [src, playSessionId]);

    useEffect(() => {
        if (!poster || !src || status !== 'playing' || !playSessionId) return;
        if (!artRef.current) return;

        Artplayer.AUTO_PLAYBACK_TIMEOUT = 15000;
        Artplayer.RECONNECT_SLEEP_TIME  = 3000;
        Artplayer.RECONNECT_TIME_MAX  = 7;

        const subtitles = adaptSubtitleFormat();
        const selectedSubtitle = subtitles.length > 0 ? subtitles[0] : null;

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
            subtitle: selectedSubtitle ? {
                url: selectedSubtitle.url,
                type: 'vtt',
                escape: false,
                encoding: 'utf-8',
            } : undefined,
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
            if (art && typeof art.destroy === 'function') {
                art.off('error', handlePlayerError);
                console.log('Calling stopPlayback on unmount');
                stopPlayback();
                art.destroy(false);
                console.warn("Unmounting Artplayer instance");
            }
        };
    }, [src, poster, status, stopPlayback, playSessionId]);

    if (status !== 'playing') return null;

    return <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0" />;
}