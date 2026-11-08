import { esc, sayBtn, pick, LEVEL_INFO } from '../lib/ui.js';
import { loadSentences } from '../lib/data.js';
import { FRAMES } from '../content/grammar.js';
import { builder } from './grammar.js';
import * as store from '../lib/store.js';

const ROLE = ['subj', 'time', 'manner', 'place', 'verb', 'obj', 'comp'];
const FR_ROLES = [['subj', 'time', 'place', 'verb'], ['subj', 'time', 'manner', 'place', 'verb'], ['subj', 'time', 'verb', 'comp', 'obj'], ['subj', 'verb', 'comp', 'time', 'obj'], ['subj', 'comp', 'obj', 'verb', 'comp'], ['comp', 'verb', 'comp', 'subj', 'verb']];
const LABEL = { subj: 'who', time: 'when', manner: 'how / with', place: 'where', verb: 'do', obj: 'what', comp: 'link / result' };

export async function render(main) {
  let L = store.setting('sentLevel') || 1, streak = 0, total = 0;
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">造句 · Sentence framing</div><h1>Sentence building</h1>
    <p class="lead">Chinese word order is strict but simple: <b>Who → When → How/With whom → Where → Do → What</b>. Learn the frame once, and you can build thousands of sentences.</p></div>
    <section class="section"><div class="section-title"><h2>The sentence frames</h2></div>
    <div class="grid g2">${FRAMES.map(([t, d, parts, en], i) => `<div class="card"><h3 style="margin:0 0 4px">${esc(t)}</h3><p class="muted small" style="margin:0 0 10px">${esc(d)}</p>
      <div>${parts.map((p, j) => `<span class="part p-${FR_ROLES[i][j] || 'obj'}"><small>${LABEL[FR_ROLES[i][j]] || ''}</small><span class="zh" style="font-size:1.3rem">${esc(p)}</span></span>`).join('')} ${sayBtn(parts.join(''), 'sm')}</div>
      <div class="muted small" style="margin-top:6px">${esc(en)}</div></div>`).join('')}</div>
    <div class="callout jade">Golden rule: <b>everything that describes comes before what it describes.</b> Time, place, manner go before the verb; adjectives and 的-phrases go before the noun. Only duration, results and objects go after the verb.</div>
    </section>
    <section class="section"><div class="section-title"><h2>Build real sentences</h2><span class="muted">Endless practice from native sentences (Tatoeba)</span></div>
      <div class="row" style="margin-bottom:14px"><div class="seg" id="lv">${[1, 2, 3, 4, 5, 6].map(l => `<button data-l="${l}" class="${l == L ? 'on' : ''}">HSK ${l}</button>`).join('')}</div><span class="chip" id="score">0 / 0</span></div>
      <div class="card" id="bx"></div>
      <div class="row" style="margin-top:12px"><button class="btn" id="nx">Next sentence →</button><label class="small muted"><input type="checkbox" id="py" ${store.setting('sentPy') !== false ? 'checked' : ''}> show pinyin on tiles</label></div>
    </section></div>`;
  const bx = main.querySelector('#bx');
  async function next() {
    const all = await loadSentences(L);
    const ok = all.filter(s => { const n = s.zh.filter(t => !/^[\p{P}\s]+$/u.test(t)).length; return n >= 3 && n <= (L < 3 ? 7 : 10); });
    const s = pick(ok);
    const idx = s.zh.map((t, i) => /^[\p{P}\s]+$/u.test(t) ? -1 : i).filter(i => i >= 0);
    const toks = idx.map(i => s.zh[i]), pys = idx.map(i => s.py[i]);
    let counted = false; total++;
    bx.innerHTML = '<div class="eyebrow">HSK ' + L + ' · ' + LEVEL_INFO[L].name + '</div><div class="b"></div>';
    builder(bx.querySelector('.b'), s.zh.join(''), s.en, () => { if (!counted) { counted = true; streak++; upd(); } }, toks, main.querySelector('#py').checked ? pys : null);
    upd();
  }
  const upd = () => main.querySelector('#score').textContent = `${streak} / ${total} solved`;
  main.querySelector('#lv').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; L = +b.dataset.l; store.setting('sentLevel', L); main.querySelectorAll('#lv button').forEach(x => x.classList.toggle('on', x === b)); next(); };
  main.querySelector('#nx').onclick = next;
  main.querySelector('#py').onchange = (e) => { store.setting('sentPy', e.target.checked); total--; next(); };
  next();
}
