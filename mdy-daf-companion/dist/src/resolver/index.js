import { loadConfig } from "../core/config.js";
import { resolveRuntimePaths } from "../core/paths.js";
import { civilDateInTimezone } from "../core/time.js";
import { HebcalDafCalendar } from "./dafCalendar.js";
import { chooseBestCandidate } from "./scoring.js";
export const DEFAULT_DATE_LOOKBACK_DAYS = 1;
export class EmptyCandidateProvider {
    async getCandidates() {
        return [];
    }
}
function isNoConfidentMatchError(error) {
    return error instanceof Error && /No confident MDY shiur match/.test(error.message);
}
function shiftCivilDate(date, dayDelta) {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid civil date: ${date}`);
    }
    const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    shifted.setUTCDate(shifted.getUTCDate() + dayDelta);
    return shifted.toISOString().slice(0, 10);
}
export async function resolveBestAvailableShiurForDate(options) {
    const maxLookbackDays = Math.max(0, Math.floor(options.lookbackDays ?? DEFAULT_DATE_LOOKBACK_DAYS));
    let lastNoMatchError = null;
    for (let offset = 0; offset <= maxLookbackDays; offset += 1) {
        const requestedDate = shiftCivilDate(options.date, -offset);
        const daf = await options.calendar.getDafForDate(requestedDate);
        const candidates = await options.candidateProvider.getCandidates(daf);
        try {
            const resolved = chooseBestCandidate(daf, candidates, options.preferences);
            if (offset === 0) {
                return resolved;
            }
            return {
                ...resolved,
                reasons: [...resolved.reasons, `date-fallback:-${offset}`]
            };
        }
        catch (error) {
            if (!isNoConfidentMatchError(error)) {
                throw error;
            }
            lastNoMatchError = error instanceof Error ? error : new Error(String(error));
        }
    }
    throw lastNoMatchError || new Error(`No confident MDY shiur match for ${options.date}`);
}
export class ShiurResolver {
    calendar;
    candidateProvider;
    constructor(calendar = new HebcalDafCalendar(), candidateProvider = new EmptyCandidateProvider()) {
        this.calendar = calendar;
        this.candidateProvider = candidateProvider;
    }
    async resolveForDate(date) {
        const paths = resolveRuntimePaths();
        const config = loadConfig(paths);
        return resolveBestAvailableShiurForDate({
            date,
            calendar: this.calendar,
            candidateProvider: this.candidateProvider,
            preferences: {
                language: config.language,
                format: config.format
            }
        });
    }
    async resolveToday(now = new Date()) {
        const config = loadConfig(resolveRuntimePaths());
        const date = civilDateInTimezone(now, config.israelDateMode ? "Asia/Jerusalem" : config.timezone);
        return this.resolveForDate(date);
    }
}
