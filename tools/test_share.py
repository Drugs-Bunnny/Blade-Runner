#!/usr/bin/env python3
"""Tests the "Copy link" buttons on the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_share.py

Checks that a story banner and an entry each copy a link that opens at that spot, that the button says
"Link copied" afterwards, and that no buttons appear when the page runs inside a frame (the Claude copy).
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


def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=base.rsplit("/", 1)[0])
        pg = ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))

        pg.goto(base + "#era1")
        pg.wait_for_timeout(700)
        for what, anchor, button in [
            ("entry", "i3", "#i3 .share-btn"),
            ("story banner", "tokyo", "#tokyo .vol-banner .share-btn"),
        ]:
            if not pg.locator(button).count():
                problems.append(f"{what}: no copy-link button found ({button})")
                continue
            pg.locator(button).first.scroll_into_view_if_needed()
            pg.locator(button).first.click()
            pg.wait_for_timeout(200)
            got = pg.evaluate("navigator.clipboard.readText()")
            if got != base + "#" + anchor:
                problems.append(f"{what}: copied {got!r}, expected {base + '#' + anchor!r}")
            label = pg.locator(button).first.text_content()
            if label != "Link copied":
                problems.append(f"{what}: button says {label!r} after copying, expected 'Link copied'")
            # the copied link must open at that spot in a fresh tab
            fresh = ctx.new_page()
            fresh.goto(got)
            fresh.wait_for_timeout(1200)
            top = fresh.evaluate(f"document.getElementById('{anchor}').getBoundingClientRect().top")
            hidden = fresh.evaluate(f"document.getElementById('{anchor}').closest('.view').hidden")
            if hidden or not (0 <= top < 400):
                problems.append(f"{what}: the copied link doesn't scroll to #{anchor} (view hidden: {hidden}, top: {top:.0f}px)")
            fresh.close()

        # inside a frame (how the Claude copy runs) there is no address to share, so no buttons
        framed = ctx.new_page()
        framed.set_content(f'<iframe src="{base}#era1" style="width:1200px;height:700px"></iframe>')
        framed.wait_for_timeout(1500)
        n = framed.frame_locator("iframe").locator(".share-btn").count()
        if n:
            problems.append(f"{n} copy-link button(s) appear inside a frame; there should be none")

        problems.extend(f"page error: {e}" for e in errors)
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("Share-link tests passed.")


if __name__ == "__main__":
    main()
