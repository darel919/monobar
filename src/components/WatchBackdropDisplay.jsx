"use client"

import { useState, useEffect, useRef } from "react";

export default function WatchBackdropDisplay({ backdrop, src, className, playTrailer = false }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const videoId = src?.replace("https://www.youtube.com/watch?v=", "") || '';
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {};
    
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInViewport(entry.isIntersecting);
        
        if (playerRef.current && playerRef.current.getPlayerState) {
          if (entry.isIntersecting) {
            if (!videoEnded) {
              playerRef.current.playVideo();
            }
          } else {
            playerRef.current.pauseVideo();
          }
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [videoEnded]);
  
  useEffect(() => {
    if (!videoId || videoEnded || !isInViewport || !playTrailer) return;
    
    const checkYTApiAndCreatePlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        if (playerRef.current) return;
        
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: () => {
              setTimeout(() => setVideoLoaded(true), 500);
            },
            onStateChange: (event) => {
              if (event.data === 0) {
                setVideoEnded(true);
                setVideoLoaded(false);
              }
            }
          }
        });
      } else {
        setTimeout(checkYTApiAndCreatePlayer, 100);
      }
    };
    
    checkYTApiAndCreatePlayer();
    
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, videoEnded, isInViewport, playTrailer]);
  
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 w-full h-full ${className}`} 
      style={{ position: 'absolute', width: '100%', height: '100%' }}
    >
      <img
        src={backdrop}
        loading="eager"
        alt="Backdrop"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${!videoLoaded || videoEnded || !isInViewport || !playTrailer ? 'opacity-100' : 'opacity-0'}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      {videoId && !videoEnded && isInViewport && playTrailer && (
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: '100%', height: '100%' }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black" 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}