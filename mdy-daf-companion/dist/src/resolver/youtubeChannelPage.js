export const MDY_YOUTUBE_VIDEOS_URL = "https://www.youtube.com/@MercazDafYomi/videos";
export class YouTubeChannelPageCandidateProvider {
    url;
    fetchImpl;
    constructor(url = MDY_YOUTUBE_VIDEOS_URL, fetchImpl = fetch) {
        this.url = url;
        this.fetchImpl = fetchImpl;
    }
    async getCandidates(_query) {
        const response = await this.fetchImpl(this.url, {
            headers: {
                "user-agent": "mdy-daf-companion/0.1 (+https://mdydaf.com)"
            }
        });
        if (!response.ok) {
            throw new Error(`YouTube channel request failed with ${response.status}`);
        }
        return extractYouTubeChannelCandidates(await response.text());
    }
}
export function extractYouTubeChannelCandidates(html) {
    const candidates = new Map();
    const rendererPattern = /"videoRenderer"\s*:\s*\{([\s\S]*?)(?=,"(?:gridVideoRenderer|videoRenderer|continuationItemRenderer|richItemRenderer)"|\}\]\}\}|\}\]\}\]\})/g;
    let match;
    while ((match = rendererPattern.exec(html))) {
        const chunk = match[1];
        const nearby = html.slice(match.index, match.index + 3000);
        const videoId = firstMatch(chunk, /"videoId"\s*:\s*"([^"]+)"/);
        const title = firstMatch(chunk, /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
        const publishedText = firstMatch(nearby, /"publishedTimeText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
        const lengthText = firstMatch(nearby, /"lengthText"\s*:\s*\{\s*"accessibility"\s*:\s*\{\s*"accessibilityData"\s*:\s*\{\s*"label"\s*:\s*"([^"]+)"/) || durationLabelNearVideoId(html, videoId);
        if (!videoId || !title) {
            continue;
        }
        candidates.set(videoId, {
            videoId,
            title: decodeJsonString(title),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            publishedAt: publishedText ? decodeJsonString(publishedText) : undefined,
            durationSeconds: lengthText ? parseDurationLabel(decodeJsonString(lengthText)) : undefined,
            source: "youtube-channel-page"
        });
    }
    if (candidates.size === 0) {
        return extractLooseCandidates(html);
    }
    return [...candidates.values()];
}
function extractLooseCandidates(html) {
    const candidates = new Map();
    const idPattern = /"videoId"\s*:\s*"([^"]{6,})"/g;
    let match;
    while ((match = idPattern.exec(html))) {
        const videoId = match[1];
        const window = html.slice(match.index, match.index + 2500);
        const title = firstMatch(window, /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
        if (title) {
            const lengthText = firstMatch(window, /"lengthText"\s*:\s*\{\s*"accessibility"\s*:\s*\{\s*"accessibilityData"\s*:\s*\{\s*"label"\s*:\s*"([^"]+)"/);
            candidates.set(videoId, {
                videoId,
                title: decodeJsonString(title),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                durationSeconds: lengthText ? parseDurationLabel(decodeJsonString(lengthText)) : undefined,
                source: "youtube-channel-page"
            });
        }
    }
    return [...candidates.values()];
}
function parseDurationLabel(label) {
    const values = [...label.matchAll(/(\d+)\s+(hour|minute|second)s?/gi)];
    if (values.length === 0) {
        return undefined;
    }
    let seconds = 0;
    for (const value of values) {
        const amount = Number(value[1]);
        const unit = value[2].toLowerCase();
        if (unit === "hour")
            seconds += amount * 3600;
        if (unit === "minute")
            seconds += amount * 60;
        if (unit === "second")
            seconds += amount;
    }
    return seconds;
}
function durationLabelNearVideoId(html, videoId) {
    if (!videoId) {
        return null;
    }
    const marker = `"videoId":"${videoId}"`;
    const index = html.indexOf(marker);
    if (index < 0) {
        return null;
    }
    const nearby = html.slice(index, index + 3000);
    return firstMatch(nearby, /"lengthText"\s*:\s*\{\s*"accessibility"\s*:\s*\{\s*"accessibilityData"\s*:\s*\{\s*"label"\s*:\s*"([^"]+)"/);
}
function firstMatch(value, pattern) {
    return value.match(pattern)?.[1] || null;
}
function decodeJsonString(value) {
    return value.replace(/\\u([\dA-Fa-f]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}
