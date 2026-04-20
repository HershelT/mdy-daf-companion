import { loadConfig } from "../core/config.js";
import type { RuntimePaths } from "../core/paths.js";
import { AppDatabase } from "../storage/database.js";
import { CachedCandidateProvider } from "./cachedProvider.js";
import { CompositeCandidateProvider } from "./providers.js";
import { MdyAppCandidateProvider } from "./mdyApp.js";
import { YouTubeDataApiCandidateProvider } from "./youtubeDataApi.js";
import { YouTubeChannelPageCandidateProvider } from "./youtubeChannelPage.js";

export function createDefaultCandidateProvider(paths: RuntimePaths, database?: AppDatabase) {
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

