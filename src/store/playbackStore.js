import { updateState } from '@/lib/api';
import { create } from 'zustand';

const usePlaybackStore = create((set, get) => ({
    playSessionId: null,
    deviceId: null,
    id: null,
    type: null,
    urlKey: null,
    src: null,
    status: 'idle',
    
    storeContentId: (id, type, urlKey) => {
        if(id && type) {
            set({
                id: id,
                type: type,
                urlKey: urlKey
            });

            const fetchStreamUrl = async () => {
                try {
                    const response = await fetch(urlKey);
                    const data = await response.json();
                    get().setKey(data.playSessionId, data.deviceId, data.playbackUrl);
                } catch (error) {
                    console.error('Error fetching stream URL:', error);
                    return;
                }
            };
    
            fetchStreamUrl();
        } else {
            alert('Unable to start playback. Please refresh your page');
            console.error('Unable to start playback. Missing parameters:', { id, type });
        }
    },
    setKey: (playSessionId, deviceId, src) => {
        if(playSessionId && deviceId && src) {
            set({
                playSessionId,
                deviceId,
                status: 'playing',
                src,
            });
        } else {
            alert('Unable to start playback. Please refresh your page');
            console.error('Unable to start playback. Missing parameters:', { playSessionId, deviceId, id, type });
        }
       
    },

    stopPlayback: async () => {
        const { deviceId, playSessionId } = get();
        if (deviceId && playSessionId) {
            try {
                // await fetch(`/api/status?deviceId=${deviceId}&playSessionId=${playSessionId}`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                // });
                updateState(deviceId, playSessionId)
            } catch (error) {
                console.error('Failed to update playback status:', error);
                alert('Failed to stop playback. Please try again.');
            }
        }
        set({ status: 'stopped' });
    },
}));

export default usePlaybackStore;