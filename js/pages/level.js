import { esc, pyHtml, LEVEL_INFO, toast } from '../lib/ui.js';
import { loadLevel } from '../lib/data.js';
import * as store from '../lib/store.js';

const UNIT = 20, PAGE = 100;
export async function render(main, [Ls]) {
  const L = +Ls, info = LEVEL_INFO[L];
  const words = await loadLevel(L);
  let filter = 'all', q = '', page = 0;
  main.innerHTML = `<div class="wrap">
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));align-items:center;gap:26px;margin-bottom:26px">
      <div><div class="eyebrow">HSK ${L} · ${info.zh} · ${info.name}</div><h1>HSK ${L} words</h1>
        <p class="lead">${words.length} new words at this level (${info.words.toLocaleString()} total including lower levels). ${info.desc}</p>
        <div class="row"><a class="btn" href="#/grammar/${L}">Grammar HSK ${L}</a><a class="btn ghost" href="#/tests/${L}">Mock tests</a><a class="btn ghost" href="#/review?level=${L}">Flashcards</a></div>
        <div style="margin-top:16px" id="lvstat"></div></div>
      <div class="card" style="padding:0;overflow:hidden;max-width:420px;justify-self:center;width:100%"><img class="art-img" src="art/${info.art}.webp" alt="" style="aspect-ratio:1;object-fit:cover;width:100%"></div>
    </div>
    <div class="toolbar">
      <input type="search" id="q" placeholder="Filter by 汉字, pinyin or English">
      <div class="seg" id="flt"><button data-f="all" class="on">All</button><button data-f="new">New</button><button data-f="learning">Learning</button><button data-f="known">Known</button></div>
    </div>
    <div id="list"></div><div class="pager" id="pager"></div>
  </div>`;
  const list = main.querySelector('#list'), pager = main.querySelector('#pager');
  const plain = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toLowerCase();
  function stat() {
    const k = words.filter(w => store.status(w.id) === 'known').length, l = words.filter(w => store.status(w.id) === 'learning').length;
    main.querySelector('#lvstat').innerHTML = `<div class="row small"><span class="chip jade">${k} known</span><span class="chip gold">${l} learning</span><span class="chip">${words.length - k - l} new</span></div>`;
  }
  function draw() {
    const qq = plain(q);
    const items = words.map((w, i) => ({ w, i })).filter(({ w }) => {
      const s = store.status(w.id);
      if (filter === 'new' && s) return false;
      if (filter !== 'all' && filter !== 'new' && s !== filter) return false;
      if (!q) return true;
      return w.s.includes(q) || plain(w.p).includes(qq) || w.m.join(' ').toLowerCase().includes(q.toLowerCase());
    });
    const grouped = !q && filter === 'all';
    const pages = Math.ceil(items.length / PAGE); page = Math.min(page, Math.max(0, pages - 1));
    const slice = items.slice(page * PAGE, (page + 1) * PAGE);
    let html = '', lastUnit = -1, buf = [];
    const flush = () => { if (buf.length) { html += `<div class="words">${buf.join('')}</div>`; buf = []; } };
    for (const { w, i } of slice) {
      const u = Math.floor(i / UNIT);
      if (grouped && u !== lastUnit) { flush(); lastUnit = u; html += `<div class="unit-head"><h3>Unit ${u + 1}</h3><span class="muted small">words ${u * UNIT + 1}–${Math.min(words.length, (u + 1) * UNIT)}</span><button class="btn sm ghost" data-addunit="${u}">+ Add unit to flashcards</button><a class="btn sm ghost" href="#/review?level=${L}&unit=${u}">Study unit</a></div>`; }
      buf.push(`<a class="wcard" href="#/word/${w.id}"><span class="mark ${store.status(w.id)}"></span><span class="hz">${esc(w.s)}</span><span class="py">${pyHtml(w.p)}</span><span class="en">${esc(w.m.slice(0, 2).join('; '))}</span></a>`);
    }
    flush();
    list.innerHTML = html || '<div class="empty">No words match.</div>';
    pager.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, p) => `<button class="chip ${p === page ? 'on' : ''}" data-p="${p}">${p * PAGE + 1}–${Math.min(items.length, (p + 1) * PAGE)}</button>`).join('') : '';
    stat();
  }
  main.querySelector('#q').oninput = (e) => { q = e.target.value.trim(); page = 0; draw(); };
  main.querySelector('#flt').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; page = 0; main.querySelectorAll('#flt button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  pager.onclick = (e) => { const b = e.target.closest('[data-p]'); if (!b) return; page = +b.dataset.p; draw(); list.scrollIntoView({ behavior: 'smooth' }); };
  list.onclick = (e) => {
    const b = e.target.closest('[data-addunit]'); if (!b) return; e.preventDefault();
    const u = +b.dataset.addunit; let n = 0;
    words.slice(u * UNIT, (u + 1) * UNIT).forEach(w => { if (store.addCard(w.id)) n++; });
    toast(n ? `Added ${n} words to flashcards` : 'Already in your flashcards'); draw();
  };
  draw();
}
