import { esc, icons, shuffle } from '../lib/ui.js';
import { makeTest } from '../lib/testgen.js';
import { getWord } from '../lib/data.js';
import { playWord, speak, stop } from '../lib/audio.js';
import * as store from '../lib/store.js';

const SEC = { L: '听力 Listening', R: '阅读 Reading', W: '书写 Writing' };
const ONLY = { listen: 'L', read: 'R', write: 'W' };
export async function render(main, [lv, tid]) {
  const L = +lv, isNum = /^\d+$/.test(tid);
  main.innerHTML = '<div class="wrap"><div class="loading">Preparing your test…</div></div>';
  const T = await makeTest(L, isNum ? +tid : tid, { only: ONLY[tid] });
  const qs = T.qs, ans = qs.map(() => null), flags = new Set();
  let cur = 0, done = false, t0 = Date.now(), timer;
  const title = isNum ? `HSK ${L} · Mock test ${tid}` : `HSK ${L} · ${ONLY[tid] ? SEC[ONLY[tid]] + ' practice' : 'Random test'}`;
  main.innerHTML = `<div class="wrap"><div class="row" style="justify-content:space-between;margin:18px 0"><a class="btn sm ghost" href="#/tests/${L}">${icons.back} Tests</a><h2 style="margin:0">${title}</h2></div>
    <div class="test-layout"><div id="qa"></div><aside class="test-side card flat"><div class="row" style="justify-content:space-between"><span class="timer" id="tm">0:00</span><span class="small muted">limit ${T.minutes} min</span></div>
    <details id="navd" ${innerWidth < 900 ? '' : 'open'}><summary class="small muted" style="cursor:pointer;margin-top:10px">All questions</summary><div id="nav"></div></details><button class="btn red" id="sub" style="width:100%;margin-top:14px">Submit test</button></aside></div></div>`;
  const qa = main.querySelector('#qa'), nav = main.querySelector('#nav'), tm = main.querySelector('#tm');
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  timer = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); tm.textContent = fmtT(s); tm.style.color = s > T.minutes * 60 ? 'var(--red)' : ''; }, 1000);
  const isRight = (i) => { const q = qs[i]; if (q.type === 'worder') return ans[i] && ans[i].map(k => q.toks[k]).join('') === q.toks.join(''); return ans[i] === q.ans; };
  function drawNav() {
    nav.innerHTML = ['L', 'R', 'W'].filter(s => qs.some(q => q.sec === s)).map(s => `<div class="small muted" style="margin:8px 0 4px">${SEC[s]}</div><div class="qnav">${qs.map((q, i) => q.sec !== s ? '' : `<button data-i="${i}" class="${i === cur ? 'cur ' : ''}${done ? (isRight(i) ? 'right' : 'wrong') : ans[i] !== null && (q.type !== 'worder' || ans[i].length === q.toks.length) ? 'done' : ''}">${flags.has(i) ? '⚑' : i + 1}</button>`).join('')}</div>`).join('');
  }
  async function playQ(btn) { const q = qs[cur]; if (!q.audio) return; if (q.audio.word) { const w = await getWord(q.audio.word); if (w) return playWord(w, btn); } speak(q.audio.text, { rate: L <= 2 ? 0.75 : 0.9, btn }); }
  function drawQ(autoplay = true) {
    const q = qs[cur];
    let body = '';
    if (q.type === 'worder') {
      const picked = ans[cur] || [];
      body = `<div class="slots">${picked.map((k, j) => `<button class="tile-w" data-j="${j}">${esc(q.toks[k])}</button>`).join('') || '<span class="muted small">Tap the words in order</span>'}</div><div class="tiles">${q.order.map(k => `<button class="tile-w ${picked.includes(k) ? 'used' : ''}" data-k="${k}">${esc(q.toks[k])}</button>`).join('')}</div>`;
    } else body = `<div class="opts">${q.opts.map((o, i) => `<button class="opt ${ans[cur] === i ? 'sel' : ''} ${done ? (i === q.ans ? 'right' : ans[cur] === i ? 'wrong' : '') : ''}" data-o="${i}"><span class="k">${'ABCD'[i]}</span><span>${q.fmt(o)}</span></button>`).join('')}</div>`;
    qa.innerHTML = `<div class="card q"><div class="row" style="justify-content:space-between"><span class="eyebrow">${SEC[q.sec]} · Question ${cur + 1} / ${qs.length}</span><button class="chip ${flags.has(cur) ? 'on' : ''}" id="fl">⚑ Flag</button></div>
      ${q.audio ? `<div class="row"><button class="btn red" id="pa">${icons.play} Play audio</button>${done ? `<span class="zh">${esc(q.audio.text)}</span>` : ''}</div>` : ''}
      <div class="prompt">${q.q}</div>${body}
      ${done ? `<div class="callout ${isRight(cur) ? 'jade' : 'red'}"><b>${isRight(cur) ? 'Correct' : 'Answer'}:</b> ${esc(q.exp)}${q.word ? ` · <a href="#/word/${q.word}">open word</a>` : ''}</div>` : ''}
      <div class="row" style="justify-content:space-between"><button class="btn ghost" id="pv" ${cur ? '' : 'disabled'}>${icons.back} Previous</button><button class="btn" id="nx">${cur === qs.length - 1 ? (done ? 'Results' : 'Finish') : 'Next'} ${icons.next}</button></div></div>`;
    qa.querySelector('#pa')?.addEventListener('click', (e) => playQ(e.currentTarget));
    if (q.audio && autoplay && !done) setTimeout(() => playQ(qa.querySelector('#pa')), 250);
    qa.querySelector('#fl').onclick = () => { flags.has(cur) ? flags.delete(cur) : flags.add(cur); drawQ(false); drawNav(); };
    qa.querySelector('#pv').onclick = () => go(cur - 1);
    qa.querySelector('#nx').onclick = () => cur === qs.length - 1 ? (done ? results() : submit()) : go(cur + 1);
    qa.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { if (done) return; ans[cur] = +b.dataset.o; drawQ(false); drawNav(); });
    qa.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { if (done) return; (ans[cur] ||= []).push(+b.dataset.k); drawQ(false); drawNav(); });
    qa.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { if (done) return; ans[cur].splice(+b.dataset.j, 1); if (!ans[cur].length) ans[cur] = null; drawQ(false); drawNav(); });
  }
  function go(i) { stop(); cur = Math.max(0, Math.min(qs.length - 1, i)); drawQ(); drawNav(); scrollTo({ top: 0, behavior: 'smooth' }); }
  nav.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) go(+b.dataset.i); };
  function submit() {
    const left = ans.filter(a => a === null).length;
    if (left && !confirm(`${left} question${left > 1 ? 's are' : ' is'} unanswered. Submit anyway?`)) return;
    done = true; clearInterval(timer); stop();
    const secs = {}; ['L', 'R', 'W'].forEach(s => { const idx = qs.map((q, i) => q.sec === s ? i : -1).filter(i => i >= 0); if (idx.length) secs[s] = Math.round(idx.filter(isRight).length / idx.length * 100) + '%'; });
    const right = qs.filter((_, i) => isRight(i)).length, pct = Math.round(right / qs.length * 100);
    store.addTest({ L, id: isNum ? +tid : tid, pct, right, total: qs.length, sec: secs, secsUsed: Math.round((Date.now() - t0) / 1000), date: Date.now() });
    results();
  }
  function results() {
    const right = qs.filter((_, i) => isRight(i)).length, pct = Math.round(right / qs.length * 100);
    const wrongWords = [...new Set(qs.map((q, i) => !isRight(i) && q.word).filter(Boolean))];
    const bySec = ['L', 'R', 'W'].filter(s => qs.some(q => q.sec === s)).map(s => { const idx = qs.map((q, i) => q.sec === s ? i : -1).filter(i => i >= 0); const r = idx.filter(isRight).length; return `<div class="card flat" style="text-align:center"><div class="small muted">${SEC[s]}</div><div style="font-size:1.6rem;font-weight:700">${r} / ${idx.length}</div></div>`; }).join('');
    qa.innerHTML = `<div class="card" style="text-align:center"><div class="eyebrow">${title}</div><div class="big-score" style="color:${pct >= 60 ? 'var(--jade)' : 'var(--red)'}">${pct}%</div>
      <h2 style="margin:6px 0">${pct >= 90 ? '优秀！Excellent!' : pct >= 60 ? '通过 — Pass!' : 'Not yet — keep going!'}</h2><p class="muted">${right} of ${qs.length} correct · time ${tm.textContent}</p>
      <div class="grid g3" style="margin:16px 0">${bySec}</div>
      <div class="row" style="justify-content:center">${wrongWords.length ? `<button class="btn red" id="addw">+ Add ${wrongWords.length} missed words to flashcards</button>` : ''}<button class="btn ghost" id="rev">Review answers</button><a class="btn ghost" href="#/tests/${L}">All tests</a>${isNum && +tid < 30 ? `<a class="btn" href="#/test/${L}/${+tid + 1}">Next test →</a>` : ''}</div></div>`;
    qa.querySelector('#addw')?.addEventListener('click', (e) => { wrongWords.forEach(id => store.addCard(id)); e.currentTarget.textContent = '✓ Added — review them in Flashcards'; e.currentTarget.disabled = true; });
    qa.querySelector('#rev').onclick = () => { const firstWrong = qs.findIndex((_, i) => !isRight(i)); go(firstWrong < 0 ? 0 : firstWrong); };
    drawNav(); scrollTo({ top: 0, behavior: 'smooth' });
  }
  main.querySelector('#sub').onclick = () => done ? results() : submit();
  drawQ(false); drawNav();
  return () => { clearInterval(timer); stop(); };
}
