"use client"

import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import usePlaybackStore from "@/store/playbackStore";

export default function Player({ poster }) {
    const artRef = useRef();
    const stopPlayback = usePlaybackStore(state => state.stopPlayback);
    const src = usePlaybackStore(state => state.src);
    
    useEffect(() => {
        if (!poster) return;
        if (!src) return;

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
                        const hls = new Hls();
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

        return () => {
            if (art && art.destroy) {
                stopPlayback();
                art.destroy(false);
                console.warn("Unmounting Artplayer instance");
            }
        };
    }, [src, poster]);

    return <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0" />;
}