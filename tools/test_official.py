#!/usr/bin/env python3
"""Tests the links to official sources on the built site (docs/). Needs Playwright for Python with Chromium.

    python3 tools/test_official.py

Checks that every banner with a Titan Comics page links to it safely, that a trailer is only a button until it is
clicked (nothing is requested from YouTube before that), that a click puts the right video in a frame and a second
click removes it, and that the page has no errors or sideways scroll at phone width.
"""
import functools
import http.server
import pathlib
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


def expect(cond, msg):
    if not cond:
        problems.append(msg)


def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w, h in ((1280, 800), (390, 844)):
            pg = browser.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce").new_page()
            errors, outside = [], []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("request", lambda r: outside.append(r.url) if "youtube" in r.url or "ytimg" in r.url else None)
            pg.route("**/*youtube*/**", lambda route: route.fulfill(status=200, content_type="text/html", body="<html></html>"))
            for view in ("era1", "era2", "era3"):
                pg.goto(base + "#" + view); pg.wait_for_timeout(500)
            pg.goto(base + "#era1"); pg.wait_for_timeout(500)
            tag = f"{w}px"

            links = pg.eval_on_selector_all(".official a.off-link", "els => els.map(e => [e.href, e.target, e.rel, e.getAttribute('aria-label')])")
            expect(len(links) >= 8, f"{tag}: expected at least 8 official links, found {len(links)}")
            for href, target, rel, label in links:
                ok_host = href.startswith("https://titan-comics.com/comics/series/") or href.startswith("https://www.youtube.com/watch?v=")
                expect(ok_host, f"{tag}: unexpected official link {href}")
                expect(target == "_blank" and "noopener" in rel and "noreferrer" in rel, f"{tag}: {href} is missing target/rel")
                expect("opens in a new tab" in (label or ""), f"{tag}: {href} has no accessible label")
            expect(not outside, f"{tag}: the page asked YouTube for something before any click: {outside[:2]}")

            btn = pg.locator("#film82 .off-watch")
            expect(btn.count() == 1, f"{tag}: no trailer button on the 1982 film")
            btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(300)
            src = pg.eval_on_selector_all("#film82 .off-frame iframe", "els => els.map(e => e.src)")
            expect(len(src) == 1 and src[0].startswith("https://www.youtube-nocookie.com/embed/qoEyZoOTtss"), f"{tag}: bad trailer frame {src}")
            expect(btn.get_attribute("aria-expanded") == "true", f"{tag}: button not marked expanded")
            box = pg.locator("#film82 .off-frame").bounding_box()
            expect(box and box["width"] <= w, f"{tag}: trailer frame wider than the screen")
            btn.click(); pg.wait_for_timeout(200)
            expect(pg.locator("#film82 .off-frame iframe").count() == 0, f"{tag}: second click should remove the frame")

            expect(not pg.evaluate("document.documentElement.scrollWidth > innerWidth"), f"{tag}: sideways scroll")
            expect(not errors, f"{tag}: page errors {errors}")
            pg.context.close()
        browser.close()
    srv.shutdown()
    if problems:
        print("\n".join(problems)); raise SystemExit(1)
    print("Official-link tests passed.")


if __name__ == "__main__":
    main()
