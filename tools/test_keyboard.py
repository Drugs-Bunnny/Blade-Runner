#!/usr/bin/env python3
"""Keyboard test for the built site (docs/). Needs Playwright for Python with Chromium:

    pip install playwright && playwright install chromium
    python3 tools/test_keyboard.py

It drives the page with the keyboard only and checks:
  - the four modal dialogs (search, sync, ESPER image, Voight-Kampff test): focus moves into the dialog,
    Tab and Shift+Tab never leave it, Escape closes it, and focus goes back to the control that opened it
  - every control on the Lore and Character files pages shows a visible change when it has keyboard focus
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
    handler = functools.partial(Quiet, directory=str(DOCS))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}/index.html"


ACTIVE = """() => { const a = document.activeElement; if (!a || a === document.body) return null;
  const r = a.getBoundingClientRect();
  return { sig: a.tagName.toLowerCase() + '.' + (a.getAttribute('class') || '').split(' ')[0] + '#' + a.id, x: r.x, y: r.y, inDialog: !!a.closest('[role=dialog]') } }"""


def active(pg):
    return pg.evaluate(ACTIVE)


def mark_and_focus(pg, js_find):
    """Find the control with js_find (a JS expression), scroll it into view, focus it, return its description."""
    pg.evaluate(f"() => {{ const el = {js_find}; el.scrollIntoView({{block: 'center'}}); el.setAttribute('data-kbtest', '1'); }}")
    pg.wait_for_timeout(250)
    pg.focus("[data-kbtest]")
    d = active(pg)
    pg.evaluate("document.querySelector('[data-kbtest]').removeAttribute('data-kbtest')")
    return d


def check_dialog(pg, base, name, prepare, find_opener, is_closed):
    pg.goto(base + "#archive")
    pg.wait_for_timeout(400)
    if prepare:
        prepare(pg, base)
    opener = mark_and_focus(pg, find_opener)
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(500)
    d = active(pg)
    if not (d and d["inDialog"]):
        problems.append(f"{name}: focus did not move into the dialog")
    escapes = 0
    for key in ["Tab"] * 14 + ["Shift+Tab"] * 4:
        pg.keyboard.press(key)
        pg.wait_for_timeout(25)
        d = active(pg)
        escapes += not (d and d["inDialog"])
    if escapes:
        problems.append(f"{name}: Tab left the dialog {escapes} time(s)")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(500)
    if not pg.evaluate(is_closed):
        problems.append(f"{name}: Escape did not close the dialog")
    d = active(pg)
    if not (d and opener and d["sig"] == opener["sig"] and abs(d["x"] - opener["x"]) < 2):
        problems.append(f"{name}: focus did not return to the control that opened it (now on {d and d['sig']})")


def finish_origins(pg, base):
    """Mark all of Origins as read so its Voight-Kampff test unlocks."""
    pg.goto(base + "#origins")
    pg.wait_for_timeout(500)
    ids = pg.evaluate("[...document.querySelectorAll('article.issue[id]')].map(a => a.id).filter(i => /^i[0-9]+$/.test(i))")
    pg.evaluate("ids => localStorage.setItem('br-read', JSON.stringify(ids))", ids)
    pg.reload()
    pg.wait_for_timeout(700)
    pg.goto(base + "#origins")
    pg.wait_for_timeout(700)


def focus_visible(pg, base, view, limit=500):
    """Tab through a view; each control's pixels must change when it takes focus."""
    pg.goto(base + "#" + view)
    pg.wait_for_timeout(600)
    # forget what an earlier walk marked, or its stale marks end this one early
    pg.evaluate("document.querySelectorAll('[data-kb-seen]').forEach(e => delete e.dataset.kbSeen)")
    pg.evaluate("window.scrollTo(0, 0); document.activeElement.blur()")
    pg.keyboard.press("Tab")
    bad, count = {}, 0
    for _ in range(limit):
        info = pg.evaluate("""() => { const a = document.activeElement; if (!a || a === document.body) return null;
            if (a.dataset.kbSeen) return { done: true }; a.dataset.kbSeen = '1'; a.scrollIntoView({ block: 'center' });
            const r = a.getBoundingClientRect();
            return { sig: a.tagName.toLowerCase() + '.' + (a.getAttribute('class') || '').split(' ')[0], x: r.x, y: r.y, w: r.width, h: r.height,
                     label: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 24), inDialog: !!a.closest('[role=dialog]') } }""")
        if info is None:
            pg.keyboard.press("Tab")
            continue
        if info.get("done"):
            break
        count += 1
        vp = pg.viewport_size
        x0, y0 = max(0, info["x"] - 10), max(0, info["y"] - 10)
        clip = {"x": x0, "y": y0, "width": min(vp["width"] - x0, info["w"] + 20), "height": min(vp["height"] - y0, info["h"] + 20)}
        if clip["width"] >= 2 and clip["height"] >= 2 and info["w"] >= 1 and not info["inDialog"]:
            pg.wait_for_timeout(50)
            with_focus = pg.screenshot(clip=clip)
            pg.evaluate("document.activeElement.blur()")
            pg.wait_for_timeout(50)
            if with_focus == pg.screenshot(clip=clip):
                bad.setdefault(info["sig"], []).append(info["label"])
        pg.evaluate("() => { const e = [...document.querySelectorAll('[data-kb-seen]')].pop(); e.focus({ preventScroll: true }) }")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(10)
    for sig, labels in bad.items():
        problems.append(f"{view}: {len(labels)} {sig} control(s) show no visible focus, e.g. {labels[:3]}")
    if count < 20:
        problems.append(f"{view}: only {count} focusable controls found; the test may not be reaching the page")


def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        pg = ctx.new_page()
        page_errors = []
        pg.on("pageerror", lambda e: page_errors.append(str(e)))

        check_dialog(pg, base, "search", None, "document.getElementById('searchbtn')",
                     "document.getElementById('searchpanel').hidden")
        check_dialog(pg, base, "sync", None,
                     "[...document.querySelectorAll('button')].find(b => /^\\s*sync/i.test(b.textContent) && b.offsetParent)",
                     "document.querySelector('.syncdlg').hidden")
        check_dialog(pg, base, "ESPER image", lambda pg, b: pg.goto(b + "#era1"),
                     "document.querySelector('#origins canvas.cover')",
                     "document.getElementById('esper').hidden")
        check_dialog(pg, base, "Voight-Kampff test", finish_origins,
                     "[...document.querySelectorAll('button')].find(b => /Take the Voight-Kampff/.test(b.textContent) && b.offsetParent)",
                     "document.getElementById('vk').hidden")
        pg.evaluate("localStorage.clear()")
        for view in ("lore", "people"):
            focus_visible(pg, base, view)
        problems.extend(f"page error: {e}" for e in page_errors)
        browser.close()
    srv.shutdown()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("Keyboard tests passed.")


if __name__ == "__main__":
    main()
