import re, pathlib, sys
here = pathlib.Path(__file__).parent
SRC = here / "src"
src = (SRC / "origins.html").read_text()

css = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
score_js = (SRC / "score.js").read_text()
art_js = (SRC / "art.js").read_text()
js = re.search(r"<script>(.*?)</script>", src, re.S).group(1).replace("for (var i = 0; i < 48; i++) {", "for (var i = 0; g && i < 48; i++) {")
main = re.search(r'<main id="top">(.*?)</main>', src, re.S).group(1)
# drop the old reading-order block from the Origins themes section
main, n = re.subn(r'\s*<div style="margin-top:64px" id="order">.*?separate timeline\.</p>\s*</div>', "", main, flags=re.S)
assert n == 1, "order block not found"
origins_sources = re.search(r"<footer>.*?<ul>(.*?)</ul>", src, re.S).group(1)

css += r"""
body { margin: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chips span { font-family: var(--font-mono); font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink); border: 1px solid var(--line); background: rgba(7,9,16,.6); padding: 3px 9px; }
.arc { font-family: var(--font-display); font-size: clamp(1rem, 2.4vw, 1.2rem); color: var(--c); letter-spacing: .1em; text-transform: uppercase; margin: 44px 0 18px; padding-left: 12px; border-left: 3px solid var(--c); }
.arc:first-of-type { margin-top: 8px; }
.note { border: 1px dashed var(--c); padding: 20px clamp(16px, 3vw, 28px); margin-top: 22px; background: var(--deep); }
.note p { margin: 10px 0 0; max-width: 68ch; }
.note strong { color: var(--amber); font-weight: 600; }
.dimline { color: var(--dim); font-size: .9rem; }
.issue em { font-style: italic; }
nav.bar .sub { border-top: 1px solid var(--line); flex-wrap: nowrap; overflow-x: auto; padding-block: 8px; scrollbar-width: none; }
nav.bar .sub a { white-space: nowrap; font-size: .74rem; }
nav.bar a[aria-current="page"] { color: var(--amber); text-shadow: 0 0 10px var(--glow-amber); }
.eras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
@media (max-width: 860px) { .eras { grid-template-columns: minmax(0, 1fr); } }
.era-card { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 26px 22px 22px; text-decoration: none; color: var(--ink); background: radial-gradient(ellipse at 100% 0%, var(--g), transparent 60%), var(--deep); border: 1.5px solid var(--c); border-radius: 6px; box-shadow: 0 0 26px -10px var(--g); transition: transform .2s, box-shadow .2s; overflow: hidden; }
.era-card:hover { transform: translateY(-3px); box-shadow: 0 0 40px -6px var(--g); }
.era-card .roman { position: absolute; right: 16px; top: 2px; font-family: var(--font-display); font-weight: 700; font-size: 5.5rem; line-height: 1; color: var(--c); opacity: .18; }
.era-card .years { font-family: var(--font-mono); letter-spacing: .16em; color: var(--c); font-size: .85rem; }
.era-card h3 { font-size: 1.6rem; letter-spacing: .03em; }
.era-card p { margin: 0; color: var(--dim); font-size: .95rem; }
.era-card ul { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 4px; font-size: .92rem; }
.era-card li::before { content: "▸ "; color: var(--c); }
.era-card .go { margin-top: auto; padding-top: 16px; font-family: var(--font-mono); font-size: .8rem; letter-spacing: .14em; text-transform: uppercase; color: var(--c); }
.chrono h3 a { color: var(--ink); text-decoration: none; }
.chrono h3 a:hover { color: var(--amber); }
.pager { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-block: 0 60px; }
.pager a { font-family: var(--font-mono); letter-spacing: .12em; text-transform: uppercase; font-size: .85rem; text-decoration: none; border: 1px solid var(--line); padding: 12px 16px; background: var(--deep); color: var(--ink); }
.pager a:hover { border-color: var(--amber); color: var(--amber); }

#score { position: fixed; z-index: 20; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; gap: 6px; padding: 8px 14px 8px 8px; max-width: calc(100vw - 32px); background: rgba(7,9,16,.92); border: 1px solid var(--line); border-radius: 14px; backdrop-filter: blur(8px); box-shadow: 0 6px 30px rgba(0,0,0,.5); }
#score.playing { border-color: var(--amber); box-shadow: 0 0 24px -6px var(--glow-amber), 0 6px 30px rgba(0,0,0,.5); }
#score .sb { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line); background: var(--deep); color: var(--ink); cursor: pointer; padding: 0; }
#score .sb svg { width: 13px; height: 13px; fill: currentColor; }
#score .sb:hover { color: var(--amber); border-color: var(--amber); }
#score .sb.main { width: 46px; height: 46px; position: relative; border-color: var(--amber); color: var(--amber); }
#score .sb.main .t { font-size: .95rem; position: relative; z-index: 1; }
#score .eq { position: absolute; inset: 9px; display: none; align-items: flex-end; gap: 2px; opacity: .35; }
#score.playing .eq { display: flex; }
#score .eq i { flex: 1; height: 30%; background: var(--amber); border-radius: 1px; animation: eq 1.6s ease-in-out infinite; }
#score .eq i:nth-child(2) { animation-delay: -.5s; } #score .eq i:nth-child(3) { animation-delay: -1s; } #score .eq i:nth-child(4) { animation-delay: -.25s; }
@keyframes eq { 0%,100% { height: 25%; } 50% { height: 100%; } }
#score .meta { display: grid; gap: 4px; margin-left: 6px; min-width: 0; }
#scoretitle { font-family: var(--font-display); font-size: .86rem; color: var(--amber); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
#score .row { display: flex; align-items: center; gap: 8px; }
#scorevol { width: 96px; accent-color: var(--amber); }
#score .chip { font-family: var(--font-mono); font-size: .66rem; letter-spacing: .12em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); background: none; color: var(--dim); cursor: pointer; }
#score .chip[aria-pressed="true"] { color: var(--cyan); border-color: var(--cyan); box-shadow: 0 0 8px -2px var(--glow-cyan); }
#scorehint { font-family: var(--font-mono); font-size: .62rem; letter-spacing: .08em; color: var(--dim); }
@media (max-width: 520px) { #scorevol, #scorehint { display: none; } #scoretitle { max-width: 120px; } }
@media (prefers-reduced-motion: reduce) { #score .eq i { animation: none; height: 70%; } }

.vol-banner.has-cover { display: grid; grid-template-columns: minmax(0, 1fr) clamp(150px, 22vw, 210px); gap: 28px; align-items: center; }
.vol-banner .bt { min-width: 0; position: relative; }
.vol-banner.has-cover .jp { right: auto; left: 46%; }
canvas.cover { width: 100%; height: auto; aspect-ratio: 3 / 4; max-width: 100%; display: block; border-radius: 3px; box-shadow: 0 10px 40px -12px var(--g), 0 0 0 1px rgba(255,255,255,.04); transform: rotate(1.2deg); }
.posters { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); gap: 16px; }
.poster { text-decoration: none; color: var(--ink); display: grid; gap: 8px; }
.poster canvas { width: 100%; height: auto; aspect-ratio: 3 / 4; display: block; border-radius: 3px; box-shadow: 0 8px 28px -14px rgba(0,0,0,.9); transition: transform .25s, box-shadow .25s; }
.poster:hover canvas, .poster:focus-visible canvas { transform: translateY(-4px) rotate(-1deg); box-shadow: 0 14px 34px -10px rgba(255,179,71,.45); }
.poster span { font-family: var(--font-mono); font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); }
@media (max-width: 640px) {
  .vol-banner.has-cover { grid-template-columns: minmax(0, 1fr); gap: 18px; }
  canvas.cover { order: -1; width: 62%; max-width: 220px; transform: none; }
  .posters { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
}

html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
.hero p.lede { text-shadow: 0 1px 12px rgba(7,9,16,.9), 0 0 2px rgba(7,9,16,.9); }
@media (max-width: 640px) {
  body { font-size: 17.5px; line-height: 1.7; padding-bottom: 96px; }
  #rain { opacity: .22; }
  .scan { display: none; }
  .hero .wrap { padding-block: 56px 120px; }
  .hero h1 { font-size: clamp(2.3rem, 13vw, 3.4rem); letter-spacing: .05em; }
  .hero h1 span { letter-spacing: .3em; }
  .hero p.lede { font-size: 1.05rem; background: rgba(7,9,16,.55); padding: 10px 12px; margin-left: -12px; margin-right: -12px; border-radius: 4px; }
  #city { opacity: .7; }
  nav.bar .wrap { gap: 4px 14px; padding-block: 8px; }
  nav.bar a { letter-spacing: .08em; font-size: .78rem; padding-block: 4px; }
  nav.bar .yrs { display: none; }
  section { padding-block: 44px; }
  .sec-head h2 { font-size: 1.7rem; }
  .vol-banner { padding: 22px 16px; margin-bottom: 24px; }
  .vol-banner .jp { display: none; }
  .vol-banner .num { font-size: 2.4rem; }
  .vol-banner h2 { letter-spacing: .14em; font-size: 1.35rem; }
  .vol-banner p { color: var(--ink); font-size: 1rem; }
  .chips span { font-size: .68rem; letter-spacing: .06em; }
  .issues { gap: 14px; }
  .issue { padding: 18px 16px; background: var(--deep); gap: 6px; }
  .issue .no { display: flex; align-items: baseline; gap: 10px; font-size: 1.6rem; }
  .issue .no small { margin-top: 0; font-size: .68rem; }
  .issue h3 { font-size: 1.3rem; }
  .issue p { margin-bottom: 14px; }
  .arc { margin: 32px 0 14px; font-size: .95rem; letter-spacing: .06em; }
  .file { grid-template-columns: 64px minmax(0,1fr); gap: 12px; padding: 14px; }
  .photo { width: 64px; height: 82px; } .photo svg { width: 52px; height: 64px; }
  .file::after { position: static; display: block; grid-column: 1 / -1; order: -1; margin-bottom: -4px; }
  .file h3 { margin-top: 0; }
  .broadcast blockquote { font-size: 1.2rem; }
  .theme { padding: 16px; }
  .empathy { grid-template-columns: minmax(0, 1fr); }
  .eye { max-width: 260px; margin: 0 auto; display: block; }
  .readout li { grid-template-columns: 16px minmax(0,1fr); }
  .readout li span { grid-column: 2; }
  .chrono::before { left: 60px; }
  .chrono li { grid-template-columns: 48px 24px minmax(0, 1fr); }
  .chrono li::after { left: 54px; }
  .chrono b { font-size: .95rem; }
  .era-card { padding: 20px 16px; }
  .era-card .roman { font-size: 4rem; }
  .pager a { flex: 1 1 140px; text-align: center; }
  footer ul { columns: 1; }
  #score { left: calc(10px + env(safe-area-inset-left, 0px)); right: calc(10px + env(safe-area-inset-right, 0px)); bottom: calc(10px + env(safe-area-inset-bottom, 0px)); max-width: none; padding: 6px 10px 6px 6px; }
  #score .meta { flex: 1; }
  #scoretitle { max-width: none; font-size: .8rem; }
  #score .sb { width: 38px; height: 38px; }
  #score .sb.main { width: 44px; height: 44px; }
}
"""

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Share+Tech+Mono&display=swap">'
EXTRA_ROOT = ":root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)} img{max-width:100%} [hidden]{display:none!important}"

ERAS = [("index.html", "Archive"), ("era1.html", "Era I<span class=\"yrs\"> · 2009–2019</span>"), ("era2.html", "Era II<span class=\"yrs\"> · 2022–2039</span>"), ("era3.html", "Era III<span class=\"yrs\"> · 2048–2099</span>")]

def nav(current, sub):
    links = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>' for h, t in ERAS[1:])
    subrow = ""
    if sub:
        subrow = '<div class="wrap sub">' + "".join(f'<a href="#{i}">{t}</a>' for i, t in sub) + "</div>"
    return f'<nav class="bar" aria-label="Archive"><div class="wrap"><a class="brand" href="index.html">BR · ARCHIVE</a>{links}</div>{subrow}</nav>'

def hero(kicker, h1, span, lede, signs):
    s = "".join(f'<div class="sign {c}">{t}</div>' for c, t in signs)
    return f'''<header class="hero">
  <canvas id="city" aria-hidden="true"></canvas>
  <div class="signs" aria-hidden="true">{s}</div>
  <div class="wrap">
    <div class="label kicker">{kicker}</div>
    <h1 class="flicker">{h1}<span>{span}</span></h1>
    <p class="lede">{lede}</p>
    <div class="spoiler">FULL SPOILERS</div>
  </div>
</header>'''

def footer(sources):
    return f'<footer><div class="wrap"><div class="label">Sources</div><ul>{sources}</ul><p>An unofficial fan synopsis. Blade Runner is owned by Alcon Entertainment; the comics are published by Titan Comics.</p></div></footer>'

def pager(prev, nxt):
    a = f'<a href="{prev[0]}">← {prev[1]}</a>' if prev else "<span></span>"
    b = f'<a href="{nxt[0]}">{nxt[1]} →</a>' if nxt else "<span></span>"
    return f'<div class="wrap pager">{a}{b}</div>'

def page(title, body, full):
    head = f"<title>{title}</title>\n<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n{FONTS}\n<style>{css}{EXTRA_ROOT if full else ''}</style>"
    content = f'{head}\n<canvas id="rain" aria-hidden="true"></canvas>\n<div class="scan" aria-hidden="true"></div>\n<div id="score" role="region" aria-label="Ambient score player"><button id="scoreprev" class="sb" type="button" aria-label="Previous track"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="2" height="10"/><polygon points="14,3 5,8 14,13"/></svg></button><button id="scorebtn" class="sb main" type="button" aria-pressed="false" aria-label="Play score"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="t">▶</span></button><button id="scorenext" class="sb" type="button" aria-label="Next track"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="12" y="3" width="2" height="10"/><polygon points="2,3 11,8 2,13"/></svg></button><div class="meta"><span id="scoretitle">01 / 05</span><div class="row"><input id="scorevol" type="range" min="0" max="1" step="0.01" value="0.6" aria-label="Volume"><button id="scorerain" class="chip" type="button" aria-pressed="true">Rain</button></div><span id="scorehint">Original score</span></div></div>\n{body}\n<script>{js}\n{score_js}\n{art_js}</script>'
    if full:
        return f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n{content.replace("<canvas id=\"rain\"", "</head><body><canvas id=\"rain\"", 1)}\n</body></html>'
    return content

def L(url, text):
    return f'<li><a href="{url}" target="_blank" rel="noopener">{text}</a></li>'

def wiki(slug, text):
    return L(f"https://bladerunner.fandom.com/wiki/{slug}", f"Off-world Wiki: {text}")

# ---------- hub
hub = (nav("index.html", None)
       + hero("Los Angeles · 2009 – 2099 · Case archive", "BLADE RUNNER", "ARCHIVE",
              "Every comic, film, short and anime in the Blade Runner saga, told in story order across three eras. From the first Blade Runner to the city fifty years after K.",
              [("p", "レプリカント"), ("c", "ロサンゼルス")])
       + '<main id="top">' + (SRC / "hub_body.html").read_text() + "</main>"
       + footer(L("https://www.avpcentral.com/blade-runner-timeline", "AvP Central: Blade Runner timeline 2009–2099")
                + L("https://www.howtolovecomics.com/2025/06/04/blade-runner-comics-universe-chronological-reading-order/", "How to Love Comics: comics reading order")
                + L("https://titan-comics.com/c/2085-blade-runner-tokyo-nexus/", "Titan Comics: Tokyo Nexus")
                + L("https://www.thepopverse.com/tv-blade-runner-2099-prime-video-release-date/", "Popverse: Blade Runner 2099 release date")))

# ---------- era 1
origins_banner = '''<section id="origins" style="padding-block-end:0">
  <div class="wrap">
    <div class="vol-banner" style="--c:var(--amber);--g:var(--glow-amber)"><span class="jp" aria-hidden="true">起源</span><div class="num">2009</div><h2>Blade Runner: Origins</h2>
      <div class="chips"><span>Comic · 12 issues</span><span>Vols. Products · Scrap · Burning</span><span>K. Perkins · Mellow Brown · Fernando Dagnino</span></div>
      <p>How a burnt-out detective, a faked suicide and a sister in a borrowed body created the first Blade Runner.</p></div>
  </div>
</section>'''
era1_sources = (origins_sources
    + "".join(wiki(f"Blade_Runner_2019_{i}", f"2019 #{i}") for i in (1, 3, 4, 8, 12))
    + wiki("Blade_Runner:_Tokyo_Nexus_3", "Tokyo Nexus #3") + wiki("Blade_Runner:_Tokyo_Nexus_4", "Tokyo Nexus #4")
    + L("https://comicalopinions.com/blade-runner-tokyo-nexus-1-new-comic-review/", "Comical Opinions: Tokyo Nexus #1 review")
    + L("https://www.thepopverse.com/comics-blade-runner-tokyo-nexus-to-lose-is-to-win-may-2026-release-announcement/", "Popverse: To Lose Is to Win announced"))
era1 = (nav("era1.html", [("origins", "Origins · 2009"), ("board", "Origins case board"), ("files", "Origins case files"), ("empathy", "Origins themes"), ("tokyo", "Tokyo Nexus · 2015"), ("film82", "Blade Runner · 1982"), ("br2019", "2019 · comic")])
        + hero("Era I · 2009 – 2019 · Before the Blackout", "ERA I", "2009 — 2019",
               "The first Blade Runner, two war veterans in Tokyo, Deckard's hunt and Ash's first case. Four stories, from the birth of the unit to the year of the film.",
               [("p", "起源"), ("c", "東京")])
        + '<main id="top">' + origins_banner + main + (SRC / "era1_more.html").read_text() + "</main>"
        + pager(("index.html", "Archive"), ("era2.html", "Era II")) + footer(era1_sources))

# ---------- era 2
era2_sources = ("".join(wiki(f"Blade_Runner_2029_{i}", f"2029 #{i}") for i in (1, 4, 8, 12))
    + "".join(wiki(f"Blade_Runner_2039_{i}", f"2039 #{i}") for i in (1, 4, 9, 12))
    + L("https://en.wikipedia.org/wiki/Blade_Runner:_Black_Lotus", "Wikipedia: Blade Runner: Black Lotus")
    + L("https://comicalopinions.com/blade-runner-black-lotus-1-review/", "Comical Opinions: Black Lotus #1 review")
    + L("https://comicalopinions.com/blade-runner-black-lotus-2-review/", "Comical Opinions: Black Lotus #2 review")
    + L("https://setthetape.com/2022/11/04/blade-runner-black-lotus-4/", "Set The Tape: Black Lotus #4 review")
    + L("https://www.comicsbeat.com/trade-rating-blade-runner-black-lotus-leaving-la-review", "The Beat: Leaving L.A. review")
    + L("https://comicalopinions.com/blade-runner-black-lotus-las-vegas-1-new-comic-review/", "Comical Opinions: Las Vegas #1 review")
    + L("https://comicalopinions.com/blade-runner-black-lotus-las-vegas-4-review/", "Comical Opinions: Las Vegas #4 review"))
era2 = (nav("era2.html", [("blackout", "Black Out · 2022"), ("br2029", "2029 · comic"), ("lotus", "Black Lotus · anime"), ("ll1", "Leaving L.A."), ("lv1", "Las Vegas"), ("dawn", "Nexus Dawn · 2036"), ("br2039", "2039 · comic")])
        + hero("Era II · 2022 – 2039 · After the Blackout", "ERA II", "2022 — 2039",
               "The records burn and Tyrell falls. Ash fights a replicant who refuses to die, Elle hunts the men who hunted her, and Wallace rises to take Tyrell's place.",
               [("p", "黒蓮"), ("c", "停電")])
        + '<main id="top">' + (SRC / "era2_body.html").read_text() + "</main>"
        + pager(("era1.html", "Era I"), ("era3.html", "Era III")) + footer(era2_sources))

# ---------- era 3
era3_sources = (L("https://www.broadwayworld.com/article/BLADE-RUNNER-2099-to-Make-Debut-on-Prime-Video-With-New-Teaser-Trailer-20260724", "BroadwayWorld: Blade Runner 2099 premiere date and cast")
    + L("https://www.thepopverse.com/tv-blade-runner-2099-prime-video-release-date/", "Popverse: Blade Runner 2099 release date"))
era3 = (nav("era3.html", [("nowhere", "Nowhere to Run · 2048"), ("film49", "Blade Runner 2049"), ("br2099", "Blade Runner 2099")])
        + hero("Era III · 2048 – 2099 · The Wallace Age", "ERA III", "2048 — 2099",
               "A replicant Blade Runner finds bones under a dead tree, and the world that follows fifty years on.",
               [("p", "奇跡"), ("c", "二〇九九")])
        + '<main id="top">' + (SRC / "era3_body.html").read_text() + "</main>"
        + pager(("era2.html", "Era II"), ("index.html", "Archive")) + footer(era3_sources))

out = here / "build"; out.mkdir(exist_ok=True)
(out / "index.html").write_text(page("Blade Runner Archive", hub, False))
(out / "era1.html").write_text(page("Blade Runner Archive · Era I", era1, True))
(out / "era2.html").write_text(page("Blade Runner Archive · Era II", era2, True))
(out / "era3.html").write_text(page("Blade Runner Archive · Era III", era3, True))
for f in sorted(out.iterdir()):
    print(f.name, f.stat().st_size)

# ---------- single-page version: one document, views switch without reloading (music keeps playing)
import json
def parts(s):
    navm = re.search(r'<nav class="bar".*?</nav>', s, re.S).group(0)
    sub = re.search(r'<div class="wrap sub">(.*?)</div>', navm, re.S)
    mainm = re.search(r'<main id="top">(.*)</main>', s, re.S).group(1)
    tail = s[s.index('</main>') + 7:]
    return (sub.group(1) if sub else ""), mainm, tail
HEROES = {
  "archive": ["Los Angeles · 2009 – 2099 · Case archive", "BLADE RUNNER", "ARCHIVE", "Every comic, film, short and anime in the Blade Runner saga, told in story order across three eras. From the first Blade Runner to the city fifty years after K.", ["レプリカント", "ロサンゼルス"]],
  "era1": ["Era I · 2009 – 2019 · Before the Blackout", "ERA I", "2009 — 2019", "The first Blade Runner, two war veterans in Tokyo, Deckard's hunt and Ash's first case. Four stories, from the birth of the unit to the year of the film.", ["起源", "東京"]],
  "era2": ["Era II · 2022 – 2039 · After the Blackout", "ERA II", "2022 — 2039", "The records burn and Tyrell falls. Ash fights a replicant who refuses to die, Elle hunts the men who hunted her, and Wallace rises to take Tyrell's place.", ["黒蓮", "停電"]],
  "era3": ["Era III · 2048 – 2099 · The Wallace Age", "ERA III", "2048 — 2099", "A replicant Blade Runner finds bones under a dead tree, and the world that follows fifty years on.", ["奇跡", "二〇九九"]],
}
views, subs = [], []
for vid, src_ in (("archive", hub), ("era1", era1), ("era2", era2), ("era3", era3)):
    sub, m, tail = parts(src_)
    views.append(f'<div class="view" id="{vid}" data-view="{vid}"{"" if vid == "archive" else " hidden"}>{m}{tail}</div>')
    if sub: subs.append(f'<div class="wrap sub" data-for="{vid}" hidden>{sub}</div>')
h0 = HEROES["archive"]
spa_body = (
  f'<nav class="bar" aria-label="Archive"><div class="wrap"><a class="brand" href="#archive">BR · ARCHIVE</a>'
  + "".join(f'<a href="#{v}" data-nav="{v}">{t}</a>' for v, t in (("era1", ERAS[1][1]), ("era2", ERAS[2][1]), ("era3", ERAS[3][1])))
  + "</div>" + "".join(subs) + "</nav>"
  + hero(h0[0], h0[1], h0[2], h0[3], [("p", h0[4][0]), ("c", h0[4][1])])
  + '<main id="top">' + "".join(views) + "</main>")
for n in ("era1", "era2", "era3"):
    spa_body = spa_body.replace(f'href="{n}.html#', 'href="#').replace(f'href="{n}.html"', f'href="#{n}"')
spa_body = spa_body.replace('href="index.html"', 'href="#archive"')
# the nav/hero moved out of the views, so put them before the main block only once
router = r'''
(function () {
  var HEROES = __HEROES__;
  var views = document.querySelectorAll('.view'), hero = document.querySelector('.hero');
  function show(v) {
    Array.prototype.forEach.call(views, function (el) { el.hidden = el.id !== v; });
    Array.prototype.forEach.call(document.querySelectorAll('nav.bar .sub'), function (el) { el.hidden = el.getAttribute('data-for') !== v; });
    Array.prototype.forEach.call(document.querySelectorAll('nav.bar [data-nav]'), function (a) { if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var h = HEROES[v];
    hero.querySelector('.kicker').textContent = h[0];
    var h1 = hero.querySelector('h1'); h1.firstChild.nodeValue = h[1]; h1.querySelector('span').textContent = h[2];
    h1.classList.remove('flicker'); void h1.offsetWidth; h1.classList.add('flicker');
    hero.querySelector('.lede').textContent = h[3];
    var signs = hero.querySelectorAll('.sign'); signs[0].textContent = h[4][0]; signs[1].textContent = h[4][1];
    window.dispatchEvent(new Event('resize'));
  }
  function route(id, smooth) {
    var el = id && document.getElementById(id), view = el && (el.classList.contains('view') ? el : el.closest('.view'));
    if (!view) { view = document.getElementById('archive'); el = view; }
    var changed = view.hidden; show(view.id);
    if (el === view) { if (changed || !smooth) window.scrollTo(0, 0); else window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else { var nav = document.querySelector('nav.bar'), pt = el.tagName === 'SECTION' ? parseFloat(getComputedStyle(el).paddingTop) || 0 : 0, y = el.getBoundingClientRect().top + window.pageYOffset + pt - nav.offsetHeight - 16;
      window.scrollTo({ top: y, behavior: changed ? 'auto' : 'smooth' }); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1); e.preventDefault(); route(id, true);
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  route(location.hash.slice(1), false);
  window.addEventListener('load', function () { if (location.hash) route(location.hash.slice(1), false); });
})();
'''.replace("__HEROES__", json.dumps(HEROES, ensure_ascii=False))
spa = page("Blade Runner Archive", spa_body, False).replace("</script>", "\n" + router + "</script>", 1)
spa = spa.replace('html { scroll-behavior: smooth; }', 'html { scroll-behavior: auto; } [hidden] { display: none !important; }')
(out / "archive.html").write_text(spa)
(here / "docs").mkdir(exist_ok=True)
full = page("Blade Runner Archive", spa_body, True).replace("</script>", "\n" + router + "</script>", 1)
full = full.replace('html { scroll-behavior: smooth; }', 'html { scroll-behavior: auto; } [hidden] { display: none !important; }')
full = full.replace('<html lang="en">\n<head>\n<meta charset="utf-8">', '<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="description" content="An unofficial fan archive of the Blade Runner saga, 2009 to 2099: every comic, film, short and anime, in story order.">\n<style>:root{color-scheme:dark}html,body{background:#070910}body{font-family:system-ui,sans-serif}</style>')
(here / "docs" / "index.html").write_text(full)
(here / "docs" / ".nojekyll").write_text("")
print("docs/index.html", len(full))
