import { API_BASE_URL, updateState } from '@/lib/api';
import { getOrCreateGenSessionId } from '@/lib/genSessionId';
import { create } from 'zustand';

const usePlaybackStore = create((set, get) => ({    src: null,
    status: 'idle',
    error: null,
    cleanupCallback: null,
    activePlayerId: null,
    currentContentId: null,
    
    setCleanupCallback: (callback) => {
        set({ cleanupCallback: callback });
    },

    setActivePlayer: (playerId) => {
        const { activePlayerId } = get();        
        if (activePlayerId && activePlayerId !== playerId) {
            if (process.env.NODE_ENV === 'development') 
                console.warn(`Stopping previous player ${activePlayerId} to start new player ${playerId}`);

                const { cleanupCallback } = get();
                if (cleanupCallback) {
                    cleanupCallback();
                }
            }
        set({ activePlayerId: playerId });
    },

    clearActivePlayer: (playerId) => {
        const { activePlayerId } = get();
        if (activePlayerId === playerId) {
            set({ activePlayerId: null });
        }
    },      initializePlayback: async (id, type) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`PlaybackStore: Initializing playback for ${type} ${id}`);
        }
        if(id && type) {
            try {                
                const currentState = get();
                

                const shouldInitialize = !currentState.src || 
                                       currentState.status !== 'playing' ||
                                       currentState.currentContentId !== id;
                
                if (!shouldInitialize) {
                    if (process.env.NODE_ENV === 'development') console.log('PlaybackStore: Same content already playing, skipping re-initialization');
                    return;
                }                const { cleanupCallback, activePlayerId } = get();
                if (cleanupCallback) {
                    if (process.env.NODE_ENV === 'development') console.log('PlaybackStore: Cleaning up existing playback before initializing new one');
                    await cleanupCallback();
                    set({ cleanupCallback: null, src: null, status: 'idle' });
                }
                if (activePlayerId) {
                    if (process.env.NODE_ENV === 'development') console.log(`PlaybackStore: Clearing previous active player ${activePlayerId} before initializing new one`);
                    set({ activePlayerId: null });
                }

                const headers = {
                    "X-Environment": process.env.NODE_ENV,
                    "X-Session-ID": getOrCreateGenSessionId(),
                    'Origin': typeof window !== 'undefined' ? window.location.origin : ''
                };

                try {
                    const Cookies = (await import('js-cookie')).default;
                    const jellyAccessToken = Cookies.get('jellyAccessToken');
                    const jellyUserId = Cookies.get('jellyUserId');                    if (jellyAccessToken && jellyUserId) {
                        headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
                        if (process.env.NODE_ENV === 'development') console.log('PlaybackStore: Added authorization headers');
                    }
                } catch (error) {
                    if (process.env.NODE_ENV === 'development') console.warn('PlaybackStore: Could not access auth cookies:', error);
                }

                const playbackUrl = `${API_BASE_URL}/watch?intent=play&id=${id}`;
                if (process.env.NODE_ENV === 'development') console.log(`PlaybackStore: Making playback request to ${playbackUrl}`);

                const response = await fetch(playbackUrl, {
                    method: 'GET',
                    headers
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to start playback: ${response.statusText}`);
                }

                const data = await response.json();
                if (!data.playbackUrl) {
                    throw new Error('Invalid playback response from server');
                }                if (process.env.NODE_ENV === 'development') console.log('PlaybackStore: Playback initialized successfully');
                set({
                    src: data.playbackUrl,
                    status: 'playing',
                    error: null,
                    currentContentId: id
                });
            } catch (error) {
                if (process.env.NODE_ENV === 'development') console.error('PlaybackStore: Failed to initialize playback:', error);
                set({ 
                    status: 'error', 
                    error: error.message || 'Failed to initialize playback'
                });
            }
        } else {
            if (process.env.NODE_ENV === 'development') console.error('PlaybackStore: Missing required playback parameters');
            set({ 
                status: 'error', 
                error: 'Missing required playback parameters' 
            });
        }
        
    },    
    stopPlayback: async () => {
        if (process.env.NODE_ENV === 'development') {
            console.warn("Stopping playback immediately...");
        }
        try {
            const { cleanupCallback, activePlayerId } = get();

            if (cleanupCallback) {
                if (process.env.NODE_ENV === 'development') console.log("Executing immediate cleanup to stop HLS segment fetching");
                await cleanupCallback();
                set({ cleanupCallback: null });
            }

            if (activePlayerId) {
                if (process.env.NODE_ENV === 'development') console.log(`Clearing active player ${activePlayerId}`);
                set({ activePlayerId: null });
            }

            const sessionId = getOrCreateGenSessionId();
            if (sessionId) {
                await updateState(sessionId);
            }        
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                 console.error('Unable to report stopped playback status!\n', error);
            }        } finally {
            set({ 
                status: 'stopped',
                src: null,
                error: null,
                cleanupCallback: null,
                activePlayerId: null,
                currentContentId: null
            });
        }
    },
    
    stopPlaybackSilent: () => {
        const { cleanupCallback, activePlayerId } = get();
        if (cleanupCallback) {
            cleanupCallback();
        }        if (activePlayerId) {
            if (process.env.NODE_ENV === 'development') console.log(`Silently clearing active player ${activePlayerId}`);
        }        set({ 
            status: 'stopped',
            src: null,
            error: null,
            cleanupCallback: null,
            activePlayerId: null,
            currentContentId: null
        });
    },
}));

export default usePlaybackStore;