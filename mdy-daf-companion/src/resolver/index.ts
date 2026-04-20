import { loadConfig } from "../core/config.js";
import { resolveRuntimePaths } from "../core/paths.js";
import { civilDateInTimezone } from "../core/time.js";
import { HebcalDafCalendar, type DafCalendar } from "./dafCalendar.js";
import { chooseBestCandidate } from "./scoring.js";
import type { ResolvedShiur, VideoCandidate } from "./types.js";

export interface CandidateProvider {
  getCandidates(query: { masechta: string; daf: number; date: string }): Promise<VideoCandidate[]>;
}

export class EmptyCandidateProvider implements CandidateProvider {
  async getCandidates(): Promise<VideoCandidate[]> {
    return [];
  }
}

export class ShiurResolver {
  constructor(
    private readonly calendar: DafCalendar = new HebcalDafCalendar(),
    private readonly candidateProvider: CandidateProvider = new EmptyCandidateProvider()
  ) {}

  async resolveForDate(date: string): Promise<ResolvedShiur> {
    const paths = resolveRuntimePaths();
    const config = loadConfig(paths);
    const daf = await this.calendar.getDafForDate(date);
    const candidates = await this.candidateProvider.getCandidates(daf);
    return chooseBestCandidate(daf, candidates, {
      language: config.language,
      format: config.format
    });
  }

  async resolveToday(now = new Date()): Promise<ResolvedShiur> {
    const config = loadConfig(resolveRuntimePaths());
    const date = civilDateInTimezone(now, config.israelDateMode ? "Asia/Jerusalem" : config.timezone);
    return this.resolveForDate(date);
  }
}

