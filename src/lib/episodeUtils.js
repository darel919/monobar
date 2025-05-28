export const findNextEpisode = (currentEpisodeId, seriesData) => {
    if (!seriesData?.availableSeasons || !currentEpisodeId) return null;

    for (const season of seriesData.availableSeasons) {
        const episodeIndex = season.episodes?.findIndex(ep => ep.Id === currentEpisodeId);
        if (episodeIndex !== -1 && episodeIndex !== undefined) {

            if (episodeIndex < season.episodes.length - 1) {
                return season.episodes[episodeIndex + 1];
            }

            const seasonIndex = seriesData.availableSeasons.indexOf(season);
            for (let i = seasonIndex + 1; i < seriesData.availableSeasons.length; i++) {
                if (seriesData.availableSeasons[i].episodes?.length > 0) {
                    return seriesData.availableSeasons[i].episodes[0];
                }
            }
            break;
        }
    }
    return null;
};

export const isAtAbsoluteEnd = (currentEpisodeId, seriesData) => {
    if (!seriesData?.availableSeasons || !currentEpisodeId) return false;

    const lastSeasonWithEpisodes = [...seriesData.availableSeasons]
        .reverse()
        .find(season => season.episodes?.length > 0);
    
    if (!lastSeasonWithEpisodes) return false;

    const lastEpisode = lastSeasonWithEpisodes.episodes[lastSeasonWithEpisodes.episodes.length - 1];
    
    return lastEpisode.Id === currentEpisodeId;
};

export const getCurrentSeasonAndEpisodeNumbers = (currentEpisodeId, seriesData) => {
    if (!seriesData?.availableSeasons || !currentEpisodeId) return null;

    for (const season of seriesData.availableSeasons) {
        const episode = season.episodes?.find(ep => ep.Id === currentEpisodeId);
        if (episode) {
            return {
                seasonNumber: season.IndexNumber || 1,
                episodeNumber: episode.IndexNumber || 1,
                seasonId: season.Id,
                episodeId: episode.Id
            };
        }
    }
    return null;
};

export const getNextEpisodeInfo = (nextEpisode, seriesData) => {
    if (!nextEpisode || !seriesData?.availableSeasons) return null;

    for (const season of seriesData.availableSeasons) {
        const episode = season.episodes?.find(ep => ep.Id === nextEpisode.Id);
        if (episode) {
            return {
                id: episode.Id,
                title: episode.Name || `Episode ${episode.IndexNumber}`,
                seasonNumber: season.IndexNumber || 1,
                episodeNumber: episode.IndexNumber || 1,
                seriesId: seriesData.Id
            };
        }
    }
    return null;
};
