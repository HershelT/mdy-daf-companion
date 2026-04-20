import { loadConfig } from "../core/config.js";
import { resolveRuntimePaths } from "../core/paths.js";
import { civilDateInTimezone } from "../core/time.js";
import { HebcalDafCalendar } from "./dafCalendar.js";
import { chooseBestCandidate } from "./scoring.js";
export class EmptyCandidateProvider {
    async getCandidates() {
        return [];
    }
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
        const daf = await this.calendar.getDafForDate(date);
        const candidates = await this.candidateProvider.getCandidates(daf);
        return chooseBestCandidate(daf, candidates, {
            language: config.language,
            format: config.format
        });
    }
    async resolveToday(now = new Date()) {
        const config = loadConfig(resolveRuntimePaths());
        const date = civilDateInTimezone(now, config.israelDateMode ? "Asia/Jerusalem" : config.timezone);
        return this.resolveForDate(date);
    }
}
