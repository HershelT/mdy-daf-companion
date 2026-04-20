import { parseIso8601DurationSeconds } from "./duration.js";
export const MDY_YOUTUBE_CHANNEL_ID = "UCKwQa5DB_VR98ac_r-Wyl-g";
export class YouTubeDataApiCandidateProvider {
    apiKey;
    fetchImpl;
    constructor(apiKey = process.env.YOUTUBE_API_KEY, fetchImpl = fetch) {
        this.apiKey = apiKey;
        this.fetchImpl = fetchImpl;
    }
    async getCandidates(query) {
        if (!this.apiKey) {
            return [];
        }
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("channelId", MDY_YOUTUBE_CHANNEL_ID);
        searchUrl.searchParams.set("maxResults", "25");
        searchUrl.searchParams.set("order", "date");
        searchUrl.searchParams.set("type", "video");
        searchUrl.searchParams.set("q", `${query.masechta} Daf ${query.daf}`);
        searchUrl.searchParams.set("key", this.apiKey);
        const searchResponse = await this.fetchImpl(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`YouTube Data search failed with ${searchResponse.status}`);
        }
        const searchJson = (await searchResponse.json());
        const videos = (searchJson.items || []).flatMap((item) => item.id?.videoId && item.snippet?.title
            ? [
                {
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    publishedAt: item.snippet.publishedAt,
                    source: "youtube-data"
                }
            ]
            : []);
        const durations = await this.fetchDurations(videos.map((video) => video.videoId));
        return videos.map((video) => ({
            ...video,
            durationSeconds: durations.get(video.videoId)
        }));
    }
    async fetchDurations(videoIds) {
        if (videoIds.length === 0 || !this.apiKey) {
            return new Map();
        }
        const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        videosUrl.searchParams.set("part", "contentDetails");
        videosUrl.searchParams.set("id", videoIds.join(","));
        videosUrl.searchParams.set("key", this.apiKey);
        const response = await this.fetchImpl(videosUrl);
        if (!response.ok) {
            throw new Error(`YouTube Data videos failed with ${response.status}`);
        }
        const json = (await response.json());
        const durations = new Map();
        for (const item of json.items || []) {
            const seconds = item.contentDetails?.duration
                ? parseIso8601DurationSeconds(item.contentDetails.duration)
                : undefined;
            if (item.id && seconds !== undefined) {
                durations.set(item.id, seconds);
            }
        }
        return durations;
    }
}
