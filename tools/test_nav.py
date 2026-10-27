#!/usr/bin/env python3
"""Tests the wayfinding features on the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_nav.py

Checks, at phone and desktop width: the sub-menu is short, grouped, and marks where you are; each long
story has a sticky strip of entry numbers that sits under the top bar, marks the current entry and jumps
to one cleanly; the back-to-top button appears after scrolling and works; the player can shrink to a
button, starts shrunk on a phone, and remembers the choice; and nothing makes the page scroll sideways.
"""
import functools
import http.server
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"
problems = []


def check(ok, msg):
    if not ok:
        problems.append(msg)
        print("FAIL:", msg)


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(DOCS)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}/index.html"


def geometry(pg, entry):
    return pg.evaluate("""(id) => {
        const nav = document.querySelector('nav.bar').getBoundingClientRect(), a = document.getElementById(id),
              strip = a.closest('section').querySelector('.strip').getBoundingClientRect(), r = a.getBoundingClientRect();
        return { navBottom: nav.bottom, stripTop: strip.top, stripBottom: strip.bottom, entryTop: r.top };
    }""", entry)


def run(browser, url, width, height, label):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url + "#era1")
    pg.wait_for_timeout(1200)

    # sub-menu: short labels, a group divider, and no repeated "Origins" prefix
    labels = pg.evaluate("[...document.querySelectorAll('nav.bar .sub[data-for=era1] a')].map(a => a.textContent)")
    check(not any(t.startswith("Origins ") for t in labels), f"{label}: sub-menu labels still repeat 'Origins': {labels}")
    check(pg.evaluate("document.querySelectorAll('nav.bar .sub[data-for=era1] .sep').length") >= 2, f"{label}: sub-menu has no group dividers")

    # the strip: one per volume, under the top bar, with the entry numbers
    n = pg.evaluate("document.querySelectorAll('#vol2 .strip a').length")
    check(n == 4, f"{label}: Origins volume 2 strip has {n} links, expected 4")
    pg.click('#vol2 .strip a[href="#i7"]')
    pg.wait_for_timeout(900)
    g = geometry(pg, "i7")
    check(abs(g["stripTop"] - g["navBottom"]) <= 2, f"{label}: strip is not stuck under the top bar ({g})")
    check(g["entryTop"] >= g["stripBottom"] - 2, f"{label}: jumped entry hides under the strip ({g})")
    check(g["entryTop"] < g["stripBottom"] + 60, f"{label}: jumped entry landed too far down ({g})")
    cur = pg.evaluate("[...document.querySelectorAll('#vol2 .strip a[aria-current]')].map(a => a.getAttribute('href'))")
    check(cur == ["#i7"], f"{label}: strip marks {cur} instead of #i7")
    here = pg.evaluate("[...document.querySelectorAll('nav.bar .sub:not([hidden]) a[aria-current]')].map(a => a.getAttribute('href'))")
    check(here == ["#vol2"], f"{label}: sub-menu marks {here} instead of #vol2")

    # Black Lotus mixes anime episodes with two comics: the strip separates them and names the comic
    seps = pg.evaluate("document.querySelectorAll('#lotus .strip .sep').length")
    check(seps == 2, f"{label}: Black Lotus strip has {seps} dividers, expected 2")
    named = pg.evaluate("document.querySelector('#lotus .strip a[href=\"#ll1\"]').getAttribute('aria-label')")
    check("Leaving L.A." in named, f"{label}: comic entries in the Black Lotus strip are not named ({named})")

    # reading marks the entry in the strip
    pg.click("#i7 .rd-mark")
    check(pg.evaluate("document.querySelector('#vol2 .strip a[href=\"#i7\"]').classList.contains('done')"), f"{label}: strip does not show a read entry")

    # back to top
    check(pg.evaluate("!document.getElementById('totop').hidden"), f"{label}: back-to-top button missing deep in the page")
    pg.click("#totop")
    pg.wait_for_timeout(500)
    check(pg.evaluate("window.pageYOffset") < 5, f"{label}: back-to-top did not reach the top")
    check(pg.evaluate("document.getElementById('totop').hidden"), f"{label}: back-to-top button still showing at the top")

    # the player
    start_min = pg.evaluate("document.getElementById('score').classList.contains('min')")
    check(start_min == (width <= 700), f"{label}: player starts {'shrunk' if start_min else 'open'}")
    pg.click("#scoremin")
    flipped = pg.evaluate("document.getElementById('score').classList.contains('min')")
    check(flipped != start_min, f"{label}: the player button does not toggle")
    check(pg.evaluate("document.getElementById('scoremin').getAttribute('aria-expanded')") == ("false" if flipped else "true"), f"{label}: aria-expanded is wrong")
    shown = pg.evaluate("getComputedStyle(document.getElementById('scoreprev')).display !== 'none'")
    check(shown == (not flipped), f"{label}: shrinking the player does not hide its controls")
    pg.reload()
    pg.wait_for_timeout(800)
    check(pg.evaluate("document.getElementById('score').classList.contains('min')") == flipped, f"{label}: the player's state is not remembered")

    # keyboard reach and no sideways scroll
    pg.focus("#scoremin")
    check(pg.evaluate("document.activeElement.id") == "scoremin", f"{label}: the player button cannot take focus")
    check(pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"{label}: the page scrolls sideways")
    check(not errors, f"{label}: page errors: {errors}")
    ctx.close()


def main():
    srv, url = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        run(browser, url, 390, 800, "phone")
        run(browser, url, 1280, 800, "desktop")
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s)")
        sys.exit(1)
    print("Navigation tests passed.")


if __name__ == "__main__":
    main()
