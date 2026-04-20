import type { CandidateProvider } from "./index.js";
import type { DafYomiRef, VideoCandidate } from "./types.js";

export class MdyAppCandidateProvider implements CandidateProvider {
  constructor(
    private readonly appRoot = "https://app.mdydafyomi.com/",
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async getCandidates(query: DafYomiRef): Promise<VideoCandidate[]> {
    const url = `${this.appRoot}?v=shiur&m=${encodeURIComponent(query.masechta)}&d=${query.daf}&h=`;
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new Error(`MDY app request failed with ${response.status}`);
    }
    return extractMdyAppCandidates(await response.text(), query, url);
  }
}

export function extractMdyAppCandidates(
  html: string,
  query: DafYomiRef,
  pageUrl: string
): VideoCandidate[] {
  const ids = new Set<string>();
  for (const pattern of [
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/g,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/g,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/g,
    /"videoId"\s*:\s*"([A-Za-z0-9_-]{6,})"/g
  ]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      ids.add(match[1]);
    }
  }

  return [...ids].map((videoId) => ({
    videoId,
    title: `Daf Yomi ${query.masechta} Daf ${query.daf}`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: "mdy-app",
    publishedAt: pageUrl
  }));
}

