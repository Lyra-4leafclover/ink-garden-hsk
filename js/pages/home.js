import { esc, pyHtml, playBtn, LEVEL_INFO } from '../lib/ui.js';
import { loadLevel } from '../lib/data.js';
import { playWord } from '../lib/audio.js';
import * as store from '../lib/store.js';

export async function render(main) {
  const st = store.get();
  const known = (L) => Object.keys(st.cards).filter(id => id.startsWith(L + '-') && store.status(id) === 'known').length;
  const due = store.dueCards().length;
  const feats = [
    ['笔', 'Stroke order & tracing', 'Animated recommended stroke order for every character. Trace with your finger or Apple Pencil.', '#/practice'],
    ['音', 'Pinyin & tones', 'Clickable pinyin chart with native-speaker audio for all 1,700 syllables.', '#/pinyin'],
    ['听', 'Pronunciation checker', 'Speak into the mic — see which sounds and tones you nailed.', '#/checker'],
    ['法', 'Grammar', 'Every HSK grammar point, explained simply with examples.', '#/grammar'],
    ['句', 'Sentence building', 'Learn Chinese word order and build sentences tile by tile.', '#/sentences'],
    ['画', 'Picture scenes', 'Tap things in painted scenes to learn everyday words.', '#/scenes'],
    ['诗', '56 classic poems', 'How to read Tang & Song poetry, with line-by-line notes.', '#/poems'],
    ['书', 'Read real novels', 'Lu Xun and Journey to the West — tap any word for help.', '#/reading'],
    ['考', 'Mock tests', '30 full mock exams per level, timed and scored like the real HSK.', '#/tests'],
    ['卡', 'Flashcards', 'Spaced repetition that shows words right before you forget them.', '#/review'],
    ['源', 'Resources', 'The best apps, books, podcasts and channels, hand-picked.', '#/resources'],
    ['进', 'My progress', 'Streaks, words learned and test history — saved on your device.', '#/progress'],
  ];
  main.innerHTML = `
  <section class="hero"><div class="hero-art" role="img" aria-label="Ink painting of misty mountains, a pavilion and plum blossoms"></div>
    <div class="hero-inner">
      <div class="eyebrow">A slow, beautiful path to Chinese</div>
      <h1><span class="zh">墨园</span>Ink Garden</h1>
      <p>Everything you need for HSK 1 to 6 — stroke order, tracing, native audio, grammar, poetry, novels and mock exams — in one quiet place.</p>
      <div class="row" style="margin-top:22px">
        <a class="btn red" href="#/level/1">Start with HSK 1</a>
        <a class="btn ghost" href="#/review">${due ? `Review ${due} card${due > 1 ? 's' : ''}` : 'Flashcards'}</a>
        ${store.streak() ? `<span class="chip gold">🔥 ${store.streak()} day streak</span>` : ''}
      </div>
    </div>
  </section>
  <div class="wrap">
    <div class="card wotd" id="wotd"><div class="big">…</div><div></div></div>
    <section class="section">
      <div class="section-title"><h2>Choose your level</h2><span class="muted">HSK 2.0 · ~5,000 words in total</span></div>
      <div class="grid g3">
      ${[1, 2, 3, 4, 5, 6].map(L => { const i = LEVEL_INFO[L]; const k = known(L); return `
        <a class="card level-card" href="#/level/${L}">
          <div class="lc-art" style="background-image:url(art/${i.art}.webp)"></div>
          <div class="lc-body">
            <div class="lc-num">HSK ${L}<span>${i.zh} · ${i.name}</span></div>
            <div class="muted small">${i.desc}</div>
            <div class="row small"><span>${i.words.toLocaleString()} words total</span><span class="spacer"></span><span class="muted">${k} known</span></div>
            <div class="bar"><i style="width:${Math.min(100, k / (L === 1 ? 150 : [0, 150, 150, 300, 600, 1300, 2500][L]) * 100)}%"></i></div>
          </div></a>`; }).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-title"><h2>Everything inside</h2></div>
      <div class="grid g3">
        ${feats.map(f => `<a class="card tile" href="${f[3]}"><div class="ic">${f[0]}</div><div><h3>${f[1]}</h3><p>${f[2]}</p></div></a>`).join('')}
      </div>
    </section>
    <section class="section">
      <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:22px;align-items:center">
        <div style="border-radius:14px;overflow:hidden;aspect-ratio:3/2;background:url(art/study.webp) center/cover"></div>
        <div><div class="eyebrow">How to use Ink Garden</div><h2>A gentle daily rhythm</h2>
          <ol style="padding-left:1.2em;margin:0;color:var(--ink2)">
            <li>Learn <b>10–15 new words</b> in your level (tap + to add them to flashcards).</li>
            <li><b>Trace</b> each new character a few times — stroke order sticks fast.</li>
            <li>Do your <b>flashcard review</b>; it only shows what's due.</li>
            <li>Read one <b>grammar point</b> and say the examples out loud with the checker.</li>
            <li>Once a week, take a <b>mock test</b>. Reward yourself with a poem.</li>
          </ol></div>
      </div>
    </section>
  </div>`;
  // word of the day: deterministic by date across HSK1-4
  const d = new Date(); const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  const L = (seed % 4) + 1; const ws = await loadLevel(L); const w = ws[(seed * 7919) % ws.length];
  const el = main.querySelector('#wotd');
  el.innerHTML = `<div class="big">${esc(w.s)}</div><div><div class="eyebrow">Word of the day · HSK ${w.lv}</div>
    <div class="row" style="margin:6px 0"><span style="font-size:1.6rem;font-weight:500">${pyHtml(w.p)}</span>${playBtn('data-play')}</div>
    <div class="muted">${esc(w.m.slice(0, 3).join('; '))}</div>
    ${w.ex[0] ? `<div class="zh" style="margin-top:8px;font-size:1.15rem">${esc(w.ex[0].zh.join(''))}</div><div class="muted small">${esc(w.ex[0].en)}</div>` : ''}
    <div class="row" style="margin-top:12px"><a class="btn sm" href="#/word/${w.id}">Open word</a><a class="btn sm ghost" href="#/practice/${encodeURIComponent(w.s)}">Trace it</a></div></div>`;
  el.querySelector('[data-play]').onclick = (e) => playWord(w, e.currentTarget);
}
