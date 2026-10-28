"""Generate src/pages/people.html: the cross-era character index.
Every fact here is taken from the synopses already in the archive."""
import pathlib, sys, html

REPO = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent

# story prefix -> (short label, colour token)
STORY = {
    'i': ('Origins', 'amber'), 'tn': ('Tokyo Nexus', 'pink'), 'tw': ('To Lose Is to Win', 'pink'), 'dh': ('Die With Honor', 'pink'), 'f': ('Blade Runner', 'amber'), 'gm': ('Game', 'cyan'),
    'b': ('2019', 'cyan'), 'bo': ('Black Out', 'dim'), 'c': ('2029', 'cyan'), 'l': ('Black Lotus', 'pink'),
    'll': ('Leaving L.A.', 'pink'), 'lv': ('Las Vegas', 'pink'), 'dawn': ('Nexus Dawn', 'dim'), 'd': ('2039', 'amber'),
    'run': ('Nowhere to Run', 'dim'), 'g': ('2049', 'amber'),
}
FILM_PARTS = {'f': 'Part', 'g': 'Part', 'gm': 'Part'}
ROMAN = ['I', 'II', 'III', 'IV']

def chip_label(a):
    import re
    pre, num = re.match(r'([a-z]+)(\d*)', a).groups()
    name, col = STORY[pre]
    if not num: return name, col
    n = int(num)
    if pre in FILM_PARTS: return f'{name} · {ROMAN[n - 1]}', col
    if pre == 'l': return f'{name} · E{n:02d}', col
    if pre in ('dawn', 'run'): return name, col
    return f'{name} #{n}', col

PEOPLE = [
  ('tyrell', 'Eldon Tyrell', 'Human · Tyrell Corporation', 'Killed 2019', 'rust',
   'The maker of the Nexus replicants. In 2009 he holds Ilora Stahl responsible for the replicant uprising and orders future models fixed. A replicant he made, Roy Batty, kills him in 2019 when Tyrell can’t give him more life. Decades later his old diary reveals that Yotun is his younger brother, and his sanctum still stands as a monument to his hubris.',
   ['i10', 'f3', 'c10', 'c12', 'd12']),
  ('cal', 'Cal Moreaux', 'Human · ex-soldier', 'Alive in 2039', 'amber',
   'A veteran of Kalanthia and a cold-case detective from the slums. Blackmailed into hunting the Nexus 5, he finds it is his sister Nia, and shoots her on live television, by her own plan, to become the first Blade Runner. Thirty years on he is a figure in the city’s underworld, and owes Ash a favour.',
   ['i1', 'i4', 'i6', 'i11', 'i12', 'd9', 'd10', 'd11']),
  ('mead', 'Mead', 'Human · ex-Corporate Marine', 'Last seen in Tokyo, 2015', 'pink',
   'A marine who fought beside Stix on Kalanthia and was left for dead there, betrayed by her own commanding officer. In Tokyo the two run an unlicensed detective agency. On the trail of a missing sister she refuses to believe Stix is a killer, and calls him the most human replicant she has ever met. In the sequel, Madame Nomura hires her to find out who murdered her daughters.',
   ['tn1', 'tn2', 'tn3', 'tn4', 'tw1', 'tw2', 'tw3', 'tw4', 'dh1', 'dh3']),
  ('stix', 'Stix', 'Replicant · combat model', 'Last seen in Tokyo, 2015', 'cyan',
   'Mead’s partner, a combat replicant from Kalanthia. Framed for killings by bootleg replicants that fight just like him, he takes work from the Yakuza boss Alura in return for a longer life. In the sequel he guards Cheshire’s scientists, and faces Rumika in the Undercity over the last Aurora Yoke.',
   ['tn1', 'tn3', 'tn4', 'tw1', 'tw2', 'tw4', 'dh1', 'dh3']),
  ('rumika', 'Rumika', 'Blade Runner · sent from Los Angeles', 'Last seen in Tokyo, 2015', 'rust',
   'A Blade Runner who arrives in Tokyo hunting Stix, drops the hunt once Mead convinces her, and is ordered to arrest or kill the ex-Tyrell scientists at Cheshire. In the sequel she follows the Aurora technology all the way to a duel on Shiwa Shrine Road. Titan also spells her name Rumiko.',
   ['tn2', 'tn3', 'tn4', 'tw1', 'tw2', 'tw3', 'tw4']),
  ('alura', 'Alura', 'Yakuza boss', 'Active in 2015', 'amber',
   'The Yakuza boss who shoots Takumi Nomura and offers Stix a longer life in return for his services. Her organisation protects the ex-Tyrell scientists behind Cheshire, and she wants the Aurora data.',
   ['tn4', 'tw1', 'dh1', 'dh3']),
  ('nomura', 'Madame Nomura', 'Yakuza matriarch', 'Active in 2015', 'amber',
   'The matriarch of a powerful Yakuza clan. She hires Mead to find who murdered her two daughters, Miyuki being one. In Die With Honor Alura sends Stix and a team of Cheshire replicants to hunt her, and Stix and Mead later take refuge with her loyalists at a foundry the Nomura-gumi family controls.',
   ['tw2', 'dh1', 'dh3']),
  ('uldren', 'Uldren', 'Former commanding officer', 'Active in 2015', 'rust',
   'The commanding officer who betrayed Mead and Stix on Kalanthia. When he learns they survived he sets out to kill them before they can expose him, and the Tyrell data he stole let Cheshire build bootleg replicants. In Die With Honor he is the one promising Alura a delivery of bootleg replicants.',
   ['tw1', 'dh1']),
  ('deckard', 'Rick Deckard', 'Blade Runner', 'Alive in 2049', 'amber',
   'Pulled out of retirement to hunt Roy Batty’s group in 2019. He falls for Rachael and leaves the city with her. Thirty years later K finds him hiding in the ruins of Las Vegas, and brings him to meet the daughter he never knew.',
   ['f1', 'f2', 'f4', 'g3', 'g4']),
  ('rachael', 'Rachael', 'Replicant · experimental Nexus-7', 'Deceased', 'pink',
   'Tyrell’s assistant, who believes she is human because of memories implanted from his niece. She saves Deckard by killing Leon and leaves with him. In 2049 her bones are found under a dead tree: she died giving birth, something no replicant was supposed to be able to do.',
   ['f1', 'f2', 'f4', 'g1', 'g2']),
  ('gaff', 'Gaff', 'Human · Blade Runner', 'Retired', 'amber',
   'Deckard’s origami-folding colleague, who lets Rachael live and leaves a unicorn to say so. Twenty years later he tells Ash that to get close to Wallace she must bring him what he wants, and leaves her an origami frog.',
   ['f1', 'f4', 'd9']),
  ('ash', 'Ash · Aahna Ashina', 'Human · Blade Runner', 'Last seen 2039, time running out', 'cyan',
   'The LAPD’s best Blade Runner, hiding a failing spine inside a cybernetic brace. Hired to find Cleo Selwyn, she protects her instead, and spends the next twenty years on the replicants’ side: a double agent in 2029, running the underground’s escape routes in 2039. She refuses Wallace’s cure and spends her last time with Freysa.',
   ['b1', 'b4', 'b8', 'b12', 'c1', 'c6', 'c11', 'c12', 'd1', 'd4', 'd9', 'd12']),
  ('wojciech', 'Lydia Wojciech', 'Human · LAPD captain', 'Died before 2039 #9', 'cyan',
   'Ash’s captain and, later, her quiet ally. In 2029 she makes a scene to help Freysa break Ash out of custody. In 2039, retired to a care home, she warns Ash away from Luv and Wallace, and has died by the time Ash comes back for advice.',
   ['b1', 'b9', 'c12', 'd3', 'd9']),
  ('cleo', 'Cleo Selwyn', 'Human', 'Off-world with Isobel and Rash', 'cyan',
   'The daughter of tycoon Alexander Selwyn, who planned to hand her to Tyrell because of a rare gene. Ash takes her off-world. She returns to Earth in 2039 looking for Isobel, and leaves again for the colonies with her.',
   ['b1', 'b4', 'b5', 'b8', 'b12', 'd2', 'd3', 'd5', 'd12']),
  ('isobel', 'Isobel Selwyn', 'Replicant', 'Off-world with Cleo', 'pink',
   'A replicant copy of Selwyn’s dead wife, who flees with Cleo to protect her. The first Isobel stays behind to cover their escape. A second Isobel, carrying her memories, finds Cleo again off-world, and later kills Selwyn. In 2039 she leads Wallace’s people away from Cleo.',
   ['b1', 'b3', 'b4', 'b8', 'b12', 'd8', 'd10', 'd12']),
  ('hythe', 'Hythe', 'Replicant · several copies', 'Last one retired in 2039', 'rust',
   'Selwyn’s Blade Runner, and then more than one of her. The first is shot by Isobel at the Arcadia gate. Selwyn sends copies after Ash, and one defective Hythe turns on the others and asks for his mansion. By 2039 she lives there as “Penelope”, until Rash shoots her.',
   ['b6', 'b7', 'b8', 'b9', 'b11', 'b12', 'd2', 'd3', 'd6']),
  ('freysa', 'Freysa', 'Replicant · former combat model', 'Alive in 2049', 'pink',
   'Leader of the replicant resistance and Ash’s partner. She repairs Ash’s brace in 2019, loses an eye to Yotun in 2029 and kills him in Edens. In 2049 she tells K the truth about the child.',
   ['b11', 'c2', 'c6', 'c8', 'c12', 'd2', 'd5', 'd12', 'g3', 'g4']),
  ('yotun', 'Yotun', 'Replicant · Nexus-6', 'Retired 2029', 'rust',
   'A Nexus-6 who escaped Ash in 2017 and lives long past his four years by taking his followers’ blood. He brings down the sea wall and storms LAPD headquarters, then dies in Edens beside a box of owl bones, Eldon Tyrell’s answer about death.',
   ['c1', 'c3', 'c4', 'c8', 'c10', 'c12']),
  ('elle', 'Elle · Black Lotus', 'Replicant · prototype assassin', 'At large', 'pink',
   'Made by Niander Wallace Jr. to kill his father, then hunted for sport in the desert with her memories wiped. She hunts the hunters, kills Wallace Sr., blinds Jr., and rides out into the desert, where she is pursued all the way to the ruins of Las Vegas.',
   ['l1', 'l4', 'l9', 'l13', 'll1', 'll4', 'lv1', 'lv4']),
  ('davis', 'Alani Davis', 'Human · LAPD', 'In Las Vegas', 'cyan',
   'A rookie who works out that the killer the press calls Black Lotus is a replicant, and is put on leave for saying so. Badly hurt by Water Lily, she returns to work in a wheelchair, then joins Wallace’s hunting party for the promise of walking again, and ends up at Elle’s side.',
   ['l5', 'l8', 'l12', 'l13', 'lv1', 'lv3', 'lv4']),
  ('wallace', 'Niander Wallace', 'Human · Wallace Corporation', 'Alive in 2049', 'amber',
   'The son who had Elle built to kill his father, and was blinded by her. He gets the replicant ban lifted with the obedient Nexus-9, gives the LAPD a replicant Blade Runner, takes Selwyn’s fertility research from Ash, and by 2049 is hunting the child born to Rachael.',
   ['l10', 'l13', 'lv1', 'dawn1', 'd1', 'd5', 'd12', 'g2', 'g3']),
  ('luv', 'Luv', 'Replicant · Nexus-9', 'Retired 2049', 'amber',
   'Wallace’s gift to the LAPD: the first replicant Blade Runner, hated by her colleagues. Freysa decides she is in love with her maker. By 2049 she is his enforcer, and K drowns her at the sea wall.',
   ['d1', 'd4', 'd8', 'd9', 'd11', 'g2', 'g3', 'g4']),
  ('sapper', 'Sapper Morton', 'Replicant · Nexus-8', 'Retired 2049', 'dim',
   'An old combat model who served with Freysa off-world. He shelters at the underground’s camp in 2039, farms quietly outside the city, and gives himself away saving a girl and her mother. K retires him at his farm.',
   ['d2', 'd9', 'run1', 'g1']),
  ('k', 'K', 'Replicant · Nexus-9', 'Last seen on the steps', 'amber',
   'A replicant Blade Runner who finds Rachael’s bones and comes to believe he is her child. He isn’t. He brings Deckard to his daughter anyway.',
   ['g1', 'g2', 'g3', 'g4']),
]

COL = {'amber': 'var(--amber)', 'cyan': 'var(--cyan)', 'pink': 'var(--pink)', 'rust': 'var(--rust)', 'dim': 'var(--dim)'}

cards = []
for n, (key, name, kind, status, col, bio, apps) in enumerate(PEOPLE, 1):
    chips = ''.join(f'<a class="app" href="#{a}" style="--c:{COL[chip_label(a)[1]]}">{html.escape(chip_label(a)[0])}</a>' for a in apps)
    cards.append(f'''      <article class="file dossier" id="p-{key}" data-case="BR-IDX-{n:03d}" data-spoils="{' '.join(apps)}" style="--c:{COL[col]}">
        <div class="photo"><small>NO PHOTO</small><svg viewBox="0 0 70 84" aria-hidden="true"><circle cx="35" cy="30" r="15"/><path d="M5 84 Q35 40 65 84Z"/></svg></div>
        <div><h3>{name}</h3><div class="dzb"><div class="kind">{kind}</div><span class="status" style="--s:{COL[col]}">{status.upper()}</span><p>{bio}</p><div class="apps"><span class="apps-l">Appears in</span>{chips}</div></div></div>
      </article>''')

page = f'''<section id="files-index">
  <div class="wrap">
    <div class="sec-head"><div class="label">LAPD records · cross-referenced</div><h2>Character files</h2><p class="prose" style="color:var(--dim);margin:0">The people who turn up in more than one story, in order of first appearance. Each file links to every entry they appear in. With the spoiler shield on, a file stays blurred until you’ve read all of its appearances.</p></div>
    <div class="files dossiers">
{chr(10).join(cards)}
    </div>
  </div>
</section>
<div class="wrap pager"><a href="#era3">← Era III</a><a href="#lore">Lore →</a></div>
<footer><div class="wrap"><div class="label">Sources</div><p>Compiled from the synopses in this archive. See the source lists at the foot of each era.</p></div></footer>
'''
(REPO / 'src/pages/people.html').write_text(page)
print(len(PEOPLE), 'files')
