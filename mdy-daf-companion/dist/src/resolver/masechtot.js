const aliases = new Map([
    ["berakhot", "Berachos"],
    ["berachos", "Berachos"],
    ["shabbat", "Shabbos"],
    ["shabbos", "Shabbos"],
    ["eruvin", "Eruvin"],
    ["pesachim", "Pesachim"],
    ["shekalim", "Shekalim"],
    ["yoma", "Yoma"],
    ["sukkah", "Sukkah"],
    ["beitza", "Beitzah"],
    ["beitzah", "Beitzah"],
    ["rosh hashanah", "Rosh Hashanah"],
    ["taanit", "Taanis"],
    ["taanis", "Taanis"],
    ["megillah", "Megillah"],
    ["moed katan", "Moed Katan"],
    ["chagigah", "Chagigah"],
    ["yevamot", "Yevamos"],
    ["yevamos", "Yevamos"],
    ["ketubot", "Kesubos"],
    ["kesubos", "Kesubos"],
    ["nedarim", "Nedarim"],
    ["nazir", "Nazir"],
    ["sotah", "Sotah"],
    ["gittin", "Gittin"],
    ["kiddushin", "Kiddushin"],
    ["bava kamma", "Bava Kamma"],
    ["bava metzia", "Bava Metzia"],
    ["bava basra", "Bava Basra"],
    ["bava batra", "Bava Basra"],
    ["sanhedrin", "Sanhedrin"],
    ["makkot", "Makkos"],
    ["makkos", "Makkos"],
    ["shevuot", "Shevuos"],
    ["shevuos", "Shevuos"],
    ["avodah zarah", "Avodah Zarah"],
    ["horayot", "Horayos"],
    ["horayos", "Horayos"],
    ["zevachim", "Zevachim"],
    ["menachot", "Menachos"],
    ["menachos", "Menachos"],
    ["chullin", "Chullin"],
    ["bekhorot", "Bechoros"],
    ["bechoros", "Bechoros"],
    ["arakhin", "Arachin"],
    ["arachin", "Arachin"],
    ["temurah", "Temurah"],
    ["keritot", "Kerisus"],
    ["kerisus", "Kerisus"],
    ["meilah", "Meilah"],
    ["kinnim", "Kinnim"],
    ["tamid", "Tamid"],
    ["middot", "Middos"],
    ["middos", "Middos"],
    ["niddah", "Niddah"]
]);
export function normalizeMasechta(value) {
    if (!value) {
        return null;
    }
    const cleaned = value
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return aliases.get(cleaned) || titleCase(cleaned);
}
export function masechtaMatches(left, right) {
    const normalizedLeft = normalizeMasechta(left);
    const normalizedRight = normalizeMasechta(right);
    return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}
function titleCase(value) {
    return value
        .split(" ")
        .filter(Boolean)
        .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
        .join(" ");
}
