import { esc, icons, pyHtml, rubyHtml, shuffle } from '../lib/ui.js';
import { getWord, loadLevel } from '../lib/data.js';
import { playWord } from '../lib/audio.js';
import * as store from '../lib/store.js';

export async function render(main) {
  const due = store.dueCards();
  const total = Object.keys(store.get().cards).length;
  const dir = store.setting('cardDir') || 'zh';
  if (!due.length) {
    main.innerHTML = `<div class="wrap narrow"><div class="page-head"><div class="eyebrow">复习 · Spaced repetition</div><h1>Flashcards</h1>
      <p class="lead">${total ? `All caught up! You have ${total} words in your deck — come back later when more are due.` : 'Your deck is empty. Add words from any word page, level list, test result or the novel reader.'}</p></div>
      <div class="card"><h3 style="margin-top:0">Add a starter pack</h3><div class="row">${[1, 2, 3, 4, 5, 6].map(l => `<button class="btn sm ghost" data-l="${l}">+ 20 new HSK ${l} words</button>`).join('')}</div></div>
      <div class="callout jade" style="margin-top:18px"><b>How it works:</b> each time you rate a card, its next review is scheduled — “Again” brings it back in a minute, “Good” in a few days, “Easy” even later. Words you know well appear less and less often. Ten minutes a day is enough.</div></div>`;
    main.querySelectorAll('[data-l]').forEach(b => b.onclick = async () => { const ws = await loadLevel(+b.dataset.l); const fresh = ws.filter(w => !store.card(w.id)).slice(0, 20); fresh.forEach(w => store.addCard(w.id)); render(main); });
    return;
  }
  const queue = shuffle(due).slice(0, 50);
  let i = 0, flipped = false, done = 0;
  main.innerHTML = `<div class="wrap narrow"><div class="row" style="justify-content:space-between;margin:18px 0"><h1 style="margin:0">Flashcards</h1><div class="row"><div class="seg" id="dir"><button data-d="zh" class="${dir === 'zh' ? 'on' : ''}">汉字 → English</button><button data-d="en" class="${dir === 'en' ? 'on' : ''}">English → 汉字</button><button data-d="au" class="${dir === 'au' ? 'on' : ''}">Audio</button></div></div></div>
    <div class="bar" style="margin-bottom:14px"><i id="pg" style="width:0"></i></div><div id="fc"></div>
    <p class="muted small" style="text-align:center">Keyboard: Space = flip · 1 Again · 2 Hard · 3 Good · 4 Easy</p></div>`;
  const fc = main.querySelector('#fc');
  let curDir = dir;
  async function draw() {
    if (i >= queue.length) { fc.innerHTML = `<div class="card" style="text-align:center"><div class="big-score">${done}</div><h2>cards reviewed — 太棒了!</h2><div class="row" style="justify-content:center"><a class="btn" href="#/progress">See progress</a><a class="btn ghost" href="#/">Home</a></div></div>`; return; }
    const w = await getWord(queue[i]); if (!w) { i++; return draw(); }
    main.querySelector('#pg').style.width = (i / queue.length * 100) + '%';
    const front = curDir === 'zh' ? `<div class="zh fc-hz">${esc(w.s)}</div>` : curDir === 'en' ? `<div class="fc-en">${esc(w.m.slice(0, 3).join('; '))}</div><div class="muted small">${esc(w.pos?.join(', ') || '')}</div>` : `<button class="play" id="fpl" style="width:72px;height:72px">${icons.play}</button><div class="muted small" style="margin-top:8px">Listen — what is it?</div>`;
    const ex = w.ex?.[0];
    const back = `<div class="zh fc-hz">${esc(w.s)}</div><div style="font-size:1.4rem">${pyHtml(w.p, { join: false })}</div><div class="fc-en">${esc(w.m.slice(0, 4).join('; '))}</div>${ex ? `<div style="margin-top:12px">${rubyHtml(ex.zh, ex.py)}<div class="muted small">${esc(ex.en)}</div></div>` : ''}<div class="small muted" style="margin-top:8px">HSK ${w.lv} · <a href="#/word/${w.id}">details</a></div>`;
    const lbl = (g) => store.nextIvlLabel(w.id, g);
    fc.innerHTML = `<div class="card flash ${flipped ? 'flipped' : ''}" id="card">${flipped ? back : front}${flipped ? '' : '<div class="muted small" style="margin-top:18px">Tap to reveal</div>'}</div>
      <div class="row" style="justify-content:center;margin-top:14px">${flipped ? `<button class="btn grade g0" data-g="0">Again<small>${lbl(0)}</small></button><button class="btn grade g1" data-g="1">Hard<small>${lbl(1)}</small></button><button class="btn grade g2" data-g="2">Good<small>${lbl(2)}</small></button><button class="btn grade g3" data-g="3">Easy<small>${lbl(3)}</small></button>` : `<button class="btn" id="flip">Show answer</button>`}</div>`;
    const play = (b) => playWord(w, b);
    fc.querySelector('#fpl')?.addEventListener('click', (e) => { e.stopPropagation(); play(e.currentTarget); });
    if (curDir === 'au' && !flipped) play();
    if (flipped) play();
    fc.querySelector('#card').onclick = (e) => { if (!flipped && !e.target.closest('button')) flip(); };
    fc.querySelector('#flip')?.addEventListener('click', flip);
    fc.querySelectorAll('[data-g]').forEach(b => b.onclick = () => grade(+b.dataset.g));
  }
  function flip() { flipped = true; draw(); }
  function grade(g) { store.review(queue[i], g); if (g === 0) queue.push(queue[i]); i++; done++; flipped = false; draw(); }
  const key = (e) => { if (e.target.matches('input,textarea')) return; if (e.key === ' ') { e.preventDefault(); if (!flipped) flip(); } if (flipped && '1234'.includes(e.key)) grade(+e.key - 1); };
  document.addEventListener('keydown', key);
  main.querySelector('#dir').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; curDir = b.dataset.d; store.setting('cardDir', curDir); main.querySelectorAll('#dir button').forEach(x => x.classList.toggle('on', x === b)); flipped = false; draw(); };
  draw();
  return () => document.removeEventListener('keydown', key);
}
