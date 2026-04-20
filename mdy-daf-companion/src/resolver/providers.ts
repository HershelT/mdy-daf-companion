import type { CandidateProvider } from "./index.js";
import type { DafYomiRef, VideoCandidate } from "./types.js";

export class CompositeCandidateProvider implements CandidateProvider {
  constructor(private readonly providers: CandidateProvider[]) {}

  async getCandidates(query: DafYomiRef): Promise<VideoCandidate[]> {
    const candidates = new Map<string, VideoCandidate>();

    for (const provider of this.providers) {
      try {
        for (const candidate of await provider.getCandidates(query)) {
          candidates.set(candidate.videoId, candidate);
        }
      } catch {
        // Source adapters are intentionally fail-open. The resolver can still succeed from another source.
      }
    }

    return [...candidates.values()];
  }
}

