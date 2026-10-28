"""Render the preview card, icons and README screenshots into docs/.

Needs Python Playwright with Chromium. Run after `python3 build.py`:
    python3 tools/make_images.py [path/to/fontsource/node_modules/@fontsource]
With the optional fonts folder (npm i @fontsource/jost @fontsource/sorts-mill-goudy @fontsource/michroma @fontsource/barlow
@fontsource/share-tech-mono), images render in the site's real typefaces even
without access to Google Fonts.
"""
import functools, http.server, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FONTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
FACES = [("Jost", 500, "jost/files/jost-latin-500-normal.woff2"),
         ("Jost", 600, "jost/files/jost-latin-600-normal.woff2"),
         ("Jost", 700, "jost/files/jost-latin-700-normal.woff2"),
         ("Barlow", 400, "barlow/files/barlow-latin-400-normal.woff2"),
         ("Barlow", 500, "barlow/files/barlow-latin-500-normal.woff2"),
         ("Barlow", 600, "barlow/files/barlow-latin-600-normal.woff2"),
         ("Share Tech Mono", 400, "share-tech-mono/files/share-tech-mono-latin-400-normal.woff2")]


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}"


def with_fonts(page, base):
    if not FONTS:
        return
    css = "".join(f"@font-face{{font-family:'{f}';font-weight:{wt};src:url({base}/__font/{i}) format('woff2')}}"
                  for i, (f, wt, _) in enumerate(FACES))
    page.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=css))
    page.route("**/__font/*", lambda r: r.fulfill(status=200, content_type="font/woff2",
                                                    body=(FONTS / FACES[int(r.request.url.rsplit('/', 1)[1])][2]).read_bytes()))
    page.add_init_script(f"document.addEventListener('DOMContentLoaded',function(){{var s=document.createElement('style');s.textContent={css!r};document.head.appendChild(s)}})")


def shot(browser, base, url, path, w, h, prep=None, wait=1500, dpr=1):
    page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=dpr)
    with_fonts(page, base)
    page.goto(base + url)
    page.wait_for_timeout(400)
    if prep:
        page.evaluate(prep)
    page.wait_for_timeout(wait)
    page.screenshot(path=str(path))
    page.close()
    print("wrote", path.relative_to(ROOT))


def main():
    srv, base = serve()
    (DOCS / "img").mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        shot(b, base, "/tools/og-card.html", DOCS / "img/preview.png", 1200, 630)
        icon = (ROOT / "src/shell/icon.svg").read_text()
        page = b.new_page(viewport={"width": 180, "height": 180})
        page.set_content(f"<style>html,body{{margin:0;background:#070910}}svg{{width:180px;height:180px;display:block}}</style>{icon}")
        page.screenshot(path=str(DOCS / "img/icon-180.png")); page.close(); print("wrote docs/img/icon-180.png")
        # app icons: plain at 192 and 512, and a maskable one with the eye inside the safe zone
        for size, name, css in [(32, "favicon-32.png", "html,body{background:transparent}"), (192, "icon-192.png", ""), (512, "icon-512.png", ""),
                                (512, "icon-maskable-512.png", "svg{transform:scale(.72)} svg rect{rx:0}")]:
            page = b.new_page(viewport={"width": size, "height": size})
            page.set_content(f"<style>html,body{{margin:0;background:#070910;overflow:hidden}}svg{{width:{size}px;height:{size}px;display:block}}{css}</style>{icon}")
            page.screenshot(path=str(DOCS / "img" / name), omit_background=name.startswith("favicon")); page.close(); print(f"wrote docs/img/{name}")
        hide = "document.documentElement.style.scrollBehavior='auto';"
        shot(b, base, "/docs/index.html", DOCS / "img/screen-hub.png", 1280, 800)
        shot(b, base, "/docs/index.html#lotus", DOCS / "img/screen-era.png", 1280, 800, prep=hide, wait=2200)
        shot(b, base, "/docs/index.html#p-ash", DOCS / "img/screen-files.png", 1280, 800, prep=hide, wait=2200)
        shot(b, base, "/docs/index.html#i6", DOCS / "img/screen-phone.png", 390, 844, prep=hide, wait=2200, dpr=2)
        shot(b, base, "/docs/index.html#timeline", DOCS / "img/screen-lore.png", 1280, 800, prep=hide, wait=2200)
        b.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
