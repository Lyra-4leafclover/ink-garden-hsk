import { esc, LEVEL_INFO } from '../lib/ui.js';
import { FORMAT, TESTS_PER_LEVEL } from '../lib/testgen.js';
import * as store from '../lib/store.js';

export async function render(main, [lv]) {
  const L = +(lv || store.setting('testLevel') || 1); store.setting('testLevel', L);
  const F = FORMAT[L], hist = store.get().tests.filter(t => t.L === L);
  const best = {}; hist.forEach(t => { best[t.id] = Math.max(best[t.id] || 0, t.pct); });
  const total = F.L + F.R + F.W;
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">模拟考试 · Mock tests</div><h1>HSK mock tests</h1>
    <p class="lead">${TESTS_PER_LEVEL} full mock tests for every level — ${TESTS_PER_LEVEL * 6} in total — built from the official word lists in HSK format: listening (听力), reading (阅读) and, from HSK 3, writing (书写). Plus unlimited quick practice.</p></div>
    <div class="seg" style="margin-bottom:20px;flex-wrap:wrap">${[1, 2, 3, 4, 5, 6].map(l => `<a href="#/tests/${l}" class="${l === L ? 'on' : ''}">HSK ${l}</a>`).join('')}</div>
    <div class="grid g3" style="margin-bottom:24px">
      <div class="card"><div class="eyebrow">HSK ${L} · ${LEVEL_INFO[L].name}</div><h3 style="margin:4px 0">Test format</h3>
        <div class="small">听力 Listening: <b>${F.L}</b> · 阅读 Reading: <b>${F.R}</b>${F.W ? ` · 书写 Writing: <b>${F.W}</b>` : ''}</div>
        <div class="small muted">${total} questions · ${F.min} minutes · pass mark 60%</div>
        <div class="small muted" style="margin-top:6px">Taken ${hist.length} time${hist.length === 1 ? '' : 's'}${hist.length ? ` · average ${Math.round(hist.reduce((a, t) => a + t.pct, 0) / hist.length)}%` : ''}</div></div>
      <div class="card"><h3 style="margin:0 0 8px">Quick practice</h3><p class="muted small">Random questions every time — no timer pressure.</p>
        <div class="row"><a class="btn sm" href="#/test/${L}/listen">听 Listening</a><a class="btn sm" href="#/test/${L}/read">读 Reading</a>${L >= 3 ? `<a class="btn sm" href="#/test/${L}/write">写 Writing</a>` : ''}<a class="btn sm red" href="#/test/${L}/quick">Random full test</a></div></div>
      <div class="card flat"><h3 style="margin:0 0 6px">Tips</h3><ul class="small" style="margin:0;padding-left:18px"><li>Use headphones for listening.</li><li>Each audio can be replayed — in the real exam it plays twice.</li><li>After finishing, review every mistake and add the words to flashcards.</li></ul></div>
    </div>
    <div class="section-title"><h2>Full mock tests</h2><span class="muted">${Object.keys(best).filter(k => /^\d+$/.test(k)).length} / ${TESTS_PER_LEVEL} done</span></div>
    <div class="tgrid">${Array.from({ length: TESTS_PER_LEVEL }, (_, i) => i + 1).map(n => { const b = best[n]; return `<a class="tcard ${b === undefined ? '' : b >= 60 ? 'pass' : 'fail'}" href="#/test/${L}/${n}"><span class="small muted">Test</span><b>${n}</b><span class="small">${b === undefined ? `${total} Q` : b + '%'}</span></a>`; }).join('')}</div>
    ${hist.length ? `<section class="section"><div class="section-title"><h2>Recent results</h2></div><div class="card flat"><table class="tbl"><tr><th>Date</th><th>Test</th><th>Score</th><th>Listening</th><th>Reading</th><th>Writing</th></tr>${hist.slice(0, 10).map(t => `<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${esc(String(t.id))}</td><td><b style="color:${t.pct >= 60 ? 'var(--jade)' : 'var(--red)'}">${t.pct}%</b></td><td>${t.sec?.L ?? '–'}</td><td>${t.sec?.R ?? '–'}</td><td>${t.sec?.W ?? '–'}</td></tr>`).join('')}</table></div></section>` : ''}
  </div>`;
}
