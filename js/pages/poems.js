import { esc } from '../lib/ui.js';
import { POEMS } from '../content/poems.js';
import * as store from '../lib/store.js';

export async function render(main) {
  const st = store.get().poems ||= {};
  const dyn = [...new Set(POEMS.map(p => p.d))];
  main.innerHTML = `<div class="wrap">
    <div class="hero-band" style="background-image:url(art/poems.webp)"><div><div class="eyebrow" style="color:#fff">诗词 · Classical poetry</div><h1>${POEMS.length} poems, explained</h1><p>From Li Bai to Su Shi to Xu Zhimo — every poem has pinyin, a line-by-line translation, word notes, background and read-aloud audio.</p>
    <a class="btn" href="#/poems/guide">How to read a Chinese poem →</a></div></div>
    <div class="row" style="margin:22px 0 14px"><div class="seg" id="f"><button data-f="" class="on">All</button>${dyn.map(d => `<button data-f="${d}">${d}</button>`).join('')}<button data-f="easy">Easiest first</button><button data-f="fav">★ Saved</button></div>
    <input type="search" id="q" placeholder="Search title, poet, theme…" style="max-width:260px"></div>
    <div class="grid g3" id="list"></div></div>`;
  const list = main.querySelector('#list');
  let f = '', q = '';
  function draw() {
    let ps = POEMS.filter(p => (!f || f === 'easy' || (f === 'fav' ? st[p.id]?.fav : p.d === f)) && (!q || (p.t + p.a + p.th + p.e.join(' ')).toLowerCase().includes(q)));
    if (f === 'easy') ps = [...ps].sort((a, b) => a.lv - b.lv || a.z.join('').length - b.z.join('').length);
    list.innerHTML = ps.map(p => `<a class="card poem-card" href="#/poem/${p.id}"><div class="row" style="justify-content:space-between"><span class="eyebrow">${p.id}. ${p.d} · ${esc(p.f)}</span><span class="chip">HSK ${p.lv}+</span></div>
      <h3 class="zh">${esc(p.t)}${st[p.id]?.fav ? ' <span style="color:var(--gold)">★</span>' : ''}${st[p.id]?.done ? ' <span style="color:var(--jade)">✓</span>' : ''}</h3><div class="muted small">${esc(p.a)} · ${esc(p.th)}</div>
      <div class="zh pv">${esc(p.z.slice(0, 2).join(''))}</div><div class="muted small">${esc(p.e[0])}</div></a>`).join('') || '<p class="muted">No poems match.</p>';
  }
  main.querySelector('#f').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; f = b.dataset.f; main.querySelectorAll('#f button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  main.querySelector('#q').oninput = (e) => { q = e.target.value.toLowerCase().trim(); draw(); };
  draw();
}
