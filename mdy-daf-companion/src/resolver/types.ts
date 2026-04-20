export type SupportedLanguage = "english" | "hebrew";
export type SupportedFormat = "full" | "chazarah";

export interface DafYomiRef {
  date: string;
  masechta: string;
  daf: number;
  source: string;
  rawTitle?: string;
}

export interface VideoCandidate {
  videoId: string;
  title: string;
  url?: string;
  publishedAt?: string;
  durationSeconds?: number;
  source: string;
}

export interface ParsedVideoTitle {
  masechta: string | null;
  daf: number | null;
  language: SupportedLanguage | null;
  format: SupportedFormat | null;
  excludedReason: string | null;
}

export interface ResolvedShiur {
  daf: DafYomiRef;
  video: VideoCandidate;
  parsed: ParsedVideoTitle;
  confidence: number;
  reasons: string[];
}

