import json, os, re, shutil, collections, random
from pypinyin import pinyin, Style
import jieba, opencc
RAW = os.path.expanduser('~/work/raw')
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cc = opencc.OpenCC('t2s')
d = json.load(open(f'{RAW}/complete.min.json'))

def tone_pinyin(s):
    return ' '.join(x[0] for x in pinyin(s, style=Style.TONE))
def norm(p):  # compare pinyin loosely
    return re.sub(r'[\s\']', '', p.lower())

words = []
for w in d:
    ol = sorted(int(l[1]) for l in w['l'] if l.startswith('o'))
    if not ol: continue
    default = norm(tone_pinyin(w['s']))
    forms = w['f']
    def score(f):
        m = ' '.join(f['m']).lower()
        sc = 0
        if norm(f['i']['y']) == default: sc -= 10
        if all(x.lower().startswith(('surname', 'variant of', 'old variant', 'used in', 'japanese variant')) for x in f['m']): sc += 5
        return sc
    forms = sorted(forms, key=score)
    main = forms[0]
    meanings = [m for m in main['m'] if not m.lower().startswith(('old variant', 'japanese variant'))][:5] or main['m'][:3]
    other = [{'p': f['i']['y'], 'm': f['m'][:3]} for f in forms[1:4] if norm(f['i']['y']) != norm(main['i']['y'])]
    words.append({'s': w['s'], 't': main['t'], 'p': main['i']['y'], 'n': main['i']['n'], 'm': meanings,
                  'c': main.get('c', []), 'r': w.get('r', ''), 'pos': w.get('p', []), 'q': w.get('q', 99999),
                  'lv': ol[0], 'o': other})
# dedupe by s, keep lowest level
seen = {}
for w in words:
    if w['s'] not in seen or w['lv'] < seen[w['s']]['lv']: seen[w['s']] = w
words = sorted(seen.values(), key=lambda w: (w['lv'], w['p'].lower(), w['s']))
print('words', len(words), collections.Counter(w['lv'] for w in words))
lvl = {w['s']: w['lv'] for w in words}

# ---------- sentences (Tatoeba) ----------
eng = {}
for line in open(f'{RAW}/eng_sentences.tsv', encoding='utf8'):
    i, _, t = line.rstrip('\n').split('\t', 2); eng[i] = t
links = collections.defaultdict(list)
for line in open(f'{RAW}/cmn-eng_links.tsv'):
    a, b = line.split(); 
    if b in eng: links[a].append(eng[b])
for w in words: jieba.add_word(w['s'], freq=200000)
sents = {}
for line in open(f'{RAW}/cmn_sentences.tsv', encoding='utf8'):
    i, _, t = line.rstrip('\n').split('\t', 2)
    if i not in links: continue
    s = cc.convert(t).strip()
    if not (3 <= len(s) <= 40): continue
    if re.search(r'[A-Za-z0-9０-９]', s): continue
    if s in sents: continue
    en = sorted(links[i], key=len)[0]
    sents[s] = en
print('sentences', len(sents))
PUNCT = set('，。！？、；：“”‘’（）《》…—·「」『』,.!?;: ')
pool = []
for s, en in sents.items():
    toks = [t for t in jieba.lcut(s) if t.strip()]
    lv = 0; unknown = 0
    for t in toks:
        if all(ch in PUNCT for ch in t): continue
        if t in lvl: lv = max(lv, lvl[t])
        elif all(ch in lvl for ch in t) and len(t) <= 2:
            lv = max(lv, max(lvl[ch] for ch in t))
        else: unknown += 1
    if lv == 0: continue
    pool.append({'zh': s, 'en': en, 'tok': toks, 'lv': lv, 'unk': unknown})
print('pool', len(pool), collections.Counter(p['lv'] for p in pool if p['unk'] == 0))

def py_tokens(toks):
    out = []
    for t in toks:
        if all(ch in PUNCT for ch in t): out.append(t)
        else: out.append(' '.join(x[0] for x in pinyin(t, style=Style.TONE)))
    return out

by_word = collections.defaultdict(list)
for p in pool:
    for t in set(p['tok']):
        if t in lvl: by_word[t].append(p)
def ex_key(w):
    def k(p):
        return (p['unk'] * 3 + max(0, p['lv'] - w['lv']) * 2 + abs(len(p['zh']) - (8 + 2 * w['lv'])) / 6)
    return k
cov = collections.Counter()
for w in words:
    cands = sorted(by_word.get(w['s'], []), key=ex_key(w))
    cands = [p for p in cands if p['unk'] <= 1] + [p for p in cands if 1 < p['unk'] <= 3]
    ex = []
    for p in cands:
        if any(p['zh'] == e['zh'] for e in ex): continue
        ex.append(p)
        if len(ex) == 3: break
    w['ex'] = [{'zh': p['tok'], 'py': py_tokens(p['tok']), 'en': p['en']} for p in ex]
    if ex: cov[w['lv']] += 1
print('example coverage', sorted(cov.items()))

# sentence pools per level for tests/builder (no unknown words)
os.makedirs(f'{OUT}/data', exist_ok=True)
for L in range(1, 7):
    ps = [p for p in pool if p['lv'] == L and p['unk'] == 0 and len(p['tok']) >= 3 and len(p['zh']) <= 12 + L * 4]
    random.Random(L).shuffle(ps)
    ps = ps[:1500]
    json.dump([{'zh': p['tok'], 'py': py_tokens(p['tok']), 'en': p['en']} for p in ps],
              open(f'{OUT}/data/sentences{L}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('level', L, 'sentences', len(ps))

# ---------- audio ----------
adir = f'{RAW}/audio-cmn/24k-abr/hsk'
have = set(f[4:-4] for f in os.listdir(adir))
os.makedirs(f'{OUT}/audio/w', exist_ok=True)
for L in range(1, 7):
    lw = [w for w in words if w['lv'] == L]
    for i, w in enumerate(lw):
        w['id'] = f'{L}-{i+1:04d}'
        if w['s'] in have:
            shutil.copy(f'{adir}/cmn-{w["s"]}.mp3', f'{OUT}/audio/w/{w["id"]}.mp3'); w['a'] = 1
    json.dump(lw, open(f'{OUT}/data/hsk{L}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
# compact index of all words for search/dictionary
json.dump([[w['s'], w['p'], w['m'][0] if w['m'] else '', w['lv'], w['id']] for w in words],
          open(f'{OUT}/data/index.json', 'w'), ensure_ascii=False, separators=(',', ':'))
# syllable audio
sdir = f'{RAW}/audio-cmn/24k-abr/syllabs'
os.makedirs(f'{OUT}/audio/s', exist_ok=True)
for f in os.listdir(sdir):
    shutil.copy(f'{sdir}/{f}', f'{OUT}/audio/s/{f[4:]}')
print('audio words', sum(1 for w in words if w.get('a')))
