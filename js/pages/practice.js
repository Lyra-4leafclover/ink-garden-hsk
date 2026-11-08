import { esc, icons } from '../lib/ui.js';
import { writer, gridSvg, practiceCanvas, strokeStrip } from '../lib/hanzi.js';
import * as store from '../lib/store.js';

export async function render(main, [text]) {
  let chars = [...(text || '永')].filter(c => /\p{Script=Han}/u.test(c));
  if (!chars.length) chars = ['永'];
  let k = 0, mode = 'trace', wr = null, grid = 'mi';
  main.innerHTML = `<div class="wrap narrow">
    <div class="page-head"><div class="eyebrow">Writing practice · great on iPad</div><h1>Trace &amp; write</h1>
    <p class="lead">Type or paste any Chinese characters, then trace them with your finger or Apple Pencil. Tip: on iPad, tap the share button → <b>Add to Home Screen</b> for a full-screen writing pad.</p></div>
    <div class="row" style="margin-bottom:14px"><input type="text" id="txt" value="${esc(chars.join(''))}" placeholder="Type characters, e.g. 你好" style="flex:1;min-width:200px;font-family:var(--zh);font-size:1.2rem"><button class="btn" id="go">Practise</button></div>
    <div class="charpick" id="cp"></div>
    <div class="card">
      <div class="row" style="justify-content:center;margin-bottom:14px"><div class="seg" id="mode"><button data-m="watch">Watch</button><button data-m="trace" class="on">Trace</button><button data-m="memory">From memory</button><button data-m="free">Free draw</button></div>
      <div class="seg" id="grid"><button data-g="mi" class="on">米字格</button><button data-g="tian">田字格</button></div></div>
      <div class="tz big" id="tz"></div><div class="status" id="st"></div>
      <div class="ctrls" id="ctl"></div>
      <div class="strip" id="strip" style="justify-content:center;margin-top:10px"></div>
    </div></div>`;
  const $ = (s) => main.querySelector(s);
  const tz = $('#tz'), st = $('#st'), ctl = $('#ctl');
  function picks() { $('#cp').innerHTML = chars.length > 1 ? chars.map((c, i) => `<button data-k="${i}" class="${i === k ? 'on' : ''}">${esc(c)}</button>`).join('') : ''; }
  function start() {
    try { wr?.cancelQuiz?.(); wr?.pauseAnimation?.(); } catch {}
    const ch = chars[k];
    strokeStrip($('#strip'), ch);
    if (mode === 'free') {
      const pc = practiceCanvas(tz, { ghost: ch }); let g = true;
      tz.querySelector('svg.grid').outerHTML = gridSvg(grid);
      ctl.innerHTML = `<button class="btn sm ghost" data-a="undo">${icons.undo} Undo</button><button class="btn sm ghost" data-a="clear">Clear</button><button class="btn sm ghost" data-a="ghost">Hide guide</button>${nextBtn()}`;
      ctl.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'undo') pc.undo(); if (a === 'clear') pc.clear(); if (a === 'ghost') { g = !g; pc.setGhost(ch, g); e.target.textContent = g ? 'Hide guide' : 'Show guide'; } if (a === 'next') go(1); };
      st.textContent = 'Free draw — pressure-sensitive with Apple Pencil.'; return;
    }
    tz.innerHTML = gridSvg(grid) + '<div class="hw"></div>';
    wr = writer(tz.querySelector('.hw'), ch, { showCharacter: mode === 'watch' ? false : false, showOutline: mode !== 'memory', showHintAfterMisses: mode === 'trace' ? 2 : 3, highlightOnComplete: true });
    if (mode === 'watch') { wr.loopCharacterAnimation(); st.className = 'status'; st.textContent = 'Watch the stroke order, then switch to Trace.'; ctl.innerHTML = nextBtn(); ctl.onclick = (e) => { if (e.target.closest('[data-a=next]')) go(1); }; return; }
    st.className = 'status'; st.textContent = mode === 'trace' ? 'Trace over the outline, stroke by stroke.' : 'Write it from memory — hints appear after 3 misses.';
    wr.quiz({
      onMistake: (s) => { st.className = 'status bad'; st.textContent = `Stroke ${s.strokeNum + 1}: try again${s.mistakesOnStroke >= 2 ? ' — follow the hint' : ''}.`; },
      onCorrectStroke: (s) => { st.className = 'status good'; st.textContent = `✓ ${s.strokeNum + 1} / ${s.strokeNum + 1 + s.strokesRemaining}`; },
      onComplete: (s) => { st.className = 'status good'; st.textContent = `完成！${s.totalMistakes ? s.totalMistakes + ' mistake' + (s.totalMistakes > 1 ? 's' : '') : '完美 — perfect!'}`; store.activity(); if (k < chars.length - 1) setTimeout(() => go(1), 1400); },
    });
    ctl.innerHTML = `<button class="btn sm" data-a="again">Again</button><button class="btn sm ghost" data-a="hint">Show outline</button>${nextBtn()}`;
    ctl.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'again') start(); if (a === 'hint') wr.showOutline(); if (a === 'next') go(1); };
  }
  const nextBtn = () => chars.length > 1 ? `<button class="btn sm ghost" data-a="next">Next ${icons.next}</button>` : '';
  function go(d) { k = (k + d + chars.length) % chars.length; picks(); start(); }
  $('#cp').onclick = (e) => { const b = e.target.closest('button'); if (b) { k = +b.dataset.k; picks(); start(); } };
  $('#mode').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; main.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x === b)); start(); };
  $('#grid').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; grid = b.dataset.g; main.querySelectorAll('#grid button').forEach(x => x.classList.toggle('on', x === b)); start(); };
  const submit = () => { const c = [...$('#txt').value].filter(c => /\p{Script=Han}/u.test(c)); if (c.length) { location.hash = '#/practice/' + encodeURIComponent(c.join('')); } };
  $('#go').onclick = submit; $('#txt').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  picks(); requestAnimationFrame(start);
  return () => { try { wr?.cancelQuiz?.(); wr?.pauseAnimation?.(); } catch {} };
}
