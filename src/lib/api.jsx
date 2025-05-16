const EXT_API_BASE_URL = process.env.NEXT_PUBLIC_EXT_API_BASE_URL;
const API_BASE_URL = (() => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === "monobar.server.drl") {
            const localUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            // console.log('Using local API base URL:', localUrl);
            return localUrl;
        }
    }
    return EXT_API_BASE_URL;
})();

const getEnvironmentHeader = () => {
    if (process.env.NODE_ENV === 'development') return 'development';
    if (typeof window !== 'undefined' && window.location.hostname === "monobar.server.drl") {
        return 'production_local';
    }
    return 'production';
};

export { API_BASE_URL, getEnvironmentHeader};

export async function serverFetch(endpoint, options = {}, providerId) {
    const url = `${API_BASE_URL}${endpoint}`;
    // console.log('Making request to:', url);
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'dp-Monobar',
        'X-Environment': getEnvironmentHeader(),
        'Origin': typeof window !== 'undefined' ? window.location.origin : '',
        ...options.headers,
    };

    if (typeof window !== 'undefined') {
        const genSessionId = localStorage.getItem('genSessionId');
        if (genSessionId) {
            headers['X-Session-ID'] = genSessionId;
        }
    }

    const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers,
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getHome() {
    return serverFetch(`/`);
}

export async function getMovieData(id, intent, providerId) {
    try {
        const res = await fetch(`${API_BASE_URL}/watch?intent=${intent}&id=${id}`, { 
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            if (res.status === 404) {
                throw new Error("Video not found. It may have been removed, unavailable, or you might have an invalid link.");
            }
            throw new Error(`Failed to fetch video data (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the video server. Please check your internet connection or try again later.");
        }
        throw error;
    }
}

export async function getTypeData(options = {}, providerId) {
    const params = new URLSearchParams();
    if (options.id) params.append('id', options.id);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    try {
        const res = await fetch(`${API_BASE_URL}/library?${query}`, { 
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            if (res.status === 404) {
                throw new Error("Video not found. It may have been removed, unavailable, or you might have an invalid link.");
            }
            throw new Error(`Failed to fetch video data (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the video server. Please check your internet connection or try again later.");
        }
        throw error;
    }
}

export async function updateState(genSessionId) {
    if (!genSessionId) {
        console.warn("No session ID provided for updateState");
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/status?playSessionId=${genSessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getEnvironmentHeader(),
                'X-Session-ID': genSessionId,
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to update playback status (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        console.error("Error updating playback status:", error);
        throw error;
    }
}

export async function searchMedia(query) {
    try {
        const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch search results (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection.");
        }
        throw error;
    }
}

