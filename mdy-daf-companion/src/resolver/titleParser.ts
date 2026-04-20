import { normalizeMasechta } from "./masechtot.js";
import type { ParsedVideoTitle, SupportedFormat, SupportedLanguage } from "./types.js";

const excludedTerms = [
  "siyum",
  "siyyum",
  "event",
  "dinner",
  "fundraiser",
  "trailer",
  "shorts",
  "promo",
  "announcement"
];

export function parseVideoTitle(title: string): ParsedVideoTitle {
  const lower = title.toLowerCase();
  const excludedReason = excludedTerms.find((term) => lower.includes(term)) || null;
  const daf = parseDafNumber(title);
  const masechta = parseMasechta(title);
  const language = parseLanguage(title);
  const format = parseFormat(title);

  return {
    masechta,
    daf,
    language,
    format,
    excludedReason
  };
}

function parseDafNumber(title: string): number | null {
  const patterns = [
    /\bdaf\s+(\d{1,3})\b/i,
    /\b(?:דף)\s*(\d{1,3})\b/u,
    /\b[A-Za-z ]+\s+(\d{1,3})\b/
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }
  return null;
}

function parseMasechta(title: string): string | null {
  const withoutSeparators = title.replace(/[-|:]/g, " ");
  const dafMatch = withoutSeparators.match(/([A-Za-z ]+?)\s+(?:daf\s+)?\d{1,3}\b/i);
  if (dafMatch) {
    const cleaned = dafMatch[1]
      .replace(/\b(english|hebrew|full|chazarah|review|daf|yomi|maseches|masechet)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = cleaned.split(" ").slice(-2).join(" ");
    return normalizeMasechta(words) || normalizeMasechta(cleaned);
  }
  return null;
}

function parseLanguage(title: string): SupportedLanguage | null {
  if (/[\u0590-\u05FF]/u.test(title) || /\bhebrew\b/i.test(title)) {
    return "hebrew";
  }
  if (/\benglish\b/i.test(title)) {
    return "english";
  }
  return null;
}

function parseFormat(title: string): SupportedFormat | null {
  if (/\b(chazarah|review|nothing but the daf)\b/i.test(title)) {
    return "chazarah";
  }
  if (/\b(full|daf yomi|daf)\b/i.test(title)) {
    return "full";
  }
  return null;
}

