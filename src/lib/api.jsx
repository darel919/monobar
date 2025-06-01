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

const getCookieValue = async (name) => {
    if (typeof window !== 'undefined') {

        try {
            const Cookies = (await import('js-cookie')).default;
            const value = Cookies.get(name);

            return value;
        } catch (error) {
            console.warn('Error accessing client-side cookies:', error);
            return null;
        }
    } else {

        try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const cookieObject = cookieStore.get(name);
            const value = cookieObject?.value;

            return value;
        } catch (error) {
            console.warn('Could not access cookies on server side:', error);
            return null;
        }
    }
};

export { API_BASE_URL, getEnvironmentHeader, getCookieValue };

async function handleAuthRetry(response, retryCallback, retryCount = 0) {
    if (response.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
        try {
            const { useAuthStore } = await import('@/lib/authStore');
            const authStore = useAuthStore.getState();
            
            if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                console.log('401 detected, attempting to refresh Jellyfin authentication...');
                await authStore.retryJellyAuth();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return retryCallback();
            }
        } catch (retryError) {
            console.error('Failed to retry Jellyfin authentication:', retryError);
        }
    }
    return null;
}

export async function getJellyId(providerId) {
    if (!providerId) {
        throw new Error('Provider ID is required for Jelly authentication');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/getJellyId`, {
            method: 'GET',
            headers: {
                'Authorization': providerId,
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getEnvironmentHeader(),
                'Origin': typeof window !== 'undefined' ? window.location.origin : ''
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Failed to fetch Jelly ID (HTTP ${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from Jelly ID endpoint');
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to Jelly authentication server. Please check your internet connection.');
        }
        throw error;
    }
}

export async function serverFetch(endpoint, options = {}, providerId, retryCount = 0) {
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
    }    if (!endpoint.startsWith('/request')) {
        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');

        if (jellyAccessToken && jellyUserId) {
            const authHeader = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
            headers['Authorization'] = authHeader;
        }
    }

    const fetchOptions = {
        ...options,
        cache: 'no-store',
        headers,
    };

    const response = await fetch(url, fetchOptions);    if (response.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
        try {
            const { useAuthStore } = await import('@/lib/authStore');
            const authStore = useAuthStore.getState();
            
            const providerId = authStore.userSession?.user?.user_metadata?.provider_id || 
                              authStore.userSession?.user?.user?.user_metadata?.provider_id ||
                              authStore.userSession?.user?.id;
            
            if (authStore.isAuthenticated && providerId) {
                console.log('401 detected, attempting to refresh Jellyfin authentication...');
                await authStore.retryJellyAuth();
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return serverFetch(endpoint, options, providerId, retryCount + 1);
            } else {
                console.log('401 detected, clearing authentication cookies to trigger reauthentication flow...');
                await authStore.clearAuth();
            }
        } catch (retryError) {
            console.error('Failed to retry Jellyfin authentication:', retryError);
            const { useAuthStore } = await import('@/lib/authStore');
            const authStore = useAuthStore.getState();
            console.log('401 error - clearing authentication cookies...');
            await authStore.clearAuth();
        }
    } 
    if (!response.ok) {
        if (response.status === 401 && retryCount > 0 && typeof window !== 'undefined') {
            console.log('401 detected after retry, clearing authentication cookies...');
            const { useAuthStore } = await import('@/lib/authStore');
            const authStore = useAuthStore.getState();
            await authStore.clearAuth();
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getHome() {

    if (typeof window !== 'undefined') {
        const authStore = await import('@/lib/authStore').then(m => m.useAuthStore);
        const state = authStore.getState();
        
        if (state.isAuthenticated && state.isJellyLoading) {

            let attempts = 0;
            while (state.isJellyLoading && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
    }
    
    return serverFetch(`/`);
}

export async function getMovieData(id, intent, providerId, retryCount = 0) {
    try {
        const headers = {
            "X-Environment": getEnvironmentHeader(),
            'User-Agent': 'dp-Monobar',
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''
        };

        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/watch?intent=${intent}&id=${id}`, { 
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in getMovieData, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return getMovieData(id, intent, providerId, retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in getMovieData:', retryError);
            }
        }

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

export async function getTypeData(options = {}, providerId, retryCount = 0) {
    const params = new URLSearchParams();
    if (options.id) params.append('id', options.id);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();    
    try {        
        const headers = {
            "X-Environment": getEnvironmentHeader(),
            'User-Agent': 'dp-Monobar',
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''        
        };

        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/library?${query}`, {
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in getTypeData, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return getTypeData(options, providerId, retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in getTypeData:', retryError);
            }
        }

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

export async function getAllGenres(retryCount = 0) {
    try {
        const headers = {
            "X-Environment": getEnvironmentHeader(),
            'User-Agent': 'dp-Monobar',
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''
        };

        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/library/genres`, {
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in getAllGenres, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return getAllGenres(retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in getAllGenres:', retryError);
            }
        }

        if (!res.ok) {
            console.log(res)
            throw new Error(`Failed to fetch genres (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection or try again later.");
        }
        throw error;
    }
}

export async function getGenreData(options = {}, retryCount = 0) {
    const params = new URLSearchParams();
    if (options.genreId) params.append('id', options.genreId);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();

    try {
        const headers = {
            "X-Environment": getEnvironmentHeader(),
            'User-Agent': 'dp-Monobar',
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''
        };

        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/library/genre?${query}`, {
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in getGenreData, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return getGenreData(options, retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in getGenreData:', retryError);
            }
        }

        if (!res.ok) {
            if (res.status === 404) {
                console.log(res)
                throw new Error("Genre not found. It may have been removed or you might have an invalid link.");
            }
            console.error(res);
            throw new Error(`Failed to fetch genre data (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        if (error.message === "fetch failed") {
            throw new Error("Unable to connect to the server. Please check your internet connection or try again later.");
        }
        throw error;
    }
}

export async function updateState(genSessionId, retryCount = 0) {
    if (!genSessionId) {
        console.warn("No session ID provided for updateState");
        return;
    }    
    try {        
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getEnvironmentHeader(),
            'X-Session-ID': genSessionId,
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''
        };        
        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/status?playSessionId=${genSessionId}`, {
            method: 'DELETE',
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in updateState, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return updateState(genSessionId, retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in updateState:', retryError);
            }
        }

        if (!res.ok) {
            throw new Error(`Failed to update playback status (HTTP ${res.status})`);
        }
        return await res.json();
    } catch (error) {
        console.error("Error updating playback status:", error);
        throw error;
    }
}

export async function search(query, options = {}, retryCount = 0) {
    let url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    if (options.includeExternal) {
        url += `&includeRequest=true`;
    }
    if (options.type) {
        url += `&type=${encodeURIComponent(options.type)}`;
    }
    try {        
        const headers = {
            "X-Environment": getEnvironmentHeader(),
            'User-Agent': 'dp-Monobar',
            'Origin': typeof window !== 'undefined' ? window.location.origin : ''
        };

        const jellyAccessToken = await getCookieValue('jellyAccessToken');
        const jellyUserId = await getCookieValue('jellyUserId');
        if (jellyAccessToken && jellyUserId) {
            headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
        }

        const res = await fetch(url, {
            headers
        });

        if (res.status === 401 && retryCount === 0 && typeof window !== 'undefined') {
            try {
                const { useAuthStore } = await import('@/lib/authStore');
                const authStore = useAuthStore.getState();
                
                if (authStore.isAuthenticated && authStore.userSession?.user?.user?.user_metadata?.provider_id) {
                    console.log('401 detected in search, attempting to refresh Jellyfin authentication...');
                    await authStore.retryJellyAuth();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    return search(query, options, retryCount + 1);
                }
            } catch (retryError) {
                console.error('Failed to retry Jellyfin authentication in search:', retryError);
            }
        }

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

export async function getRecommendations() {
    const res = await fetch(`${API_BASE_URL}/request/recommendations`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch recommendations');
    }
    return res.json();
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
