const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCAL_API_BASE_URL = process.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || API_BASE_URL : API_BASE_URL;

export { API_BASE_URL, LOCAL_API_BASE_URL };

export async function serverFetch(endpoint, options = {}, providerId) {
  const url = `${LOCAL_API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'dp-Monobar',
    'X-Environment': process.env.NODE_ENV,
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
    const res = await fetch(`${LOCAL_API_BASE_URL}/watch?intent=${intent}&id=${id}`, { 
      headers: {
        "X-Environment": process.env.NODE_ENV,
        'User-Agent': 'dp-Monobar',
        // ...(providerId ? { 'Authorization': providerId } : {})
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
    const res = await fetch(`${LOCAL_API_BASE_URL}/library?${query}`, { 
      headers: {
        "X-Environment": process.env.NODE_ENV,
        'User-Agent': 'dp-Monobar',
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
    const res = await fetch(`${LOCAL_API_BASE_URL}/status?playSessionId=${genSessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'dp-Monobar',
        'X-Environment': process.env.NODE_ENV,
        'X-Session-ID': genSessionId
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

