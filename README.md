# Blade Runner Archive

An unofficial fan archive of the Blade Runner saga from 2009 to 2099. It covers every comic, film, game, short and anime in story order, with full-spoiler synopses: comics issue by issue, *Black Lotus* episode by episode, and the films and the 1997 game part by part.

**Live site:** https://drugs-bunnny.github.io/Blade-Runner/

![The archive's front page: a neon Los Angeles skyline under the title Blade Runner Archive](docs/img/screen-hub.png)

## What's in it

- **Three eras**
  - Era I · Before the Blackout, 2009–2019: Origins, Tokyo Nexus, Blade Runner (1982), the 1997 game, Blade Runner 2019
  - Era II · After the Blackout, 2022–2039: Black Out 2022, Blade Runner 2029, Black Lotus (anime and both comics), 2036: Nexus Dawn, Blade Runner 2039
  - Era III · The Wallace Age, 2048–2099: 2048: Nowhere to Run, Blade Runner 2049, Blade Runner 2099
- **Character files.** Dossiers for 18 people who appear in more than one story, each linking to every appearance in order.
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

Reading progress and the spoiler setting are saved in the visitor's own browser. Nothing is sent anywhere.

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/` | The page content: `archive.html` (the hub), `era1.html`–`era3.html` (the synopses and their sources) and `people.html` (character files) |
| `src/styles/` | `base.css` (palette, type, layout), `site.css` (shared components), `reader.css` (tracker and spoiler shield), `fx.css` (film touches) |
| `src/scripts/` | `city.js` (skyline and rain animation), `score.js` (music and rain sound), `art.js` (posters), `reader.js` (tracker and shield), `search.js` (search), `fx.js` (ESPER, origami, start-up screen, neon flicker), `sfx.js` (interface sounds), `router.js` (switching views) |
| `src/shell/` | Page furniture: hero text, sub-navigation, the music player, the start-up and ESPER overlays, icon and social tags |
| `build.py` | Assembles everything into one page |
| `docs/` | The built site, served by GitHub Pages, plus its images |
| `tools/make_files.py` | Regenerates `src/pages/people.html` from the character data |
| `tools/make_images.py` | Renders the link preview card, icons and the screenshots above |
| `tools/rain-sampler.html` | A page for auditioning rain styles |

## Building

Requires Python 3 and nothing else.

```sh
python3 build.py
```

This writes `docs/index.html` for GitHub Pages and `build/archive.html` for the Claude artifact copy. Commit `docs/` along with your source changes.

To refresh the images, you also need [Playwright for Python](https://playwright.dev/python/) with Chromium:

```sh
python3 tools/make_images.py
```

## Credits

This is an unofficial fan project. Blade Runner is owned by Alcon Entertainment, and the comics are published by Titan Comics. The synopses are original summaries; the sources are listed at the foot of each era. All artwork and music on the site are original and generated in the browser. No official images or audio are used.
