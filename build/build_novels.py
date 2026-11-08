import json, re, os, collections
import jieba
from pypinyin import pinyin, Style
jieba.setLogLevel(60)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'build', 'raw-novels')
VAR = {'儍': '傻', '淸': '清', '鄕': '乡', '煑': '煮', '甚么': '什么', '豫备': '预备', '纔': '才', '擡': '抬', '靑': '青', '骑著': '骑着', '〈': '《', '〉': '》', '「': '“', '」': '”', '『': '‘', '』': '’'}
TAILS = ('1996年1月1日', '这部作品也可能', '据《中华人民共和国著作权法', 'Publicdomain', '《鲁迅全集》由', '鲁迅《故乡》最初发表')

cedict = {}
for line in open(os.path.expanduser('~/work/raw/cedict.txt'), encoding='utf-8'):
    if line.startswith('#'): continue
    m = re.match(r'(\S+) (\S+) \[([^\]]+)\] /(.+)/', line)
    if not m: continue
    t, s, p, d = m.groups()
    if s in cedict and not cedict[s][1].startswith(('surname', 'variant', 'old variant')): continue
    defs = [x for x in d.split('/') if not x.startswith(('variant of', 'old variant', 'see '))] or d.split('/')
    cedict[s] = (p, '; '.join(defs[:3]))
hsk = {}
for L in range(1, 7):
    for w in json.load(open(os.path.join(ROOT, 'data', f'hsk{L}.json'))):
        hsk.setdefault(w['s'], (L, w['id']))
for w in hsk: jieba.add_word(w)
charlv = {}
for w, (L, _) in hsk.items():
    for ch in w: charlv[ch] = min(charlv.get(ch, 7), L)

def clean(paras):
    out = []
    for p in paras:
        if p.startswith(TAILS): break
        p = p.replace('\u200b', '').replace('\ufeff', '').strip()
        for a, b in VAR.items(): p = p.replace(a, b)
        if p: out.append(p)
    return out

def py(tok):
    return ' '.join(x[0] for x in pinyin(tok, style=Style.TONE, heteronym=False))

META = {
  'kongyiji': dict(file='kongyiji', title='孔乙己', en='Kong Yiji', author='鲁迅', authorEn='Lu Xun', year=1919, lv=5,
    intro='A short story told by a boy who works in a village wine shop. Kong Yiji is a poor scholar who failed the imperial exams, too proud to work, mocked by everyone. Lu Xun uses him to criticise the cruelty and indifference of old Chinese society.'),
  'guxiang': dict(file='guxiang', title='故乡', en='My Old Home', author='鲁迅', authorEn='Lu Xun', year=1921, lv=5,
    intro='The narrator returns to his hometown after twenty years to move his family away. He meets his childhood friend Runtu, once a bright, brave boy, now a worn-out farmer who calls him "master". It ends with a famous line about hope and roads.'),
  'xiyouji1': dict(file='xiyouji1', title='西游记 · 第一回', en='Journey to the West, Chapter 1', author='吴承恩', authorEn='Wu Cheng\'en', year=1592, lv=6,
    intro='The birth of the Monkey King: a stone monkey is born on the Mountain of Flowers and Fruit, finds the Water Curtain Cave, becomes king, and sets out across the sea to learn the secret of immortality — receiving the name Sun Wukong. Written in early vernacular Chinese.'),
}
os.makedirs(os.path.join(ROOT, 'data', 'novels'), exist_ok=True)
for nid, m in META.items():
    paras = clean(json.load(open(os.path.join(RAW, m['file'] + '.json'))))
    dic, freq, out = {}, collections.Counter(), []
    for p in paras:
        merged = []
        for t in jieba.cut(p, HMM=False):
            if re.fullmatch(r'[\u4e00-\u9fff]+', t) and t not in cedict and t not in hsk and len(t) > 1:
                merged.extend(list(t))
            elif t: merged.append(t)
        out.append(merged)
        for t in merged:
            if re.fullmatch(r'[\u4e00-\u9fff]+', t):
                freq[t] += 1
                if t not in dic:
                    c = cedict.get(t); h = hsk.get(t)
                    diff = min(h[0] if h else 7, max(charlv.get(ch, 7) for ch in t))
                    dic[t] = [py(t), c[1] if c else '', h[0] if h else 0, h[1] if h else '', diff]
    total = sum(freq.values()); inhsk = sum(n for t, n in freq.items() if dic[t][2])
    key = [t for t, n in freq.most_common() if (dic[t][2] == 0 or dic[t][2] >= 4) and dic[t][1] and len(t) > 1][:24]
    data = dict(id=nid, **{k: v for k, v in m.items() if k != 'file'}, paras=out, dict=dic, key=key, chars=sum(len(p) for p in paras), coverage=round(inhsk / total * 100))
    json.dump(data, open(os.path.join(ROOT, 'data', 'novels', nid + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(nid, len(out), data['chars'], 'tokens', total, 'unique', len(dic), 'cov', data['coverage'], 'first:', ''.join(out[0])[:30], 'last:', ''.join(out[-1])[-40:])
