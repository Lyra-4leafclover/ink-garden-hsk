import json, urllib.request, urllib.parse, re, html, sys, opencc
cc = opencc.OpenCC('t2s')
def get(page):
    u = 'https://zh.wikisource.org/w/api.php?' + urllib.parse.urlencode({'action':'parse','page':page,'prop':'text','format':'json','variant':'zh-cn','formatversion':2})
    req = urllib.request.Request(u, headers={'User-Agent':'hsk-study-site/1.0 (educational)'})
    h = json.load(urllib.request.urlopen(req))['parse']['text']
    h = re.sub(r'<(table|style|script|sup)[^>]*>.*?</\1>', '', h, flags=re.S)
    h = re.sub(r'<div class="[^"]*(header|licenseContainer|ws-noexport|prp-pages-output-skip)[^"]*".*?</div>', '', h, flags=re.S)
    paras = re.findall(r'<(?:p|dd)[^>]*>(.*?)</(?:p|dd)>', h, flags=re.S)
    out = []
    for p in paras:
        t = html.unescape(re.sub(r'<[^>]+>', '', p)).strip()
        t = re.sub(r'\s+', '', t)
        if t: out.append(cc.convert(t))
    return out
for page, fn in [('孔乙己','kongyiji'), ('故鄉','guxiang'), ('西遊記/第001回','xiyouji1')]:
    ps = get(page)
    json.dump(ps, open(fn+'.json','w'), ensure_ascii=False, indent=0)
    print(fn, len(ps), sum(map(len, ps)))
    print(ps[:2], ps[-2:])
