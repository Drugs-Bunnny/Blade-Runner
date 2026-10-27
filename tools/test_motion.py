#!/usr/bin/env python3
"""Tests the "Calm" (reduce motion) chip on the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_motion.py

Checks that the rain animates by default; that the chip stills it, marks <html>, is remembered after a
reload, and sets it moving again when switched off; and that a device set to reduce motion starts calm
with the chip on and locked.
"""
import functools
import http.server
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"
problems = []


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(DOCS)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}/index.html"


def frames(pg, n=4, gap=350):
    """Return the rain canvas as a data URL, n times, gap ms apart."""
    out = []
    for _ in range(n):
        out.append(pg.evaluate("document.getElementById('rain').toDataURL()"))
        pg.wait_for_timeout(gap)
    return out


def moving(pg):
    return len(set(frames(pg))) > 1


def state(pg):
    return pg.evaluate("""() => { const b = document.getElementById('scoremotion');
        return { attr: document.documentElement.getAttribute('data-motion'), pressed: b && b.getAttribute('aria-pressed'),
                 disabled: b && b.disabled, stored: localStorage.getItem('br-motion') } }""")


def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # a device that doesn't ask for reduced motion
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="no-preference")
        pg = ctx.new_page()
        pg.set_default_timeout(20000)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(base)
        pg.wait_for_timeout(1200)
        s = state(pg)
        if s["attr"] is not None or s["pressed"] != "false" or s["disabled"]:
            problems.append(f"default state wrong: {s}")
        if not moving(pg):
            problems.append("the rain is not animating by default")

        pg.click("#scoremotion")
        pg.wait_for_timeout(600)
        s = state(pg)
        if s["attr"] != "reduced" or s["pressed"] != "true" or s["stored"] != "reduced":
            problems.append(f"after turning Calm on: {s}")
        if moving(pg):
            problems.append("the rain keeps moving after Calm is switched on")

        pg.reload()
        pg.wait_for_timeout(1200)
        s = state(pg)
        if s["attr"] != "reduced" or s["pressed"] != "true":
            problems.append(f"Calm was not remembered after a reload: {s}")
        if moving(pg):
            problems.append("the rain moves after a reload with Calm on")
        # smooth scrolling is motion too: jumping to a story should not animate
        sb = pg.evaluate("getComputedStyle(document.documentElement).scrollBehavior")
        if sb != "auto":
            problems.append(f"scroll-behavior is {sb!r} with Calm on")

        pg.click("#scoremotion")
        pg.wait_for_timeout(800)
        s = state(pg)
        if s["attr"] is not None or s["pressed"] != "false" or s["stored"] is not None:
            problems.append(f"after turning Calm off: {s}")
        if not moving(pg):
            problems.append("the rain does not start again after Calm is switched off")
        ctx.close()

        # a device that asks for reduced motion
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        pg2 = ctx.new_page()
        pg2.set_default_timeout(20000)
        pg2.on("pageerror", lambda e: errors.append(str(e)))
        pg2.goto(base)
        pg2.wait_for_timeout(1200)
        s = state(pg2)
        if s["attr"] != "reduced" or s["pressed"] != "true" or not s["disabled"]:
            problems.append(f"device set to reduce motion: expected calm with the chip on and locked, got {s}")
        if moving(pg2):
            problems.append("the rain moves on a device set to reduce motion")
        ctx.close()

        problems.extend(f"page error: {e}" for e in errors)
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("Motion tests passed.")


if __name__ == "__main__":
    main()
