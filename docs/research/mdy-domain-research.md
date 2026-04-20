# MDY Domain Research Snapshot

Research date: April 19, 2026, with date-sensitive checks around April 19-20, 2026.

## What Mercaz Daf Yomi Is

Mercaz Daf Yomi, commonly presented as MDY, is a global Daf Yomi learning community built around Rabbi Eli Stefansky's daily Gemara shiur. The community includes live and recorded shiurim, full Daf Yomi lessons, chazarah/review formats, Hebrew content, charts, quizzes, app features, events, sponsorships, and a strong sense of daily learner identity.

The product idea should treat MDY as more than a video source. Its appeal is the combination of consistency, humor, visual explanation, community, and daily momentum.

## Rabbi Eli Stefansky

Rabbi Eli Stefansky is an American-Israeli Daf Yomi maggid shiur based in Ramat Beit Shemesh. Public profiles describe him as originally from Chicago, later making aliyah to Ramat Beit Shemesh, and building MDY from a small local chazarah/shiur into a large international learning community.

Important positioning points:

- He is known for an energetic, clear, humorous style.
- The shiur often uses visuals, stories, props, charts, and a conversational feel.
- The MDY message emphasizes daily consistency: "It is not about the Daf, it is about the Yomi."
- The audience includes serious learners, baalei batim, commuters, English speakers, Hebrew speakers, and people who need Daf Yomi to fit into a busy workday.

## Official Sites And Surfaces

Primary public surfaces:

- `https://mercazdafyomi.com/`: older WordPress/Elementor site. Pages discovered include full daf, live shiur, links, sponsorships, free gemara, Grow the Shiur, Hebrew pages, and donation pages.
- `https://www.mdydafyomi.com/` and `https://mdydaf.com/`: newer public Webflow-style MDY sites. Pages include home, learn, about, contact, gallery, events, sponsor, help, and Hebrew pages.
- `https://app.mdydafyomi.com/`: Bubble web app used for the actual learning experience.
- `https://www.youtube.com/@MercazDafYomi/videos`: official YouTube channel.

Observed app behavior around April 19, 2026:

- App dashboard showed "Learn with MDY".
- Today's Daf was shown as Menachos 98 on April 19, 2026 in the local check.
- The shiur page URL pattern included query parameters like `?v=shiur&m=Menachos&d=98&h=`.
- The English full Daf Menachos 98 video was embedded from YouTube with ID `2qz8rC9Yh_k`.
- The player page exposed notes, quiz, chapters, a watched marker, and Hebrew toggle.

Observed YouTube examples around that check:

- English full Daf Menachos 98: `2qz8rC9Yh_k`, about 1 hour.
- English chazarah Menachos 98: `x7k9w2hUzXA`, about 39 minutes.
- Hebrew Menachos Daf 99: `kjvUtjonhn4`, about 58 minutes.
- Hebrew chazarah Menachos 98: `-SSUiFhPuZs`, about 27 minutes.

Important finding: newest upload is not always the desired video. The resolver must consider daf, language, format, title semantics, and user preference.

## Product Implications

The plugin should support multiple shiur modes:

- English full Daf.
- English chazarah or shorter review.
- Hebrew full Daf.
- Hebrew chazarah.
- Optional future "8 minute Daf" if source coverage is reliable.

The plugin should not assume one date equals one video. A daily Daf may have:

- Full shiur.
- Review/chazarah.
- Hebrew shiur.
- Later corrections or reposts.
- App-specific metadata that is better than raw YouTube ordering.

## Suggested Source Priority

1. MDY app or official MDY metadata when stable and accessible.
2. YouTube Data API for official channel uploads and metadata.
3. YouTube page metadata or `yt-dlp` style extraction as a local fallback.
4. Calendar APIs such as Hebcal for Daf Yomi date mapping.
5. Cached last-known-good source data when offline.

## Risks

- The MDY app is built on Bubble and may change DOM/network behavior.
- YouTube titles can vary by language and transliteration.
- RSS for the channel may not be reliable in all environments.
- Autoplay behavior differs across browsers and operating systems.
- Users may be coding near midnight or across time zones, which affects "today's daf".
- Shabbos and Yom Tov behavior must be opt-in/configurable and respectful.

## Release Positioning

The strongest product story is not "a YouTube auto-player." It is:

> Turn Claude Code sessions into steady Daf Yomi time, with Rabbi Eli Stefansky's latest MDY shiur, automatic pause/resume, and meaningful learning stats.

