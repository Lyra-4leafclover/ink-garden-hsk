import os, re, json, shutil, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser('~/work/raw/hwd/hanzi-writer-data-2.0.1/package')
chars = set()
files = glob.glob(f'{ROOT}/data/hsk*.json') + glob.glob(f'{ROOT}/js/content/*.js') + glob.glob(f'{ROOT}/data/novels/*.json') + glob.glob(f'{ROOT}/js/pages/*.js')
for f in files:
    chars |= set(re.findall(r'[\u4e00-\u9fff]', open(f, encoding='utf8').read()))
out = f'{ROOT}/data/strokes'; os.makedirs(out, exist_ok=True)
n = miss = 0
for c in chars:
    src = f'{SRC}/{c}.json'
    if os.path.exists(src):
        d = json.load(open(src))
        json.dump({'strokes': d['strokes'], 'medians': d['medians'], 'radStrokes': d.get('radStrokes')}, open(f'{out}/{ord(c):x}.json', 'w'), separators=(',', ':'))
        n += 1
    else: miss += 1
print('chars', len(chars), 'copied', n, 'missing', miss)
