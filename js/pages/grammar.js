import { esc, autoRuby, sayBtn, segment, shuffle, LEVEL_INFO } from '../lib/ui.js';
import { GRAMMAR } from '../content/grammar.js';
import * as store from '../lib/store.js';

export async function render(main, [lv]) {
  const L = +(lv || store.setting('grammarLevel') || 1);
  store.setting('grammarLevel', L);
  const pts = GRAMMAR[L];
  const done = store.get().grammar ||= {};
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">语法 · Grammar</div><h1>Grammar, level by level</h1>
    <p class="lead">${Object.values(GRAMMAR).flat().length} key grammar points from HSK 1 to 6. Each one has a pattern, a plain-English explanation, example sentences with pinyin and audio, and a quick word-order check.</p></div>
    <div class="seg" style="margin-bottom:22px;flex-wrap:wrap">${[1, 2, 3, 4, 5, 6].map(l => `<a href="#/grammar/${l}" class="${l === L ? 'on' : ''}">HSK ${l} · ${LEVEL_INFO[l].name}</a>`).join('')}</div>
    <div class="gram-layout">
      <aside class="gram-toc card flat"><div class="eyebrow">HSK ${L} · ${pts.length} points</div><ol>${pts.map((p, i) => `<li><a href="#g${i}" data-jump="g${i}">${done[`${L}-${i}`] ? '✓ ' : ''}${esc(p[0])}</a></li>`).join('')}</ol>
      <a class="btn sm" href="#/sentences" style="margin-top:10px">Sentence building →</a></aside>
      <div class="gram-list">${pts.map((p, i) => `<article class="card gram" id="g${i}">
        <div class="eyebrow">HSK ${L} · Point ${i + 1}</div>
        <h2>${esc(p[0])}</h2>
        <div class="pattern zh">${esc(p[1])}</div>
        <p>${esc(p[2])}</p>
        <div class="gram-ex">${p[3].map(([zh, en]) => `<div class="exline"><div class="row" style="flex-wrap:nowrap;align-items:flex-end;gap:10px">${sayBtn(zh, 'sm')}${autoRuby(zh)}</div><div class="en">${esc(en)}</div></div>`).join('')}</div>
        <details class="gq" data-i="${i}"><summary>Quick check: put the words in order</summary><div class="gqbody"></div></details>
      </article>`).join('')}</div>
    </div></div>`;
  main.querySelectorAll('[data-jump]').forEach(a => a.onclick = (e) => { e.preventDefault(); main.querySelector('#' + a.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  main.querySelectorAll('details.gq').forEach(d => d.addEventListener('toggle', () => {
    if (!d.open || d.dataset.ready) return; d.dataset.ready = 1;
    const i = +d.dataset.i, ex = pts[i][3][Math.floor(Math.random() * pts[i][3].length)];
    builder(d.querySelector('.gqbody'), ex[0], ex[1], () => { done[`${L}-${i}`] = 1; store.save(); store.activity(); });
  }));
}

export function builder(el, zh, en, onDone, given, pys) {
  const clean = zh.replace(/[。！？，、：“”"…]/g, ' ').trim();
  const toks = given || segment(clean).filter(t => t.trim());
  let order = shuffle(toks.map((t, i) => i));
  if (toks.length > 1 && order.every((v, i) => v === i)) order = order.reverse();
  const picked = [];
  el.innerHTML = `<p class="muted small" style="margin:8px 0">“${esc(en)}”</p><div class="slots answer"></div><div class="tiles bank"></div><div class="row" style="margin-top:10px"><button class="btn sm ghost" data-a="reset">Reset</button><button class="btn sm ghost" data-a="show">Show answer</button>${sayBtn(zh, 'sm')}</div><div class="status"></div>`;
  const ans = el.querySelector('.answer'), bank = el.querySelector('.bank'), st = el.querySelector('.status');
  function draw() {
    ans.innerHTML = picked.map((k, j) => `<button class="tile-w" data-j="${j}">${esc(toks[k])}</button>`).join('') || '<span class="muted small">Tap the words below in the right order</span>';
    bank.innerHTML = order.map(k => picked.includes(k) ? `<span class="tile-w used">${esc(toks[k])}</span>` : `<button class="tile-w" data-k="${k}">${esc(toks[k])}${pys ? `<small>${esc(pys[k])}</small>` : ''}</button>`).join('');
    if (picked.length === toks.length) {
      const ok = picked.map(k => toks[k]).join('') === toks.join('');
      st.className = 'status ' + (ok ? 'good' : 'bad');
      st.textContent = ok ? '正确！Correct.' : 'Not quite — tap a word in your answer to remove it.';
      if (ok) onDone?.();
    } else { st.className = 'status'; st.textContent = ''; }
  }
  el.onclick = (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.say) return;
    if (b.dataset.k) picked.push(+b.dataset.k);
    else if (b.dataset.j) picked.splice(+b.dataset.j, 1);
    else if (b.dataset.a === 'reset') picked.length = 0;
    else if (b.dataset.a === 'show') { picked.length = 0; toks.forEach((_, i) => picked.push(i)); }
    draw();
  };
  draw();
}
