export class CachedCandidateProvider {
    database;
    provider;
    ttlHours;
    constructor(database, provider, ttlHours) {
        this.database = database;
        this.provider = provider;
        this.ttlHours = ttlHours;
    }
    async getCandidates(query) {
        const cacheKey = `candidates:${query.date}:${query.masechta}:${query.daf}`;
        const cached = this.database.getSourceCache(cacheKey);
        if (cached) {
            return cached;
        }
        const candidates = await this.provider.getCandidates(query);
        const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000).toISOString();
        this.database.setSourceCache(cacheKey, "candidate-provider", candidates, expiresAt);
        return candidates;
    }
}
