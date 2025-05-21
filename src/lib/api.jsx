const EXT_API_BASE_URL = process.env.NEXT_PUBLIC_EXT_API_BASE_URL;
const API_BASE_URL = (() => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === "monobar.server.drl" || hostname === "localhost") {
            const localUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
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

export async function search(query, options = {}) {
    let url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    if (options.includeExternal) {
        url += `&includeRequest=true`;
    }
    try {
        const res = await fetch(url, {
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

export async function getRequests() {
    try {
        const res = await fetch(`${API_BASE_URL}/request`, {
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch requests (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection.");
        }
        throw error;
    }
}

// Fetch media in waiting list for /request page
export async function getWaitingList() {
    try {
        const res = await fetch(`${API_BASE_URL}/request/waitingList`, {
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch waiting list (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection.");
        }
        throw error;
    }
}

export async function createRequest(mediaId, mediaType) {
    try {
        const res = await fetch(`${API_BASE_URL}/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            },
            body: JSON.stringify({ mediaId, mediaType })
        });
        if (res.status !== 201) {
            throw new Error(`Failed to create request (HTTP ${res.status})`);
        }
        return true;
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection.");
        }
        throw error;
    }
}

export async function deleteRequest(mediaId) {
    try {
        const res = await fetch(`${API_BASE_URL}/request?id=${mediaId}`, {
            method: 'DELETE',
            headers: {
                "X-Environment": getEnvironmentHeader(),
                'User-Agent': 'dp-Monobar',
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });
        if (res.status !== 202) {
            throw new Error(`Failed to cancel request (HTTP ${res.status})`);
        }
        return true;
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection.");
        }
        throw error;
    }
}
