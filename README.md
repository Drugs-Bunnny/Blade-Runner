# Blade Runner Archive

An unofficial fan archive of the Blade Runner saga, from 2009 to 2099. It covers every comic, film, short and anime in story order, with full-spoiler synopses: comics issue by issue, *Black Lotus* episode by episode, and the films act by act.

You can mark issues and episodes as read or watched, track progress for each story and era, and turn on a spoiler shield that blurs anything you haven't read yet.

The site is a single page in a neon-noir style. It has original poster art for each story, an original generative ambient score with five tracks, and city-street rain. Switching between eras swaps the content in place, so the music keeps playing.

## Eras

| Era | Years | Stories |
| --- | --- | --- |
| I · Before the Blackout | 2009–2019 | Origins, Tokyo Nexus, Blade Runner (1982), Blade Runner 2019 |
| II · After the Blackout | 2022–2039 | Black Out 2022, Blade Runner 2029, Black Lotus (anime and comics), 2036: Nexus Dawn, Blade Runner 2039 |
| III · The Wallace Age | 2048–2099 | 2048: Nowhere to Run, Blade Runner 2049, Blade Runner 2099 |

## Layout

| Path | What it is |
| --- | --- |
| `src/origins.html` | The Origins section: case board, case files and themes, plus the shared styles and the skyline and rain animation |
| `src/hub_body.html` | The hub: era cards, poster wall and reading order |
| `src/era1_more.html`, `src/era2_body.html`, `src/era3_body.html` | The synopses for each era |
| `src/score.js` | The music player and rain, generated with Web Audio |
| `src/art.js` | The poster art, drawn on canvas |
| `src/reader.js`, `src/reader.css` | The reading tracker and spoiler shield. Progress is saved in the visitor's own browser |
| `build.py` | Assembles everything into one page |
| `docs/index.html` | The built site, served by GitHub Pages |
| `tools/rain-sampler.html` | A page for auditioning rain styles |

## Building

Requires Python 3 and nothing else.

```sh
python3 build.py
```

This writes `docs/index.html`. Commit it along with your source changes.

## Publishing

In the repository settings, open **Pages**, set the source to **Deploy from a branch**, then choose branch `main` and folder `/docs`.

## Credits

This is an unofficial fan project. Blade Runner is owned by Alcon Entertainment, and the comics are published by Titan Comics. The synopses are original summaries; the sources are listed at the foot of each era. All artwork and music on the site are original and generated in the browser. No official images or audio are used.
