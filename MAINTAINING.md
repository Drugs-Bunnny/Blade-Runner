# Maintaining the Blade Runner Archive

Notes for whoever works on this next, including Claude in a new chat. Read this before changing anything. `README.md` describes the site; this file covers how it's built, published and extended, and what's still open.

## Where things live

- **Live site:** https://drugs-bunnny.github.io/Blade-Runner/ (GitHub Pages, serves `docs/` on `main`).
- **Repo:** https://github.com/Drugs-Bunnny/Blade-Runner. Owner: Neil (Stavanger, Norway).
- **Claude copy:** the artifact at https://claude.ai/artifact/XjsYR8yiFfd5RzPz5aGpXj, republished from `build/archive.html` after every change. It has no sync and can't be installed; everything else matches the site.
- **Origins long-form synopsis:** a separate Claude doc (artifact `FyEZ7gsTrU1HEYH7vSxG2o`), where the project started.

## Rules that must not change

- **No copyrighted material.** No official covers, stills, character likenesses, film logos or title lettering, soundtrack or "Blade Runner Blues" audio, and no real brands in the city's billboards. All posters, icons, music and sounds are original and generated in code.
- **Synopses are original summaries.** Every fact comes from a source listed in that era's footer. If only a publisher blurb exists, say so on the page rather than invent plot.
- **Spoilers:** the site is full-spoiler by design, but anything new must respect the spoiler shield (`s:` story keys in `lore-data.js`, `data-spoils` on files).

## Building and publishing

1. Edit files under `src/` (and `tools/make_files.py` for character files, then run `python3 tools/make_files.py`).
2. Run `python3 build.py`. It writes `docs/index.html`, `docs/sw.js`, `docs/manifest.webmanifest` and `build/archive.html`. The build number is the commit count plus one when sources are uncommitted, so build, then commit, and the footer matches the commit.
3. Test in Playwright at 390 px and 1280 px wide: no page errors, no horizontal overflow, no duplicate ids, no broken `#` links. Serve `docs/` with `python3 -m http.server` (the service worker and sync need http, not file://).
4. Commit as Neil (`git -c user.name="Neil" -c user.email="drugsbunny83@gmail.com" commit`), then `git fetch origin main && git push origin main`. The `gh` CLI token hasn't worked in this setup; plain git through the proxy does.
5. Republish the artifact from `build/archive.html` to the URL above.
6. Optional: `python3 tools/make_images.py <path to @fontsource node_modules>` refreshes the README screenshots, icons and favicon PNG. Install `@fontsource/chakra-petch @fontsource/barlow @fontsource/share-tech-mono` from npm for real fonts.

## Adding a story (checklist)

Each story has a short key (`i` Origins, `tn` Tokyo Nexus, `tw` To Lose Is to Win, `f` the 1982 film, `gm` the game, `b` 2019, `bo` Black Out, `c` 2029, `l` Black Lotus, `ll` Leaving L.A., `lv` Las Vegas, `dawn` Nexus Dawn, `d` 2039, `run` Nowhere to Run, `g` 2049). Entries use the key plus a number as their id (`tw1`, `g3`). A new story needs:

- a `<section id="...">` with a `.vol-banner` and `article.issue` entries in the right `src/pages/eraN.html`, plus sources in that page's footer;
- `STORIES` in `src/scripts/reader.js` (name, anchor, verb read/watched/played);
- `STORY` in `src/scripts/search.js`, `NAMES` in `src/scripts/lore.js`, `ANCHOR` and `NAME` in `src/scripts/quiz.js`, `STORIES` (origami figure) in `src/scripts/fx.js`, `STORY` in `tools/make_files.py`;
- a poster in `ART` in `src/scripts/art.js`, keyed by the section id (this also adds the banner cover);
- quiz questions under its key in `quiz` in `src/scripts/lore-data.js` (first option is the right one), plus timeline, glossary and map entries there if it adds world events, terms or places;
- `src/shell/subnav.json`, and the hub's reading-order list and poster wall in `src/pages/archive.html`;
- character files for anyone now in two or more stories (`tools/make_files.py`), the subnav "people" list, and the "N people" count on the hub and in the README.

## Features and where they live

City animation and era moods (`city.js`), generative music and rain (`score.js`), posters (`art.js`), tracker and spoiler shield (`reader.js`), search (`search.js`), Lore: timeline, glossary, connections, map (`lore-data.js`, `lore.js`), Voight-Kampff quizzes (`quiz.js`), ESPER zoom, origami badges, boot screen and neon flicker (`fx.js`), interface sounds (`sfx.js`), back-button handling for pop-ups (`overlay.js`) and pages (`router.js`), GitHub gist sync (`sync.js`, Pages copy only), offline app (`src/pwa/`).

Neil's choices worth keeping: rain is "option D" without drips or traffic swooshes, with the synth well above it; interface sounds are off by default; the favicon and app icon are the eye (option A).

## Open items

- **Blade Runner 2099** premieres on Prime Video on 25 November 2026. A scheduled task adds the eight episodes on 28 November (ids `tv1` to `tv8`, key `tv`, verb watched, in the `#br2099` section of `era3.html`).
- **To Lose Is to Win #2 to #4** are written from Titan's descriptions only. Upgrade them when reviews with plot details appear, or when Neil says what happens, and add quiz questions.
- **Ideas Neil hasn't taken up yet:** personal notes and star ratings per issue (synced), a monthly check for new releases with a "Coming soon" panel, a list of all Voight-Kampff tests, and letting a test be taken before finishing a story.
- **Declined:** a "where to get it in Norway" guide.
