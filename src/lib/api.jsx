const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCAL_API_BASE_URL = process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || API_BASE_URL;

// export { API_BASE_URL, LOCAL_API_BASE_URL };

export async function serverFetch(endpoint, options = {}, providerId) {
  const url = `${LOCAL_API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'dp-Monobar',
    'X-Environment': process.env.NODE_ENV,
    // ...(providerId ? { 'Authorization': providerId } : {}),
    ...options.headers,
  };
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

export async function getMovieData(id, providerId) {
  try {
    const res = await fetch(`${LOCAL_API_BASE_URL}/watch?intent=info&id=${id}`, { 
      // headers: {
      //   ...(providerId ? { 'Authorization': providerId } : {})
      // }
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
export async function getMovieWatchData(id, providerId) {
  try {
    const res = await fetch(`${LOCAL_API_BASE_URL}/watch?intent=play&id=${id}`, {
      // headers: {
      //   ...(providerId ? { 'Authorization': providerId } : {})
      // }
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Video not found. It may have been removed, unavailable, or you might have an invalid link.");
      }
      throw new Error(`Failed to fetch video stream (HTTP ${res.status})`);
    }
    // Instead of .json(), get the m3u8 playlist as text
    return await res.text();
  } catch (error) {
    if (error.message === "fetch failed") {
      throw new Error("Unable to connect to the video server. Please check your internet connection or try again later.");
    }
    throw error;
  }
}

// export async function searchVideos(query, providerId) {
//   try {
//     const response = await serverFetch(`/search?q=${encodeURIComponent(query)}`, {}, providerId);
//     const results = response && response.data ? response.data : [];
//     return Array.isArray(results) ? results : [];
//   } catch (error) {
//     console.error("Search error:", error);
//     return [];
//   }
// }

// export async function getAllCategoriesData(providerId) {
//     const res = await fetch(`${API_BASE_URL}/categories`, {
//         cache: 'no-store',
//         headers: {
//             'Content-Type': 'application/json',
//             'User-Agent': 'dp-iPlayer',
//             'X-Environment': process.env.NODE_ENV,
//             ...(providerId ? { 'Authorization': providerId } : {})
//         }
//     });
//     if (!res.ok) {
//         throw new Error(`API error: ${res.status} ${res.statusText}`);
//     }
//     return res.json();
// }

// export async function getCategoryData(categoryId, providerId) {
//     return serverFetch(`/category?id=${categoryId}`, {}, providerId);
// }
