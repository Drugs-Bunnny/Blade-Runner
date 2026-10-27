# Blade Runner Archive

An unofficial fan archive of the Blade Runner saga from 2009 to 2099. It covers every comic, film, game, short and anime in story order, with full-spoiler synopses: comics issue by issue, *Black Lotus* episode by episode, and the films and the 1997 game part by part.

**Live site:** https://drugs-bunnny.github.io/Blade-Runner/

![The archive's front page: a neon Los Angeles skyline under the title Blade Runner Archive](docs/img/screen-hub.png)

## What's in it

- **Three eras**
  - Era I · Before the Blackout, 2009–2019: Origins, Tokyo Nexus, Tokyo Nexus: To Lose Is to Win, Blade Runner (1982), the 1997 game, Blade Runner 2019
  - Era II · After the Blackout, 2022–2039: Black Out 2022, Blade Runner 2029, Black Lotus (anime and both comics), 2036: Nexus Dawn, Blade Runner 2039
  - Era III · The Wallace Age, 2048–2099: 2048: Nowhere to Run, Blade Runner 2049, Blade Runner 2099
- **Character files.** Dossiers for 22 people who appear in more than one story, each linking to every appearance in order.
- **Lore.** A section of its own with four parts:
  - A timeline from 2007 to 2099, with world events and where each story sits.
  - A glossary of terms like the Nexus models, the Blackout and the Voight-Kampff test. Terms in the synopses have a dotted underline; tap one for its definition.
  - A web of connections between the characters. Tap a name to see who they're tied to and how.
  - An original map of California, Nevada and Baja, with Tokyo and the off-world colonies as insets. Tap a place to see the stories set there.
- **Voight-Kampff tests.** Finishing a story unlocks a short quiz on it. Get four in five right to pass as human. Your best score is kept.
- **Reading tracker.** Mark each issue or episode as read, watched or played, see your progress for each story, era and the whole archive, and use Continue to jump to the next unread entry.
- **Search.** Search every synopsis, character file and story intro from the top bar, or press `/` or Ctrl+K. With the spoiler shield on, matches in unread entries are counted but not shown.
- **Spoiler shield.** An optional mode that blurs everything you haven't marked yet. Tap any entry to reveal it.
- **Original art and sound.** A neon poster for every story, five generative ambient tracks, and city-street rain. Everything is drawn and played live in the browser. The music keeps playing as you move around the page, and phones show lock-screen controls.
- **Film touches.**
  - Each era has its own sky: amber smog and flare stacks for Era I, neon rain and billboards for Era II, orange dust for Era III, with searchlights and a patrol spinner over the city.
  - Tap a poster to "enhance" it on an ESPER screen.
  - Finishing a story leaves an origami figure on its banner.
  - A short LAPD terminal start-up plays once per visit, and the neon headings flicker now and then.
  - Optional interface sounds (the Sounds chip in the player, off by default): a Voight-Kampff chirp when you mark an entry and a spinner passing when you change era.
  - Reduced-motion settings turn the animation off.

| Era page | Character files | Phone |
| --- | --- | --- |
| ![Black Lotus section with its poster](docs/img/screen-era.png) | ![Character dossiers](docs/img/screen-files.png) | ![An issue card on a phone](docs/img/screen-phone.png) |

- **Sync across devices.** Tap *Sync* in the bar at the top of any page to keep reading progress and quiz scores in step on your phone, tablet and computer. Progress is saved to a private gist in your own GitHub account, using a token with only the *gist* permission that you paste in once. A connected device shows a setup code for adding the next one. Each change is timestamped, so devices merge rather than overwrite each other. Sync is in the GitHub Pages copy only.
- **Install it and read offline.** On Android, open the site in Chrome and tap *Install as an app* at the foot of the front page, or choose *Add to Home screen* from the browser menu. It then opens full-screen from its own icon. After one visit, the whole archive works without a connection, music included.

![The Lore timeline](docs/img/screen-lore.png)

Reading progress, quiz scores and the spoiler setting are saved in the visitor's own browser. Nothing is sent anywhere unless you turn on sync, which talks only to GitHub, using your own token.

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/` | The page content: `archive.html` (the hub), `era1.html`–`era3.html` (the synopses and their sources), `people.html` (character files) and `lore.html` (the Lore section's frame) |
| `src/styles/` | `base.css` (palette, type, layout), `site.css` (shared components), `reader.css` (tracker and spoiler shield), `fx.css` (film touches), `lore.css` (Lore and the quizzes), `sync.css` (the sync button and dialog) |
| `src/scripts/` | `city.js` (skyline and rain animation), `score.js` (music and rain sound), `art.js` (posters), `reader.js` (tracker and shield), `search.js` (search), `fx.js` (ESPER, origami, start-up screen, neon flicker), `sfx.js` (interface sounds), `lore-data.js` (glossary, timeline, connections, places and quiz questions), `lore.js` (draws the Lore section and the underlined terms), `quiz.js` (Voight-Kampff tests), `sync.js` (GitHub gist sync, Pages copy only), `router.js` (switching views) |
| `src/shell/` | Page furniture: hero text, sub-navigation, the music player, the start-up and ESPER overlays, icon and social tags |
| `src/pwa/` | The app manifest, the offline service worker and its registration, used by the GitHub Pages copy only |
| `build.py` | Assembles everything into one page |
| `docs/` | The built site, served by GitHub Pages, plus its images |
| `tools/make_files.py` | Regenerates `src/pages/people.html` from the character data |
| `tools/make_images.py` | Renders the link preview card, icons and the screenshots above |

## Building

Requires Python 3 and nothing else.

```sh
python3 build.py
```

This writes `docs/index.html`, `docs/manifest.webmanifest` and `docs/sw.js` for GitHub Pages, and `build/archive.html` for the Claude artifact copy. Commit `docs/` along with your source changes.

Each build is stamped with a build number and date, shown at the foot of every page and on the start-up screen. The number is the commit the build belongs to: the commit count so far, plus one if there are uncommitted source changes. So build and commit together, and the number on the live site matches the commit that published it.

To refresh the images, you also need [Playwright for Python](https://playwright.dev/python/) with Chromium:

```sh
python3 tools/make_images.py
```

## Credits

This is an unofficial fan project. Blade Runner is owned by Alcon Entertainment, and the comics are published by Titan Comics. The synopses are original summaries; the sources are listed at the foot of each era. All artwork and music on the site are original and generated in the browser. No official images or audio are used.
