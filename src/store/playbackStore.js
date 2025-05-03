import { updateState } from '@/lib/api';
import { create } from 'zustand';

const usePlaybackStore = create((set, get) => ({
    playSessionId: null,
    deviceId: null,
    id: null,
    type: null,
    src: null,
    status: 'idle',
    error: null,
    
    initializePlayback: (id, type, playSessionId, deviceId, src) => {
        if(id && type && playSessionId && deviceId && src) {
            set({
                id,
                type,
                playSessionId,
                deviceId,
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
        const { deviceId, playSessionId } = get();
        if (deviceId && playSessionId) {
            try {
                updateState(deviceId, playSessionId)
            } catch (error) {
                console.error('Failed to update playback status:', error);
            }
        }
        set({ 
            status: 'stopped',
            playSessionId: null,
            deviceId: null,
            id: null,
            type: null,
            src: null,
            error: null
        });
    },
}));

export default usePlaybackStore;