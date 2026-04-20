import type { AppConfig } from "../core/config.js";
import { civilDateInTimezone } from "../core/time.js";

export interface GuardDecision {
  blocked: boolean;
  reason: string | null;
}

export function isShabbosByLocalDate(date: Date, timezone: string): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(date);
  return weekday === "Sat";
}

export function shouldBlockAutoPlayback(config: AppConfig, date = new Date()): GuardDecision {
  if (!config.shabbosYomTovGuard) {
    return { blocked: false, reason: null };
  }

  if (isShabbosByLocalDate(date, config.timezone)) {
    return {
      blocked: true,
      reason: `Shabbos guard active for ${civilDateInTimezone(date, config.timezone)}`
    };
  }

  return { blocked: false, reason: null };
}

interface HebcalHolidayItem {
  title?: string;
  category?: string;
  subcat?: string;
  yomtov?: boolean;
}

interface HebcalHolidayResponse {
  items?: HebcalHolidayItem[];
}

export class HebcalYomTovGuard {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async isYomTov(date: string): Promise<GuardDecision> {
    const url = `https://www.hebcal.com/hebcal?cfg=json&v=1&yto=on&start=${encodeURIComponent(
      date
    )}&end=${encodeURIComponent(date)}`;
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new Error(`Hebcal Yom Tov request failed with ${response.status}`);
    }
    const json = (await response.json()) as HebcalHolidayResponse;
    const event = json.items?.find(
      (item) => item.category === "holiday" && (item.yomtov || item.subcat === "major")
    );
    return event
      ? { blocked: true, reason: `Yom Tov guard active: ${event.title || "Yom Tov"}` }
      : { blocked: false, reason: null };
  }
}

