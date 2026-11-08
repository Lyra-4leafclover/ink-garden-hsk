import { esc, pyHtml, joinPy, playBtn, rubyHtml, icons, toast } from '../lib/ui.js';
import { getWord, loadLevel, loadIndex } from '../lib/data.js';
import { playWord, speak } from '../lib/audio.js';
import { writer, strokeStrip, gridSvg, practiceCanvas, charData } from '../lib/hanzi.js';
import * as store from '../lib/store.js';

export const POS = { n: 'noun', v: 'verb', a: 'adjective', d: 'adverb', m: 'number', q: 'measure word', r: 'pronoun', p: 'preposition', c: 'conjunction', u: 'particle', y: 'modal particle', e: 'interjection', f: 'direction/location', t: 'time word', s: 'place word', vn: 'verb-noun', ad: 'adverbial adj.', an: 'noun-like adj.', i: 'idiom', l: 'set phrase', nz: 'proper noun', nr: 'name', ns: 'place name', b: 'attributive', z: 'descriptive', o: 'onomatopoeia', k: 'suffix', h: 'prefix', g: 'morpheme', vd: 'verb', nt: 'organisation', j: 'abbreviation', x: 'other' };

export async function render(main, [id]) {
  const w = await getWord(id);
  if (!w) { main.innerHTML = '<div class="wrap"><div class="empty">Word not found.</div></div>'; return; }
  const words = await loadLevel(w.lv); const i = words.findIndex(x => x.id === id);
  const prev = words[i - 1], next = words[i + 1];
  const chars = [...w.s].filter(c => /\p{Script=Han}/u.test(c));
  main.innerHTML = `<div class="wrap">
    <div class="row small" style="margin-bottom:14px"><a href="#/level/${w.lv}">← HSK ${w.lv} words</a><span class="spacer"></span>
      ${prev ? `<a class="btn sm ghost" href="#/word/${prev.id}">${icons.back} ${esc(prev.s)}</a>` : ''}${next ? `<a class="btn sm ghost" href="#/word/${next.id}">${esc(next.s)} ${icons.next}</a>` : ''}</div>
    <div class="card"><div class="wd-head">
      <div><div class="wd-hz">${esc(w.s)}</div>
        <div class="wd-py">${pyHtml(w.p)}</div>
        <ul class="wd-en" style="padding-left:1.1em;margin:6px 0">${w.m.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
        <div class="facts"><span class="chip red">HSK ${w.lv}</span>${w.pos.slice(0, 3).map(p => POS[p] ? `<span class="chip">${POS[p]}</span>` : '').join('')}
          ${w.t && w.t !== w.s ? `<span class="chip indigo">Traditional: <span class="zh">${esc(w.t)}</span></span>` : ''}
          ${w.r ? `<span class="chip gold">Radical <span class="zh">${esc(w.r)}</span></span>` : ''}
          ${w.c?.length ? `<span class="chip jade">Measure word: <span class="zh">${esc(w.c.join('、'))}</span></span>` : ''}</div>
        ${w.o?.length ? `<div class="small muted">Other readings: ${w.o.map(o => `<b>${pyHtml(o.p)}</b> — ${esc(o.m.join('; '))}`).join(' · ')}</div>` : ''}
      </div>
      <div style="display:grid;gap:8px;min-width:200px">
        <button class="btn red" id="pNative">${icons.play.replace('<svg', '<svg style="fill:currentColor;stroke:none"')} ${w.a ? 'Native speaker' : 'Listen'}</button>
        <button class="btn ghost" id="pSlow">Slow</button>
        <a class="btn ghost" href="#/checker/${encodeURIComponent(w.s)}">${icons.mic} Check my pronunciation</a>
        <button class="btn ghost" id="addCard"></button>
        <button class="btn ghost" id="known"></button>
      </div>
    </div></div>

    <div class="tabs" role="tablist"><button data-t="strokes" class="on">Stroke order</button><button data-t="trace">Trace &amp; write</button><button data-t="examples">Examples (${w.ex.length})</button><button data-t="related">Related words</button></div>
    ${chars.length > 1 ? `<div class="charpick" id="cp">${chars.map((c, k) => `<button data-k="${k}" class="${k ? '' : 'on'}">${esc(c)}</button>`).join('')}</div>` : ''}
    <section id="tab"></section>
  </div>`;
  const $ = (s) => main.querySelector(s);
  $('#pNative').onclick = (e) => playWord(w, e.currentTarget);
  $('#pSlow').onclick = (e) => speak(w.s, { rate: 0.5, btn: e.currentTarget });
  const syncBtns = () => {
    $('#addCard').textContent = store.card(w.id) ? '✓ In flashcards' : '+ Add to flashcards';
    $('#known').textContent = store.status(w.id) === 'known' ? '★ Known' : '☆ Mark as known';
  };
  $('#addCard').onclick = () => { if (store.card(w.id)) { store.removeCard(w.id); toast('Removed from flashcards'); } else { store.addCard(w.id); store.activity(); toast('Added to flashcards'); } syncBtns(); };
  $('#known').onclick = () => { store.markKnown(w.id, store.status(w.id) !== 'known'); store.activity(); syncBtns(); };
  syncBtns();

  let tab = 'strokes', ck = 0, cleanups = [];
  const tabEl = $('#tab');
  function show() {
    cleanups.forEach(f => f()); cleanups = [];
    const ch = chars[ck];
    if (tab === 'strokes') {
      tabEl.innerHTML = `<div class="card"><div class="stroke-wrap">
        <div><div class="tz" id="anim">${gridSvg('mi')}<div class="hw"></div></div>
          <div class="ctrls"><button class="btn sm" id="aPlay">${icons.play.replace('<svg', '<svg style="fill:currentColor;stroke:none"')} Animate</button><button class="btn sm ghost" id="aLoop">Loop</button><button class="btn sm ghost" id="aStep">Next stroke</button></div></div>
        <div><h3 class="zh" style="font-size:2rem">${esc(ch)} <span class="muted" style="font-size:1rem;font-family:var(--ui)" id="sc"></span></h3>
          <p class="muted">Recommended (standard mainland) stroke order. Red is the stroke being written; grey strokes come later. The radical is highlighted in red in the animation.</p>
          <div class="strip" id="strip"></div>
          <div class="callout" style="margin-top:16px">Tip: say each stroke's direction as you write — top to bottom, left to right, outside before inside, close the box last. <a href="#/strokes">Learn the stroke rules →</a></div>
        </div></div></div>`;
      const hw = writer(tabEl.querySelector('.hw'), ch, { showCharacter: false, showOutline: true });
      let looping = false, step = 0;
      hw.animateCharacter();
      strokeStrip(tabEl.querySelector('#strip'), ch).then(n => { tabEl.querySelector('#sc').textContent = n ? `${n} strokes` : ''; });
      tabEl.querySelector('#aPlay').onclick = () => { looping = false; hw.hideCharacter(); hw.animateCharacter(); };
      tabEl.querySelector('#aLoop').onclick = (e) => { looping = !looping; e.target.classList.toggle('on', looping); if (looping) hw.loopCharacterAnimation(); else hw.pauseAnimation(); };
      tabEl.querySelector('#aStep').onclick = async () => {
        const d = await charData(ch).catch(() => null);
        if (!d) return; if (step === 0) hw.hideCharacter();
        hw.animateStroke(step % d.strokes.length); step = (step + 1) % d.strokes.length;
      };
      cleanups.push(() => { try { hw.pauseAnimation(); } catch {} });
    } else if (tab === 'trace') {
      tabEl.innerHTML = `<div class="card"><div class="row" style="justify-content:center;margin-bottom:14px"><div class="seg" id="mode"><button data-m="trace" class="on">Trace</button><button data-m="memory">From memory</button><button data-m="free">Free practice</button></div></div>
        <div class="tz big" id="tz"></div><div class="status" id="tst"></div>
        <div class="ctrls" id="tctl"></div>
        <p class="muted small" style="text-align:center">Works with mouse, finger or Apple Pencil. <b>Trace</b> checks each stroke and nudges you if the order is off. <b>From memory</b> hides the outline. <b>Free practice</b> is a 米字格 grid with pressure-sensitive ink.</p></div>`;
      let mode = 'trace';
      const tz = tabEl.querySelector('#tz'), st = tabEl.querySelector('#tst'), ctl = tabEl.querySelector('#tctl');
      const start = () => {
        if (mode === 'free') {
          const pc = practiceCanvas(tz, { ghost: ch, ghostOn: true }); let g = true;
          ctl.innerHTML = `<button class="btn sm ghost" data-a="undo">${icons.undo} Undo</button><button class="btn sm ghost" data-a="clear">Clear</button><button class="btn sm ghost" data-a="ghost">Hide guide</button>`;
          ctl.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'undo') pc.undo(); if (a === 'clear') pc.clear(); if (a === 'ghost') { g = !g; pc.setGhost(ch, g); e.target.textContent = g ? 'Hide guide' : 'Show guide'; } };
          st.textContent = ''; return;
        }
        tz.innerHTML = gridSvg('mi') + '<div class="hw"></div>';
        const hw = writer(tz.querySelector('.hw'), ch, { showCharacter: false, showOutline: mode === 'trace', showHintAfterMisses: mode === 'trace' ? 2 : 3, highlightOnComplete: true, leniency: 1.1 });
        let mistakes = 0;
        st.className = 'status'; st.textContent = mode === 'trace' ? 'Trace stroke 1 over the grey outline.' : 'Write the character from memory.';
        hw.quiz({
          onMistake: (s) => { mistakes++; st.className = 'status bad'; st.textContent = `Not quite — stroke ${s.strokeNum + 1}. ${s.mistakesOnStroke >= 2 ? 'Follow the hint.' : 'Try again.'}`; },
          onCorrectStroke: (s) => { st.className = 'status good'; st.textContent = s.strokesRemaining ? `✓ Stroke ${s.strokeNum + 1} — ${s.strokesRemaining} to go` : '✓'; },
          onComplete: (s) => { st.className = 'status good'; st.textContent = `完成！Done with ${s.totalMistakes} mistake${s.totalMistakes === 1 ? '' : 's'}. ${s.totalMistakes === 0 ? '完美 Perfect!' : ''}`; store.activity(); },
        });
        ctl.innerHTML = `<button class="btn sm" data-a="again">Again</button><button class="btn sm ghost" data-a="hint">Show me this stroke</button><a class="btn sm ghost" href="#/practice/${encodeURIComponent(w.s)}">Full-screen practice</a>`;
        ctl.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'again') start(); if (a === 'hint') { hw.showOutline(); } };
        cleanups.push(() => { try { hw.cancelQuiz(); } catch {} });
      };
      tabEl.querySelector('#mode').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; tabEl.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x === b)); cleanups.forEach(f => f()); cleanups = []; start(); };
      requestAnimationFrame(start);
    } else if (tab === 'examples') {
      tabEl.innerHTML = `<div class="card">${w.ex.length ? w.ex.map((e, k) => `<div class="sent">${playBtn(`data-k="${k}"`)}<div>${rubyHtml(e.zh, e.py, { hl: w.s })}<div class="en">${esc(e.en)}</div></div></div>`).join('') : '<p class="muted">No example sentence yet for this word — try the related words below, or search it on Tatoeba.</p>'}
        <p class="small muted" style="margin-top:12px">Sentences from <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR), read by your device's Chinese voice.</p></div>`;
      tabEl.onclick = (e) => { const b = e.target.closest('.play[data-k]'); if (b) speak(w.ex[+b.dataset.k].zh.join(''), { btn: b, rate: 0.85 }); };
    } else if (tab === 'related') {
      tabEl.innerHTML = '<div class="card"><div class="loading">loading</div></div>';
      loadIndex().then(idx => {
        const rel = idx.filter(r => r[0] !== w.s && chars.some(c => r[0].includes(c))).sort((a, b) => a[3] - b[3] || a[0].length - b[0].length).slice(0, 60);
        tabEl.innerHTML = `<div class="card"><h3>Other HSK words with ${chars.map(c => `<span class="zh">${esc(c)}</span>`).join(' / ')}</h3>${rel.length ? `<div class="words">${rel.map(r => `<a class="wcard" href="#/word/${r[4]}"><span class="hz">${esc(r[0])}</span><span class="py">${pyHtml(r[1])}</span><span class="en">${esc(r[2])}</span><span class="chip" style="justify-self:start;margin-top:4px">HSK ${r[3]}</span></a>`).join('')}</div>` : '<p class="muted">None in HSK 1–6.</p>'}</div>`;
      });
    }
  }
  main.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; main.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); tabEl.onclick = null; show(); };
  main.querySelector('#cp')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; ck = +b.dataset.k; main.querySelectorAll('#cp button').forEach(x => x.classList.toggle('on', x === b)); show(); });
  show();
  return () => cleanups.forEach(f => f());
}
