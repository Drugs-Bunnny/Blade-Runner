"""Build the Blade Runner Archive into a single page.

Writes two copies:
  docs/index.html     a complete standalone page, served by GitHub Pages
  build/archive.html  the same page without the <html>/<head> wrapper, for the Claude artifact

Usage: python3 build.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

TITLE = "Blade Runner Archive"
DESCRIPTION = ("An unofficial fan archive of the Blade Runner saga, 2009 to 2099: "
               "every comic, film, game, short and anime, in story order.")
SITE_URL = "https://drugs-bunnny.github.io/Blade-Runner/"

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700'
         '&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Share+Tech+Mono&display=swap">')

# Views, in order. The first one is shown on load.
VIEWS = ["archive", "era1", "era2", "era3"]
NAV = [("era1", 'Era I<span class="yrs"> · 2009–2019</span>'),
       ("era2", 'Era II<span class="yrs"> · 2022–2039</span>'),
       ("era3", 'Era III<span class="yrs"> · 2048–2099</span>')]

STYLES = ["styles/base.css", "styles/site.css", "styles/reader.css"]
SCRIPTS = ["scripts/city.js", "scripts/score.js", "scripts/art.js", "scripts/reader.js"]


def read(rel):
    return (SRC / rel).read_text()


def nav_html(subnav):
    links = "".join(f'<a href="#{v}" data-nav="{v}">{label}</a>' for v, label in NAV)
    subs = "".join(
        f'<div class="wrap sub" data-for="{view}" hidden>'
        + "".join(f'<a href="#{anchor}">{text}</a>' for anchor, text in items)
        + "</div>"
        for view, items in subnav.items())
    return (f'<nav class="bar" aria-label="Archive"><div class="wrap">'
            f'<a class="brand" href="#archive">BR · ARCHIVE</a>{links}</div>{subs}</nav>')


def hero_html(kicker, title, sub, lede, signs):
    sign_html = "".join(f'<div class="sign {c}">{t}</div>' for c, t in zip(("p", "c"), signs))
    return f'''<header class="hero">
  <canvas id="city" aria-hidden="true"></canvas>
  <div class="signs" aria-hidden="true">{sign_html}</div>
  <div class="wrap">
    <div class="label kicker">{kicker}</div>
    <h1 class="flicker">{title}<span>{sub}</span></h1>
    <p class="lede">{lede}</p>
    <div class="spoiler">FULL SPOILERS</div>
  </div>
</header>'''


def build():
    heroes = json.loads(read("shell/heroes.json"))
    subnav = json.loads(read("shell/subnav.json"))
    css = "\n".join(read(s) for s in STYLES)
    scripts = "\n".join(read(s) for s in SCRIPTS)
    router = read("scripts/router.js").replace("__HEROES__", json.dumps(heroes, ensure_ascii=False))

    views = "".join(
        f'<div class="view" id="{v}" data-view="{v}"{"" if i == 0 else " hidden"}>{read(f"pages/{v}.html")}</div>'
        for i, v in enumerate(VIEWS))
    body = (nav_html(subnav)
            + hero_html(*heroes[VIEWS[0]])
            + f'<main id="top">{views}</main>')

    page = (f'<title>{TITLE}</title>\n'
            f'<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'{read("shell/head.html")}'
            f'{FONTS}\n'
            f'<style>{css}</style>\n'
            f'<canvas id="rain" aria-hidden="true"></canvas>\n'
            f'<div class="scan" aria-hidden="true"></div>\n'
            f'{read("shell/player.html")}'
            f'{body}\n'
            f'<script>{scripts}\n{router}</script>')

    # Claude artifact: the host wraps the page in <html>/<head>/<body> itself.
    (ROOT / "build").mkdir(exist_ok=True)
    (ROOT / "build" / "archive.html").write_text(page)

    # GitHub Pages: a complete document.
    head, rest = page.split('<canvas id="rain"', 1)
    standalone = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
                  f'<meta name="description" content="{DESCRIPTION}">\n'
                  f'{read("shell/social.html").replace("__SITE__", SITE_URL).replace("__DESC__", DESCRIPTION).replace("__TITLE__", TITLE)}'
                  '<style>:root{color-scheme:dark}html,body{background:#070910}body{font-family:system-ui,sans-serif}</style>\n'
                  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                  + head.replace("</style>\n", "\n" + read("shell/standalone.css") + "</style>\n", 1)
                  + '</head><body><canvas id="rain"' + rest + "\n</body></html>\n")
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs" / "index.html").write_text(standalone)
    (ROOT / "docs" / ".nojekyll").write_text("")
    print(f"build/archive.html {len(page):,} bytes")
    print(f"docs/index.html    {len(standalone):,} bytes")


if __name__ == "__main__":
    build()
