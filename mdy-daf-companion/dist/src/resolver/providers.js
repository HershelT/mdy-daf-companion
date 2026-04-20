export class CompositeCandidateProvider {
    providers;
    constructor(providers) {
        this.providers = providers;
    }
    async getCandidates(query) {
        const candidates = new Map();
        for (const provider of this.providers) {
            try {
                for (const candidate of await provider.getCandidates(query)) {
                    candidates.set(candidate.videoId, candidate);
                }
            }
            catch {
                // Source adapters are intentionally fail-open. The resolver can still succeed from another source.
            }
        }
        return [...candidates.values()];
    }
}
