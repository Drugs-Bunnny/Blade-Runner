#!/usr/bin/env python3
"""Checks for the Blade Runner Archive. Exits non-zero if anything is wrong.

    python3 tools/check.py            run every check
    python3 tools/check.py --no-build skip the "is docs/ up to date" check (no rebuild)

Checks
  ids      every id on a page is unique, and every in-page link (#something) lands on a real id or view
  stories  the story list in reader.js agrees with the copies in search, lore, quiz, fx and make_files.py, and every anchor exists
  lore     the Lore data refers only to things that exist: people, character files, entries, quiz answers
  built    docs/ matches what build.py produces from the sources (build number and date are ignored)

Needs Python 3 and Node (Node only to read src/scripts/lore-data.js). Run it from a full git clone,
because the build number is the commit count.
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
sys.path.insert(0, str(ROOT))

problems = []


def fail(check, msg):
    problems.append(f"[{check}] {msg}")


# ---------- reading the sources ----------
class Page(HTMLParser):
    """Collects ids, in-page links and data-spoils lists from a chunk of HTML."""

    def __init__(self):
        super().__init__()
        self.ids, self.links, self.spoils, self.arts = [], [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        href = a.get("href") or ""
        if tag == "a" and href.startswith("#") and len(href) > 1:
            self.links.append(href[1:])
        if a.get("data-spoils"):
            self.spoils.append((a.get("id", "?"), a["data-spoils"].split()))
        if a.get("data-art"):
            self.arts.append(a["data-art"])


def parse(path):
    p = Page()
    p.feed(path.read_text())
    return p


def load_views():
    import build
    return build.VIEWS, build.NAV


def load_stories():
    """STORIES in reader.js: key -> anchor."""
    src = (SRC / "scripts/reader.js").read_text()
    block = re.search(r"var STORIES = \{(.*?)\n  \};", src, re.S).group(1)
    return {m.group(1): m.group(2) for m in re.finditer(r"^\s*(\w+):\s*\{[^}]*anchor: '#([^']+)'", block, re.M)}


def load_lore():
    """Evaluate lore-data.js with Node and return BR_LORE as a dict."""
    js = ("global.window = {}; require(process.argv[1]);"
          "process.stdout.write(JSON.stringify(window.BR_LORE));")
    out = subprocess.run(["node", "-e", js, str(SRC / "scripts/lore-data.js")], capture_output=True, text=True)
    if out.returncode:
        fail("lore", "could not evaluate lore-data.js: " + out.stderr.strip().splitlines()[-1])
        return None
    return json.loads(out.stdout)


# ---------- ids and links ----------
def check_ids(views):
    ids = {}
    for v in views:
        page = parse(SRC / "pages" / f"{v}.html")
        for i in page.ids:
            if i in ids:
                fail("ids", f"duplicate id '{i}' (in {v}.html and {ids[i]}.html)")
            ids[i] = v
        for a in page.arts:
            if not re.search(rf"\b{re.escape(a)}\b\s*[:(]|'{re.escape(a)}'|\"{re.escape(a)}\"", (SRC / "scripts/art.js").read_text()):
                fail("ids", f"{v}.html has a poster data-art=\"{a}\" that art.js doesn't draw")
    # chrome that lives outside the pages: view containers, the search and player markup, shell ids
    shell = set(views)
    for f in (SRC / "shell").glob("*.html"):
        shell.update(parse(f).ids)
    known = set(ids) | shell
    # references inside page links
    for v in views:
        for target in parse(SRC / "pages" / f"{v}.html").links:
            if target not in known:
                fail("ids", f"{v}.html links to #{target}, which doesn't exist")
    # the sub-navigation and the top bar
    for view, items in json.loads((SRC / "shell/subnav.json").read_text()).items():
        if view not in views:
            fail("ids", f"subnav.json has a menu for '{view}', which isn't a view")
        for anchor, _ in items:
            if anchor not in known:
                fail("ids", f"subnav.json ({view}) links to #{anchor}, which doesn't exist")
    heroes = json.loads((SRC / "shell/heroes.json").read_text())
    for v in views:
        if v not in heroes:
            fail("ids", f"heroes.json has no hero text for view '{v}'")
    return ids


# ---------- story keys ----------
def check_stories(ids, views):
    stories = load_stories()
    for key, anchor in stories.items():
        if anchor not in ids:
            fail("stories", f"story '{key}' points at #{anchor}, which doesn't exist")
    # every article's id prefix must be a known story, since the tracker and search group entries by it
    for v in views:
        for m in re.finditer(r'<article class="issue"[^>]*\bid="([a-z]+)\d+"', (SRC / "pages" / f"{v}.html").read_text()):
            if m.group(1) not in stories:
                fail("stories", f"entries with id prefix '{m.group(1)}' in {v}.html have no story in reader.js")
    # The same list of stories is kept in several files. They must agree, or a story gets no search label,
    # no quiz name, no origami figure or no character-file tag. (MAINTAINING.md: "Adding a story")
    def table(path, name, closer="};", key_re=r"(\w+):", anchor_re=None):
        text = (ROOT / path).read_text()
        m = re.search(rf"{name}\s*=\s*\{{(.*?)\n?\s*{re.escape(closer)}" if closer != "}" else rf"{name}\s*=\s*\{{(.*?)\n\}}", text, re.S)
        if not m:
            fail("stories", f"could not find {name} in {path}")
            return {}
        body = m.group(1)
        if anchor_re:
            return {k: a for k, a in re.findall(anchor_re, body)}
        return {k: None for k in re.findall(key_re, body)}

    tables = {
        "reader.js STORIES": table("src/scripts/reader.js", "var STORIES", anchor_re=r"(\w+):\s*\{[^}]*anchor: '(#[^']+)'"),
        "search.js STORY": table("src/scripts/search.js", "var STORY", key_re=r"\b([a-z]+): '"),
        "lore.js NAMES": table("src/scripts/lore.js", "var NAMES", key_re=r"\b([a-z]+): '"),
        "quiz.js ANCHOR": table("src/scripts/quiz.js", "var ANCHOR", anchor_re=r"\b([a-z]+): '(#[^']+)'"),
        "quiz.js NAME": table("src/scripts/quiz.js", "var NAME", key_re=r"\b([a-z]+): '"),
        "fx.js STORIES": table("src/scripts/fx.js", "var STORIES", anchor_re=r"\b([a-z]+): \['(#[^']+)'"),
        "tools/make_files.py STORY": table("tools/make_files.py", "STORY", closer="}", key_re=r"'([a-z]+)': \("),
    }
    for name, t in tables.items():
        if not t:
            continue
        for key in stories.keys() - t.keys():
            fail("stories", f"story '{key}' is in reader.js but missing from {name}")
        for key in t.keys() - stories.keys():
            fail("stories", f"{name} has story '{key}', which reader.js doesn't have")
        for key, anchor in t.items():
            if anchor and key in stories and anchor != "#" + stories[key]:
                fail("stories", f"{name}: '{key}' points at {anchor}, but reader.js says #{stories[key]}")
    return stories


# ---------- lore data ----------
def check_lore(ids, stories):
    lore = load_lore()
    if not lore:
        return
    entry_ids = set(ids)

    def story_keys(where, keys):
        for k in keys or []:
            if k not in stories and not re.fullmatch(r"[a-z]+\d+", k):
                fail("lore", f"{where}: unknown story key '{k}'")
            elif k not in stories and k not in entry_ids:
                fail("lore", f"{where}: '{k}' isn't a story or an entry id")

    def link(where, href):
        if not href.startswith("#") or href[1:] not in entry_ids:
            fail("lore", f"{where}: links to {href}, which doesn't exist")

    seen = set()
    for t in lore["terms"]:
        if t["id"] in seen:
            fail("lore", f"glossary: duplicate term id '{t['id']}'")
        seen.add(t["id"])
        story_keys(f"glossary '{t['t']}'", t.get("s"))
        for href, _ in t.get("see", []):
            link(f"glossary '{t['t']}'", href)

    people = {p["id"]: p for p in lore["people"]}
    if len(people) != len(lore["people"]):
        fail("lore", "connections: duplicate person id")
    for p in lore["people"]:
        story_keys(f"person '{p['n']}'", p.get("s"))
        if p.get("f") and p["f"] not in entry_ids:
            fail("lore", f"person '{p['n']}' has character file #{p['f']}, which doesn't exist")
    for a, b, _, keys in lore["links"]:
        for who in (a, b):
            if who not in people:
                fail("lore", f"connection {a} to {b}: unknown person '{who}'")
        story_keys(f"connection {a} to {b}", keys)

    for e in lore["events"]:
        link(f"timeline {e['y']} '{e['t']}'", e["go"])
        story_keys(f"timeline {e['y']} '{e['t']}'", e.get("s"))

    for place in lore["places"] + lore.get("insets", []):
        for _, refs in place.get("spots", []):
            for href, _ in refs:
                link(f"map '{place['n']}'", href)

    for key, qs in lore["quiz"].items():
        if key not in stories:
            fail("lore", f"quiz '{key}' isn't a story in reader.js")
        for i, q in enumerate(qs, 1):
            if len(q) != 5:
                fail("lore", f"quiz '{key}' question {i} has {len(q) - 1} answers; it needs 4 (the first is correct)")
            elif len(set(q[1:])) != 4:
                fail("lore", f"quiz '{key}' question {i} repeats an answer")
    for key in stories:
        if key not in lore["quiz"]:
            # arcs (Leaving L.A., Las Vegas) share Black Lotus's quiz; any other story without one is worth knowing about
            if not re.search(rf"\b{key}\b", "ll lv"):
                print(f"note: story '{key}' has no Voight-Kampff quiz")

    # character files: every spoiler entry named in data-spoils must exist
    for v in ("people",):
        for fid, keys in parse(SRC / "pages" / f"{v}.html").spoils:
            for k in keys:
                if k not in entry_ids and k not in stories:
                    fail("lore", f"character file {fid}: data-spoils lists '{k}', which isn't an entry")


# ---------- is docs/ up to date? ----------
STAMP = re.compile(r"Build \d+ · \d{1,2} \w{3} \d{4}")
BUILD_NO = re.compile(r"(BUILD = ')\d+(')|(br-archive-)\d+|(name=\"build\" content=\")[^\"]*")


def mask(data):
    text = data.decode("utf-8", "replace")
    text = STAMP.sub("Build N", text)
    text = re.sub(r"const BUILD = '\d+'", "const BUILD = 'N'", text)
    text = re.sub(r"(<[^>]*\bid=\"build\"[^>]*>)\s*\d+", r"\1N", text)
    return text


def check_built():
    import build
    docs = ROOT / "docs"
    out = ROOT / "build"
    before = {p: p.read_bytes() for p in docs.rglob("*") if p.is_file()}
    out_before = out.exists()
    try:
        with open("/dev/null", "w") as quiet:
            real, sys.stdout = sys.stdout, quiet
            try:
                build.build()
            finally:
                sys.stdout = real
        after = {p: p.read_bytes() for p in docs.rglob("*") if p.is_file()}
        for p in sorted(set(before) | set(after)):
            rel = p.relative_to(ROOT)
            if p not in before:
                fail("built", f"{rel} is produced by the build but isn't committed")
            elif p not in after:
                fail("built", f"{rel} is committed but the build no longer produces it")
            elif p.suffix in (".html", ".js", ".webmanifest", ".css", ".svg"):
                if mask(before[p]) != mask(after[p]):
                    fail("built", f"{rel} is out of date: run python3 build.py and commit docs/")
            elif before[p] != after[p]:
                fail("built", f"{rel} is out of date: run python3 build.py and commit docs/")
    finally:
        # leave the tree as we found it
        for p in docs.rglob("*"):
            if p.is_file() and p not in before:
                p.unlink()
        for p, data in before.items():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
        if not out_before:
            shutil.rmtree(out, ignore_errors=True)


def main():
    views, _ = load_views()
    ids = check_ids(views)
    stories = check_stories(ids, views)
    check_lore(ids, stories)
    if "--no-build" not in sys.argv:
        check_built()
    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()
