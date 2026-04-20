import { normalizeMasechta } from "./masechtot.js";
export class HebcalDafCalendar {
    fetchImpl;
    constructor(fetchImpl = fetch) {
        this.fetchImpl = fetchImpl;
    }
    async getDafForDate(date) {
        const url = `https://www.hebcal.com/hebcal?cfg=json&v=1&F=on&start=${encodeURIComponent(date)}&end=${encodeURIComponent(date)}`;
        const response = await this.fetchImpl(url);
        if (!response.ok) {
            throw new Error(`Hebcal request failed with ${response.status}`);
        }
        return parseHebcalDafResponse((await response.json()), date);
    }
}
export function parseHebcalDafResponse(response, requestedDate) {
    const item = response.items?.find((entry) => entry.category === "dafyomi");
    if (!item?.title) {
        throw new Error(`No Daf Yomi item found for ${requestedDate}`);
    }
    const match = item.title.match(/^(.+?)\s+(\d+)$/);
    if (!match) {
        throw new Error(`Could not parse Daf Yomi title: ${item.title}`);
    }
    const masechta = normalizeMasechta(match[1]);
    if (!masechta) {
        throw new Error(`Could not normalize masechta: ${match[1]}`);
    }
    return {
        date: item.date || requestedDate,
        masechta,
        daf: Number(match[2]),
        source: "hebcal",
        rawTitle: item.title
    };
}
