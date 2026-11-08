import { esc, icons, autoRuby, toPy, pyHtml, sayBtn } from '../lib/ui.js';
import { POEMS } from '../content/poems.js';
import { speak, stop } from '../lib/audio.js';
import * as store from '../lib/store.js';

const pauses = (line) => {
  const chars = [...line.replace(/[，。？！；、：]/g, '')];
  const n = chars.length, cut = n === 7 ? [2, 4] : n === 5 ? [2] : n === 4 ? [2] : n === 6 ? [2, 4] : [];
  return chars.map((c, i) => c + (cut.includes(i + 1) ? '<span class="pz">/</span>' : '')).join('');
};

export async function render(main, [id]) {
  const p = POEMS.find(x => x.id === +id);
  if (!p) { main.innerHTML = '<div class="wrap"><h1>Poem not found</h1><a href="#/poems">All poems</a></div>'; return; }
  const all = store.get().poems ||= {}; const me = all[p.id] ||= {};
  const prev = POEMS[(p.id - 2 + POEMS.length) % POEMS.length], next = POEMS[p.id % POEMS.length];
  const opt = { py: store.setting('poemPy') !== false, en: store.setting('poemEn') !== false, vert: !!store.setting('poemVert'), rh: false };
  main.innerHTML = `<div class="wrap narrow">
    <div class="row" style="justify-content:space-between;margin:18px 0"><a href="#/poems" class="btn sm ghost">${icons.back} All poems</a><div class="row"><a class="btn sm ghost" href="#/poem/${prev.id}">${icons.back}</a><span class="muted small">${p.id} / ${POEMS.length}</span><a class="btn sm ghost" href="#/poem/${next.id}">${icons.next}</a></div></div>
    <article class="card poem-sheet">
      <div class="eyebrow">${p.d} · ${esc(p.f)} · HSK ${p.lv}+</div>
      <h1 class="zh" style="margin:6px 0 0">${esc(p.t)}</h1><div class="muted">${esc(toPy(p.t))}</div>
      <div style="margin:4px 0 16px"><span class="zh">${esc(p.a)}</span> <span class="muted">${esc(toPy(p.a))} · ${esc(p.th)}</span></div>
      <div class="row" style="justify-content:center;margin-bottom:16px" id="tg">
        <button class="btn sm red" id="read">${icons.play} Read aloud</button>
        <button class="chip ${opt.py ? 'on' : ''}" data-o="py">Pinyin</button><button class="chip ${opt.en ? 'on' : ''}" data-o="en">English</button><button class="chip" data-o="rh">Rhythm</button><button class="chip ${opt.vert ? 'on' : ''}" data-o="vert">竖排 Vertical</button><button class="chip" data-o="rec">Recite test</button>
        <button class="chip ${me.fav ? 'on' : ''}" id="fav">★ Save</button></div>
      <div class="poem-body" id="pb"></div>
    </article>
    <section class="section"><div class="section-title"><h2>Background</h2></div><p style="font-size:1.05rem">${esc(p.b)}</p></section>
    <section class="section"><div class="section-title"><h2>Word notes</h2></div><div class="grid g2">${p.n.map(([w, d]) => `<div class="card flat row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px">${sayBtn(w, 'sm')}<div><span class="zh" style="font-size:1.4rem">${esc(w)}</span> <span class="small">${pyHtml(toPy(w), { join: false })}</span><div class="muted small">${esc(d)}</div></div></div>`).join('')}</div></section>
    <section class="section"><div class="section-title"><h2>Practise</h2></div><div class="row"><a class="btn ghost" href="#/practice/${encodeURIComponent(p.z.join('').replace(/[^\p{Script=Han}]/gu, '').slice(0, 10))}">${icons.brush} Trace the first line</a><a class="btn ghost" href="#/checker/${encodeURIComponent(p.z[0].replace(/[，。？！；]/g, ''))}">${icons.mic} Check your reading</a><button class="btn ${me.done ? 'jade' : ''}" id="done">${me.done ? '✓ Memorised' : 'Mark as memorised'}</button></div></section>
  </div>`;
  const pb = main.querySelector('#pb');
  let rec = false, hidden = new Set();
  function draw() {
    pb.className = 'poem-body' + (opt.vert ? ' pvert' : '');
    if (opt.vert) { pb.innerHTML = `<div class="vlines">${p.z.map(l => `<div class="vl zh">${opt.rh ? pauses(l) : esc(l)}</div>`).join('')}</div>${opt.en ? `<div class="ven">${p.e.map(esc).join('<br>')}</div>` : ''}`; return; }
    pb.innerHTML = p.z.map((l, i) => `<div class="poem-line" data-i="${i}">
      <div class="pl-zh">${rec ? [...l].map((c, k) => /\p{Script=Han}/u.test(c) ? `<span class="rc ${hidden.has(i + ':' + k) ? 'h' : ''}" data-k="${i}:${k}">${c}</span>` : c).join('') : opt.rh ? `<span class="zh">${pauses(l)}</span>` : opt.py ? autoRuby(l) : `<span class="zh">${esc(l)}</span>`}</div>
      ${opt.en && !rec ? `<div class="pl-en">${esc(p.e[i])}</div>` : ''}</div>`).join('') + (rec ? `<p class="muted small" style="text-align:center">Tap a blank to reveal it. <button class="btn sm ghost" id="more">Hide more</button></p>` : '');
    pb.querySelector('#more')?.addEventListener('click', hideMore);
  }
  function hideMore() {
    const keys = []; p.z.forEach((l, i) => [...l].forEach((c, k) => { if (/\p{Script=Han}/u.test(c) && !hidden.has(i + ':' + k)) keys.push(i + ':' + k); }));
    for (let n = Math.ceil(keys.length / 3); n > 0 && keys.length; n--) hidden.add(keys.splice(Math.floor(Math.random() * keys.length), 1)[0]);
    draw();
  }
  pb.onclick = (e) => { const r = e.target.closest('.rc.h'); if (r) { r.classList.remove('h'); hidden.delete(r.dataset.k); } };
  main.querySelector('#tg').onclick = (e) => {
    const b = e.target.closest('[data-o]'); if (!b) return; const o = b.dataset.o;
    if (o === 'rec') { rec = !rec; hidden.clear(); if (rec) { opt.vert = false; hideMore(); } b.classList.toggle('on', rec); }
    else { opt[o] = !opt[o]; b.classList.toggle('on', opt[o]); if (o !== 'rh') store.setting({ py: 'poemPy', en: 'poemEn', vert: 'poemVert' }[o], opt[o]); }
    main.querySelector('[data-o=vert]').classList.toggle('on', opt.vert);
    draw();
  };
  let reading = false;
  main.querySelector('#read').onclick = async (e) => {
    const btn = e.currentTarget;
    if (reading) { reading = false; stop(); btn.innerHTML = `${icons.play} Read aloud`; return; }
    reading = true; btn.innerHTML = '■ Stop';
    for (let i = 0; i < p.z.length && reading; i++) {
      pb.querySelectorAll('.poem-line').forEach(x => x.classList.toggle('cur', +x.dataset.i === i));
      await speak(p.z[i], { rate: 0.7 });
    }
    reading = false; btn.innerHTML = `${icons.play} Read aloud`; pb.querySelectorAll('.poem-line').forEach(x => x.classList.remove('cur'));
  };
  main.querySelector('#fav').onclick = (e) => { me.fav = !me.fav; e.currentTarget.classList.toggle('on', me.fav); store.save(); };
  main.querySelector('#done').onclick = (e) => { me.done = !me.done; store.save(); if (me.done) store.activity(3); e.currentTarget.textContent = me.done ? '✓ Memorised' : 'Mark as memorised'; e.currentTarget.classList.toggle('jade', me.done); };
  draw();
  return () => { reading = false; stop(); };
}
