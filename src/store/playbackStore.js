import { updateState } from '@/lib/api';
import { create } from 'zustand';

const usePlaybackStore = create((set, get) => ({
    id: null,
    type: null,
    src: null,
    status: 'idle',
    error: null,
    
    initializePlayback: (id, type, src) => {
        if(id && type && src) {
            set({
                id,
                type,
                src,
                status: 'playing',
                error: null
            });
        } else {
            set({ 
                status: 'error', 
                error: 'Missing required playback parameters' 
            });
        }
    },

    stopPlayback: async () => {
        console.warn("Stopping playback...");
        try {
            await updateState();
        } catch (error) {
            console.error('Unable to report stopped playback status!\n', error);
        } finally {
            set({ 
                status: 'stopped',
                id: null,
                type: null,
                src: null,
                error: null
            });
        }
    },
}));

export default usePlaybackStore;