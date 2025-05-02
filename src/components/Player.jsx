"use client"

import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";

export default function Player({ src, poster }) {
    const artRef = useRef();
    useEffect(() => {
        const art = new Artplayer({
            container: artRef.current,
            url : src,
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
            // subtitle: {
            //     url: selectedSubtitle.value ? selectedSubtitle.value.url : null,
            //     type: 'vtt',
            //     escape: false,
            //     encoding: 'utf-8',
            // },
            // settings: [
            //     {
            //         width: 250,
            //         html: 'Subtitle',
            //         tooltip: selectedSubtitle.value.name,
            //         selector: availableSubtitles.value,
            //         onSelect: function (item) {
            //             art.subtitle.switch(item.url, {
            //                 name: item.html,
            //             });
            //             selectedSubtitle.value = {
            //                 name: item.name,
            //                 html: item.html,
            //                 url: item.url,
            //                 format: 'vtt'
            //             }
            //             return item.html;
            //         },
            //     },
            // ],
            plugins: [
                artplayerPluginHlsControl({
                    quality: {
                        // Show qualitys in control
                        control: true,
                        // Show qualitys in setting
                        setting: true,
                        // Get the quality name from level
                        getName: (level) => level.height + 'P',
                        // I18n
                        title: 'Quality',
                        auto: 'Auto',
                    },
                    audio: {
                        // Show audios in control
                        control: true,
                        // Show audios in setting
                        setting: true,
                        // Get the audio name from track
                        getName: (track) => track.name,
                        // I18n
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
                        alert("Your browser doesn't support HLS playback.")
                        // navigateTo('/')
                        art.notice.show = 'Unsupported playback format: m3u8';
                    }
                }
            },
        });

        return () => {
            if (art && art.destroy) {
                art.destroy(false);
            }
        };
    }, [src, poster]);
    return <div ref={artRef} className="absolute w-full h-full left-0 right-0 top-0 bottom-0"/> 
}