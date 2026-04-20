import { loadConfig } from "../core/config.js";
import { CachedCandidateProvider } from "./cachedProvider.js";
import { CompositeCandidateProvider } from "./providers.js";
import { MdyAppCandidateProvider } from "./mdyApp.js";
import { YouTubeDataApiCandidateProvider } from "./youtubeDataApi.js";
import { YouTubeChannelPageCandidateProvider } from "./youtubeChannelPage.js";
export function createDefaultCandidateProvider(paths, database) {
    const config = loadConfig(paths);
    const provider = new CompositeCandidateProvider([
        new MdyAppCandidateProvider(),
        new YouTubeDataApiCandidateProvider(),
        new YouTubeChannelPageCandidateProvider()
    ]);
    return database
        ? new CachedCandidateProvider(database, provider, config.resolverCacheHours)
        : provider;
}
