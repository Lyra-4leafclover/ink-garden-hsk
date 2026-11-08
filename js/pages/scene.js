import { esc, toPy, pyHtml, icons, shuffle } from '../lib/ui.js';
import { SCENES } from '../content/scenes.js';
import { findBySimp, getWord } from '../lib/data.js';
import { playWord, speak } from '../lib/audio.js';
import * as store from '../lib/store.js';

export async function render(main, [id]) {
  const i = SCENES.findIndex(s => s.id === id); const sc = SCENES[i];
  if (!sc) { main.innerHTML = '<div class="wrap"><h1>Scene not found</h1><a href="#/scenes">All scenes</a></div>'; return; }
  const prev = SCENES[(i - 1 + SCENES.length) % SCENES.length], next = SCENES[(i + 1) % SCENES.length];
  const ent = await Promise.all(sc.spots.map(s => findBySimp(s[0])));
  main.innerHTML = `<div class="wrap">
    <div class="row" style="justify-content:space-between;margin:18px 0 8px"><a href="#/scenes" class="btn sm ghost">${icons.back} All scenes</a><div class="row"><a class="btn sm ghost" href="#/scene/${prev.id}">${icons.back} ${prev.zh}</a><a class="btn sm ghost" href="#/scene/${next.id}">${next.zh} ${icons.next}</a></div></div>
    <div class="row" style="justify-content:space-between;align-items:flex-end;margin-bottom:12px"><div><div class="eyebrow">Picture scene · HSK ${sc.lv}+</div><h1 style="margin:0"><span class="zh">${sc.zh}</span> <span style="font-size:.6em">${esc(sc.en)}</span></h1></div>
    <div class="seg" id="mode"><button data-m="explore" class="on">Labels</button><button data-m="tap">Tap to reveal</button><button data-m="quiz">Quiz me</button><button data-m="listen">Listening quiz</button></div></div>
    <div id="qbar" class="card flat" style="display:none;margin-bottom:12px;padding:12px 16px"></div>
    <div class="scene" id="sc"><img src="art/scene-${sc.id}.webp" alt="${esc(sc.en)} scene">${sc.spots.map(([zh, en, x, y], k) => `<button class="hot" data-k="${k}" style="left:${x}%;top:${y}%" aria-label="${esc(zh)} ${esc(en)}"><span class="dot"></span><span class="lbl">${esc(zh)}<small>${esc(toPy(zh))}</small></span></button>`).join('')}</div>
    <div id="info" class="card" style="margin-top:14px"><span class="muted">Tap any dot in the picture.</span></div>
    <section class="section"><div class="section-title"><h2>Word list</h2></div>
    <div class="words">${sc.spots.map(([zh, en], k) => `<button class="wcard" data-k="${k}" style="text-align:left"><div class="hz">${esc(zh)}</div><div class="py">${pyHtml(toPy(zh), { join: false })}</div><div class="mn">${esc(en)}</div>${ent[k] ? `<span class="chip" style="margin-top:4px">HSK ${ent[k].lv}</span>` : ''}</button>`).join('')}</div></section></div>`;
  const $ = (s) => main.querySelector(s), scEl = $('#sc'), info = $('#info'), qbar = $('#qbar');
  let mode = 'explore', quiz = null;
  if (innerWidth < 640) setTimeout(() => setMode('tap'));
  async function say(k) {
    const e = ent[k];
    if (e) { const w = await getWord(e.id); if (w) return playWord(w); }
    speak(sc.spots[k][0]);
  }
  function show(k) {
    const [zh, en] = sc.spots[k], e = ent[k];
    scEl.querySelectorAll('.hot').forEach(h => h.classList.toggle('on', +h.dataset.k === k));
    info.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:16px"><button class="play" id="pl">${icons.play}</button><div><div class="zh" style="font-size:2rem;line-height:1.1">${esc(zh)}</div><div>${pyHtml(toPy(zh), { join: false })}</div></div><div style="flex:1"><b>${esc(en)}</b>${e ? `<div class="small muted">HSK ${e.lv} · <a href="#/word/${e.id}">open word, stroke order &amp; tracing →</a></div>` : `<div class="small muted"><a href="#/practice/${encodeURIComponent(zh)}">practise writing →</a></div>`}</div></div>`;
    info.querySelector('#pl').onclick = () => say(k);
  }
  function newQ() {
    if (!quiz.order.length) {
      const pct = Math.round(quiz.right / quiz.total * 100);
      qbar.innerHTML = `<b>Finished!</b> ${quiz.right} / ${quiz.total} first-try correct (${pct}%). <button class="btn sm" id="again">Again</button>`;
      const best = store.get().scenes ||= {}; if (!best[sc.id] || pct > best[sc.id]) { best[sc.id] = pct; store.save(); }
      store.activity(3); qbar.querySelector('#again').onclick = () => setMode(mode); return;
    }
    quiz.cur = quiz.order.pop(); quiz.miss = 0;
    const [zh, en] = sc.spots[quiz.cur];
    qbar.innerHTML = `<div class="row" style="justify-content:space-between"><div>${mode === 'listen' ? `<button class="play" id="rp">${icons.play}</button> Listen and tap the right thing` : `Find: <b class="zh" style="font-size:1.5rem">${esc(zh)}</b> <span class="muted">${esc(toPy(zh))}</span>`}</div><span class="chip">${quiz.total - quiz.order.length} / ${quiz.total} · ✓ ${quiz.right}</span></div>`;
    if (mode === 'listen') { say(quiz.cur); qbar.querySelector('#rp').onclick = () => say(quiz.cur); }
  }
  function setMode(m) {
    mode = m; main.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    scEl.classList.toggle('labels-off', m !== 'explore');
    scEl.querySelectorAll('.hot').forEach(h => h.classList.remove('on', 'shown'));
    qbar.style.display = m === 'quiz' || m === 'listen' ? '' : 'none';
    if (qbar.style.display === '') { quiz = { order: shuffle(sc.spots.map((_, k) => k)).slice(0, Math.min(10, sc.spots.length)), right: 0 }; quiz.total = quiz.order.length; newQ(); }
  }
  scEl.onclick = (e) => {
    const h = e.target.closest('.hot'); if (!h) return; const k = +h.dataset.k;
    if (mode === 'explore' || mode === 'tap') { if (mode === 'tap') h.classList.add('shown'); show(k); say(k); return; }
    if (k === quiz.cur) { if (!quiz.miss) quiz.right++; h.classList.add('shown'); show(k); say(k); setTimeout(newQ, 900); }
    else { quiz.miss++; h.classList.add('wrong'); setTimeout(() => h.classList.remove('wrong'), 600); if (quiz.miss >= 2) scEl.querySelector(`.hot[data-k="${quiz.cur}"]`).classList.add('hint'); }
  };
  main.querySelectorAll('.wcard[data-k]').forEach(b => b.onclick = () => { show(+b.dataset.k); say(+b.dataset.k); scEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#mode').onclick = (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); };
}
