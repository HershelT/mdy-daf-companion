import type { AppDatabase } from "../storage/database.js";
import type { CandidateProvider } from "./index.js";
import type { DafYomiRef, VideoCandidate } from "./types.js";

export class CachedCandidateProvider implements CandidateProvider {
  constructor(
    private readonly database: AppDatabase,
    private readonly provider: CandidateProvider,
    private readonly ttlHours: number
  ) {}

  async getCandidates(query: DafYomiRef): Promise<VideoCandidate[]> {
    const cacheKey = `candidates:${query.date}:${query.masechta}:${query.daf}`;
    const cached = this.database.getSourceCache<VideoCandidate[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const candidates = await this.provider.getCandidates(query);
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000).toISOString();
    this.database.setSourceCache(cacheKey, "candidate-provider", candidates, expiresAt);
    return candidates;
  }
}

