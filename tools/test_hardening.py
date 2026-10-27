#!/usr/bin/env python3
"""Tests two defensive checks on the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_hardening.py

1. A Voight-Kampff score in the browser's storage that isn't a plain number (here, a script tag) must not end
   up as markup in the page.
2. A sync setup code with a made-up gist id must be refused before anything is sent to GitHub.
"""
import base64
import functools
import http.server
import json
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


def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.set_default_timeout(20000)
        errors, github = [], []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        ctx.on("request", lambda r: github.append(r.url) if "github.com" in r.url else None)

        # 1. hostile stored score
        pg.goto(base + "#origins")
        pg.wait_for_timeout(500)
        ids = pg.evaluate("[...document.querySelectorAll('article.issue[id]')].map(a => a.id).filter(i => /^i[0-9]+$/.test(i))")
        pg.evaluate("""ids => { localStorage.setItem('br-read', JSON.stringify(ids));
            localStorage.setItem('br-vk', JSON.stringify({ i: '<img src=x onerror="window.__pwned=1">', tn: 3 })); }""", ids)
        pg.reload()
        pg.wait_for_timeout(1000)
        pg.goto(base + "#origins")
        pg.wait_for_timeout(800)
        if pg.evaluate("window.__pwned") is not None:
            problems.append("a script in a stored score ran")
        if pg.evaluate("document.querySelectorAll('.vk-btn img').length"):
            problems.append("a stored score was inserted into the page as markup")
        label = pg.evaluate("[...document.querySelectorAll('#origins .vk-btn, .vk-btn')].map(b => b.textContent).find(t => /Voight/.test(t))")
        if not label or "<" in label:
            problems.append(f"the test button shows {label!r}")

        # 2. made-up gist id in a setup code
        pg.evaluate("localStorage.clear()")
        pg.reload()
        pg.wait_for_timeout(800)
        code = "BRSYNC1." + base64.b64encode(json.dumps({"t": "ghp_notarealtoken", "g": "../user"}).encode()).decode()
        pg.evaluate("""() => { const b = [...document.querySelectorAll('button')].find(b => /^\\s*sync/i.test(b.textContent) && b.offsetParent); b.click(); }""")
        pg.wait_for_timeout(400)
        pg.fill(".syncdlg .sd-in", code)
        pg.click(".syncdlg .sd-go")
        pg.wait_for_timeout(800)
        msg = pg.evaluate("(document.querySelector('.syncdlg .sd-err') || {}).textContent || ''")
        if "doesn" not in msg:
            problems.append(f"a setup code with a made-up gist id was not refused (dialog says {msg!r})")
        if github:
            problems.append(f"a request went to GitHub for a refused setup code: {github[:3]}")
        if pg.evaluate("localStorage.getItem('br-sync-token')"):
            problems.append("a token was stored for a refused setup code")

        problems.extend(f"page error: {e}" for e in errors)
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("Hardening tests passed.")


if __name__ == "__main__":
    main()
