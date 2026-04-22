const HOT_QUERY_TTL_MINUTES = 20;
function parseCivilDateToUtcMs(value) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
function cacheTtlMsForQuery(baseTtlHours, queryDate) {
    const baseTtlMs = Math.max(1, baseTtlHours) * 60 * 60 * 1000;
    const queryMs = parseCivilDateToUtcMs(queryDate);
    const todayMs = parseCivilDateToUtcMs(new Date().toISOString().slice(0, 10));
    if (queryMs === null || todayMs === null) {
        return baseTtlMs;
    }
    const dayDistance = Math.abs((queryMs - todayMs) / (24 * 60 * 60 * 1000));
    if (dayDistance <= 1) {
        return Math.min(baseTtlMs, HOT_QUERY_TTL_MINUTES * 60 * 1000);
    }
    return baseTtlMs;
}
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
        const expiresAt = new Date(Date.now() + cacheTtlMsForQuery(this.ttlHours, query.date)).toISOString();
        this.database.setSourceCache(cacheKey, "candidate-provider", candidates, expiresAt);
        return candidates;
    }
}
