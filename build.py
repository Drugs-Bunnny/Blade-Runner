"""Build the Blade Runner Archive into a single page.

Writes two copies:
  docs/index.html     a complete standalone page, served by GitHub Pages
  build/archive.html  the same page without the <html>/<head> wrapper, for the Claude artifact

Usage: python3 build.py
"""
import datetime
import json
import pathlib
import subprocess
from zoneinfo import ZoneInfo

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
VIEWS = ["archive", "era1", "era2", "era3", "people", "lore"]
NAV = [("era1", 'Era I<span class="yrs"> · 2009–2019</span>'),
       ("era2", 'Era II<span class="yrs"> · 2022–2039</span>'),
       ("era3", 'Era III<span class="yrs"> · 2048–2099</span>'),
       ("people", 'Files'),
       ("lore", 'Lore')]

STYLES = ["styles/base.css", "styles/site.css", "styles/reader.css", "styles/fx.css", "styles/lore.css"]
SCRIPTS = ["scripts/city.js", "scripts/score.js", "scripts/art.js", "scripts/reader.js", "scripts/lore-data.js",
           "scripts/lore.js", "scripts/quiz.js", "scripts/search.js", "scripts/fx.js", "scripts/sfx.js"]


def build_number():
    """The build number is the commit this build will be part of: the number of commits so far,
    plus one when there are uncommitted source changes (the built files in docs/ and build/ don't count)."""
    try:
        git = lambda *a: subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        count = int(git("rev-list", "--count", "HEAD").strip())
        dirty = [l for l in git("status", "--porcelain").splitlines() if not l[3:].startswith(("docs/", "build/"))]
        return count + (1 if dirty else 0)
    except (OSError, subprocess.CalledProcessError, ValueError):
        return 0


def read(rel):
    return (SRC / rel).read_text()


def nav_html(subnav):
    links = "".join(f'<a href="#{v}" data-nav="{v}">{label}</a>' for v, label in NAV)
    subs = "".join(
        f'<div class="wrap sub" data-for="{view}" hidden>'
        + "".join(f'<a href="#{anchor}">{text}</a>' for anchor, text in items)
        + "</div>"
        for view, items in subnav.items())
    search = ('<button id="searchbtn" class="searchbtn" type="button" aria-label="Search the archive" aria-expanded="false" '
              'aria-controls="searchpanel" title="Search (/)"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/>'
              '<path d="M12.6 12.6 L17 17"/></svg></button>')
    return (f'<nav class="bar" aria-label="Archive"><div class="wrap">'
            f'<a class="brand" href="#archive">BR<span class="yrs"> · ARCHIVE</span></a>{links}{search}</div>{subs}</nav>'
            + read("shell/search.html"))


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

    number = build_number()
    today = datetime.datetime.now(ZoneInfo("Europe/Oslo"))
    build_label = f"Build {number:03d} · {today.day} {today:%b %Y}"
    stamp = f'<p class="build">{build_label}</p>'

    views = "".join(
        f'<div class="view" id="{v}" data-view="{v}"{"" if i == 0 else " hidden"}>{read(f"pages/{v}.html")}</div>'
        for i, v in enumerate(VIEWS))
    views = views.replace("</div></footer>", stamp + "</div></footer>")
    body = (nav_html(subnav)
            + hero_html(*heroes[VIEWS[0]])
            + f'<main id="top">{views}</main>')

    page = (f'<title>{TITLE}</title>\n'
            f'<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="build" content="{build_label}">\n'
            f'{read("shell/head.html")}'
            f'{FONTS}\n'
            f'<style>{css}</style>\n'
            f'<canvas id="rain" aria-hidden="true"></canvas>\n'
            f'<div class="scan" aria-hidden="true"></div>\n'
            f'{read("shell/player.html")}'
            f'{read("shell/fx.html").replace("__BUILD__", f"{number:03d}")}'
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
    # installable app: manifest, offline service worker and its registration (Pages copy only)
    standalone = standalone.replace('<meta name="theme-color"', '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color"', 1)
    standalone = standalone.replace("\n</body></html>", "\n<script>" + read("pwa/register.js") + "</script>\n</body></html>", 1)
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs" / "manifest.webmanifest").write_text(read("pwa/manifest.json").replace("__DESC__", DESCRIPTION))
    (ROOT / "docs" / "sw.js").write_text(read("pwa/sw.js").replace("__BUILD__", f"{number:03d}"))
    (ROOT / "docs" / "index.html").write_text(standalone)
    (ROOT / "docs" / ".nojekyll").write_text("")
    print(build_label)
    print(f"build/archive.html {len(page):,} bytes")
    print(f"docs/index.html    {len(standalone):,} bytes")


if __name__ == "__main__":
    build()
