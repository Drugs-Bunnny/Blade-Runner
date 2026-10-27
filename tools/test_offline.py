#!/usr/bin/env python3
"""Offline test for the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_offline.py

Visits the site once so the service worker can cache it, then switches the network off and checks that
the page reloads, every view still works, the fonts are served from the site, nothing was fetched from
another site, and every file the page asked for came from the cache.
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
    # the app only registers its service worker on https or on "localhost" (not 127.0.0.1)
    return srv, f"http://localhost:{srv.server_port}"


def main():
    srv, origin = serve()
    base = origin + "/index.html"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.set_default_timeout(20000)
        errors, external, failed = [], [], []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("request", lambda r: external.append(r.url) if not r.url.startswith((origin, "data:", "blob:")) else None)

        # online: let the service worker install, take control and fill its cache
        pg.goto(base)
        pg.wait_for_timeout(500)
        ready = pg.evaluate("navigator.serviceWorker ? Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 8000))]) : false")
        if not ready:
            problems.append("the service worker did not become ready")
        pg.reload()
        pg.wait_for_timeout(1500)
        cached = pg.evaluate("""async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k);
            out[k] = (await c.keys()).map(r => new URL(r.url).pathname); } return out; }""")
        names = [k for k in cached if k.startswith("br-archive-")]
        if len(names) != 1:
            problems.append(f"expected one br-archive cache, found {list(cached)}")
        else:
            files = cached[names[0]]
            fonts = [f for f in files if f.startswith("/fonts/")]
            if len(fonts) < 10:
                problems.append(f"only {len(fonts)} fonts in the offline cache; expected all 10")
        # everything the page loaded online must be in the cache too
        loaded = pg.evaluate("performance.getEntriesByType('resource').map(r => new URL(r.name).pathname)")
        have = set(sum(cached.values(), []))
        missing = sorted({u for u in loaded if u not in have and u != "/sw.js"})
        if missing:
            problems.append(f"loaded online but not cached for offline use: {missing}")

        # offline: reload, and visit each view
        ctx.set_offline(True)
        pg.on("requestfailed", lambda r: failed.append(r.url))
        pg.goto(base)
        pg.wait_for_timeout(1500)
        title = pg.title()
        if "Blade Runner" not in title:
            problems.append(f"offline reload gave a page titled {title!r}")
        for view, probe in [("era1", "#origins .vol-banner"), ("era2", "#lotus"), ("era3", "#film49"),
                            ("people", ".dossier"), ("lore", ".tl-year")]:
            pg.goto(base + "#" + view)
            pg.wait_for_timeout(600)
            shown = pg.evaluate(f"(() => {{ const v = document.getElementById('{view}'); return !!v && !v.hidden && !!v.querySelector('{probe}') || !!document.querySelector('#{view}{probe}') }})()")
            if not shown:
                problems.append(f"offline: the {view} view did not render")
        fonts_ok = pg.evaluate("document.fonts.check('700 16px \"Chakra Petch\"') && document.fonts.check('16px Barlow') && document.fonts.check('16px \"Share Tech Mono\"')")
        if not fonts_ok:
            problems.append("offline: the fonts are not available")
        loaded_fonts = pg.evaluate("[...document.fonts].filter(f => f.status === 'loaded').length")
        if loaded_fonts < 3:
            problems.append(f"offline: only {loaded_fonts} font faces loaded")
        if failed:
            problems.append(f"offline: requests failed: {sorted(set(failed))[:5]}")
        if external:
            problems.append(f"requests to other sites: {sorted(set(external))[:5]}")
        problems.extend(f"page error: {e}" for e in errors)
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("Offline tests passed.")


if __name__ == "__main__":
    main()
