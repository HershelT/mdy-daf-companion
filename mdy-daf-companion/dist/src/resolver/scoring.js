import { masechtaMatches } from "./masechtot.js";
import { parseVideoTitle } from "./titleParser.js";
export function scoreCandidate(daf, candidate, preferences) {
    const parsed = parseVideoTitle(candidate.title);
    const reasons = [];
    let score = 0;
    if (parsed.excludedReason) {
        return {
            video: candidate,
            parsed,
            confidence: 0,
            reasons: [`excluded:${parsed.excludedReason}`]
        };
    }
    if (masechtaMatches(parsed.masechta, daf.masechta)) {
        score += 0.4;
        reasons.push("masechta");
    }
    if (parsed.daf === daf.daf) {
        score += 0.25;
        reasons.push("daf");
    }
    if (parsed.language === preferences.language) {
        score += 0.15;
        reasons.push("language");
    }
    else if (!parsed.language && preferences.language === "english") {
        score += 0.05;
        reasons.push("implicit-english");
    }
    if (parsed.format === preferences.format) {
        score += 0.12;
        reasons.push("format");
    }
    else if (!parsed.format && preferences.format === "full") {
        score += 0.04;
        reasons.push("implicit-full");
    }
    if (candidate.durationSeconds && candidate.durationSeconds >= 1200 && candidate.durationSeconds <= 5400) {
        score += 0.05;
        reasons.push("duration");
    }
    if (candidate.source === "mdy-app") {
        score += 0.03;
        reasons.push("official-app");
    }
    else if (candidate.source === "youtube-data") {
        score += 0.02;
        reasons.push("youtube-data");
    }
    return {
        video: candidate,
        parsed,
        confidence: Math.min(1, Number(score.toFixed(3))),
        reasons
    };
}
export function chooseBestCandidate(daf, candidates, preferences) {
    const scored = candidates
        .map((candidate) => scoreCandidate(daf, candidate, preferences))
        .sort((a, b) => b.confidence - a.confidence);
    const best = scored[0];
    if (!best || best.confidence < 0.6) {
        throw new Error(`No confident MDY shiur match for ${daf.masechta} ${daf.daf}`);
    }
    return {
        daf,
        video: best.video,
        parsed: best.parsed,
        confidence: best.confidence,
        reasons: best.reasons
    };
}
