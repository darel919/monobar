import { updateState } from '@/lib/api';
import { create } from 'zustand';

const usePlaybackStore = create((set, get) => ({
    src: null,
    status: 'idle',
    error: null,
    
    initializePlayback: async (id, type) => {
        if(id && type) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH_URL || ''}/api/watch?intent=watch&id=${id}`, {
                    method: 'GET',
                    headers: {
                        "X-Environment": process.env.NODE_ENV,
                        'Origin': typeof window !== 'undefined' ? window.location.origin : ''
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to start playback: ${response.statusText}`);
                }

                const data = await response.json();
                if (!data.playbackUrl) {
                    throw new Error('Invalid playback response from server');
                }

                set({
                    src: data.playbackUrl,
                    status: 'playing',
                    error: null
                });
            } catch (error) {
                set({ 
                    status: 'error', 
                    error: error.message || 'Failed to initialize playback'
                });
            }
        } else {
            set({ 
                status: 'error', 
                error: 'Missing required playback parameters' 
            });
        }
    },    stopPlayback: async () => {
        console.warn("Stopping playback...");
        try {
            await updateState();
        } catch (error) {
            console.error('Unable to report stopped playback status!\n', error);
        } finally {
            set({ 
                status: 'stopped',
                src: null,
                error: null
            });
        }
    },
}));

export default usePlaybackStore;