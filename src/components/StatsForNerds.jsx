import React, { useEffect, useRef, useState } from 'react';

export default function StatsForNerds({ visible, onClose, art }) {
    const [stats, setStats] = useState({
        resolution: '',
        currentTime: '',
        duration: '',
        bufferHealth: '',
        quality: '',
        audioCodec: '',
        audioChannel: '',
        videoCodec: '',
        bitrate: '',
        streamUrl: '',
        bandwidth: ''
    });
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!visible || !art) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setStats({ resolution: '', currentTime: '', duration: '', bufferHealth: '', quality: '', audioCodec: '', audioChannel: '', videoCodec: '', bitrate: '', streamUrl: '' });
            return;
        }
        function updateStats() {
            if (!art.video) return;
            let bufferHealth = 0;
            const video = art.video;
            if (video.buffered && video.buffered.length > 0) {
                bufferHealth = Math.max(0, video.buffered.end(video.buffered.length - 1) - video.currentTime);
            }

            let audioCodec = '', videoCodec = '', audioChannel = '', bitrate = '', streamUrl = '';
            if (art.hls && art.hls.levels && art.hls.currentLevel !== undefined) {
                const level = art.hls.levels[art.hls.currentLevel];
                if (level) {
                    // console.log(art.hls)
                    if (level.codecs) {
                        const codecs = level.codecs.split(',');
                        codecs.forEach(c => {
                            if (c.startsWith('avc1') || c.startsWith('hev1') || c.startsWith('vp9') || c.startsWith('av01')) {
                                videoCodec = c;
                            } else if (c.startsWith('mp4a') || c.startsWith('ac-3') || c.startsWith('ec-3') || c.startsWith('opus')) {
                                audioCodec = c;
                            }
                        });

                        if (!videoCodec && !audioCodec) {
                            videoCodec = level.codecs;
                        }
                    }

                    if (!videoCodec && level.videoCodec) videoCodec = level.videoCodec;
                    if (!audioCodec && level.audioCodec) audioCodec = level.audioCodec;
                    if (level.audioChannels) {
                        audioChannel = `${level.audioChannels}ch`;
                    }
                    bitrate = level.bitrate ? `${(level.bitrate / 1000).toFixed(0)} kbps` : '';
                    if (level.url && level.url.length > 0) {
                        streamUrl = level.url[0];
                    }
                }
            }
            if ((!videoCodec || !audioCodec) && art.hls && art.hls.media) {
                if (art.hls.media.codecs) {
                    const codecs = art.hls.media.codecs.split(',');
                    codecs.forEach(c => {
                        if (!videoCodec && (c.startsWith('avc1') || c.startsWith('hev1') || c.startsWith('vp9') || c.startsWith('av01'))) {
                            videoCodec = c;
                        } else if (!audioCodec && (c.startsWith('mp4a') || c.startsWith('ac-3') || c.startsWith('ec-3') || c.startsWith('opus'))) {
                            audioCodec = c;
                        }
                    });
                }
            }

            if (!audioCodec && video.audioTracks && video.audioTracks.length > 0) {
                audioCodec = video.audioTracks[0].label || '';
                if (video.audioTracks[0].channels) {
                    audioChannel = `${video.audioTracks[0].channels}ch`;
                }
            }
            if (!videoCodec && video.videoTracks && video.videoTracks.length > 0) {
                videoCodec = video.videoTracks[0].label || '';
            }

            if ((videoCodec === '' || videoCodec === 'N/A') && (audioCodec === '' || audioCodec === 'N/A') && streamUrl) {
                try {
                    const urlObj = new URL(streamUrl, window.location.origin);
                    const params = urlObj.searchParams;
                    const videoCodecHint = params.get('VideoCodec');
                    const audioCodecHint = params.get('AudioCodec');
                    const audioChannelsHint = params.get('h264-audiochannels') || params.get('AudioChannels');
                    if (videoCodecHint) videoCodec = videoCodecHint + ' (hint)';
                    if (audioCodecHint) audioCodec = audioCodecHint + ' (hint)';
                    if (audioChannelsHint) audioChannel = audioChannelsHint + 'ch (hint)';
                } catch (e) {
                    
                }
            }

            // Format bandwidth estimate for display
            let bandwidth = '';
            if (art && art.hls && art.hls.bandwidthEstimate) {
                const bw = art.hls.bandwidthEstimate;
                if (bw >= 1000000) {
                    bandwidth = (bw / 1000000).toFixed(2) + ' Mbps';
                } else if (bw >= 1000) {
                    bandwidth = (bw / 1000).toFixed(0) + ' kbps';
                } else {
                    bandwidth = bw + ' bps';
                }
            }

            setStats({
                bandwidth,
                resolution: `${video.videoWidth}x${video.videoHeight}`,
                currentTime: `${video.currentTime.toFixed(2)}s`,
                duration: `${video.duration.toFixed(2)}s`,
                bufferHealth: `${bufferHealth.toFixed(2)}s`,
                quality: art.hls && art.hls.levels && art.hls.currentLevel !== undefined ? `${art.hls.levels[art.hls.currentLevel]?.height}P` : '',
                audioCodec: audioCodec || 'N/A',
                audioChannel: audioChannel || 'N/A',
                videoCodec: videoCodec || 'N/A',
                bitrate,
                streamUrl
            });
        }
        updateStats();
        intervalRef.current = setInterval(updateStats, 500);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [visible, art]);

    if (!visible) return null;
    return (
        <section style={{
            position: 'fixed',
            top: 72,
            left: 20,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: 8,
            minWidth: 320,
            maxWidth: '90vw',
            fontSize: 13,
            lineHeight: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            fontFamily: 'monospace',
        }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h1 className="font-bold text-2xl">Stats for Nerds</h1>
                <button
                    style={{cursor:'pointer',padding:'4px 8px',margin:'-4px -8px 0 0',fontSize:20,background:'none',border:'none',color:'white'}}
                    onClick={onClose}
                    aria-label="Close stats"
                >
                    &times;
                </button>
            </div>
            <p><b>Current Time:</b> {stats.currentTime}</p>
            <p><b>Duration:</b> {stats.duration}</p>
            {stats.quality && <p><b>Quality:</b> {stats.quality}</p>}
            <p><b>Video Codec:</b> {stats.videoCodec}</p>
            <p><b>Audio Codec:</b> {stats.audioCodec}</p>
            <p><b>Audio Channel:</b> {stats.audioChannel}</p>
            {stats.bitrate && <p><b>Bitrate:</b> {stats.bitrate}</p>}
            {stats.bandwidth && <p><b>Connection speed:</b> {stats.bandwidth}</p>}
            {/* {stats.streamUrl && <p style={{wordBreak:'break-all'}}><b>Stream URL:</b> {stats.streamUrl}</p>} */}
            {(stats.videoCodec === 'N/A' && stats.audioCodec === 'N/A') && (
                <p style={{color:'#ffb300',marginTop:8}}><b>Codec info not available from stream or browser.</b></p>
            )}
            <div style={{margin: '12px 0'}}>
                <b>Buffer Health:</b>
                {(() => {
                    const bufferSec = parseFloat(stats.bufferHealth);
                    const percent = Math.min(100, Math.max(0, (bufferSec / 120) * 100));
                    let barClass = 'progress-primary';
                    let textClass = '';
                    if (bufferSec > 30) {
                        barClass = 'progress-success';
                        textClass = '';
                    } else if (bufferSec < 10) {
                        barClass = 'bg-error';
                        textClass = 'text-error';
                    } else if (bufferSec <= 30) {
                        barClass = 'bg-warning';
                        textClass = 'text-warning';
                    }
                    return (
                        <>
                            <progress
                                className={`progress w-full ${barClass}`}
                                value={percent}
                                max={100}
                                style={{height: 12, marginTop: 4, marginBottom: 2, borderRadius: 6}}
                                aria-valuenow={percent}
                                aria-valuemax={100}
                                aria-label="Buffer Health"
                            />
                            <span
                                className={textClass}
                                style={{fontWeight: 'bold', fontVariantNumeric: 'tabular-nums'}}
                            >
                                {stats.bufferHealth}
                            </span>
                        </>
                    );
                })()}
            </div>

        </section>
    );
}
