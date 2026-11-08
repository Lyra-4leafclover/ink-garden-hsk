import { esc, LEVEL_INFO, toast } from '../lib/ui.js';
import { loadLevel } from '../lib/data.js';
import * as store from '../lib/store.js';

export async function render(main) {
  const st = store.get(), cards = st.cards;
  const lv = await Promise.all([1, 2, 3, 4, 5, 6].map(loadLevel));
  const stats = lv.map(ws => { let k = 0, l = 0; ws.forEach(w => { const s = store.status(w.id); if (s === 'known') k++; else if (s) l++; }); return { n: ws.length, k, l }; });
  const days = []; for (let i = 111; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA'); days.push([d, st.days[d] || 0]); }
  const maxD = Math.max(1, ...days.map(d => d[1]));
  const tests = st.tests || [], poems = Object.values(st.poems || {}).filter(p => p.done).length;
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">学习记录 · My progress</div><h1>My progress</h1><p class="lead">Everything is saved privately in this browser. Export a backup to move it to another device.</p></div>
    <div class="grid g4 stats">${[['火', store.streak(), 'day streak'], ['卡', Object.keys(cards).length, 'words in flashcards'], ['到', store.dueCards().length, 'due for review'], ['考', tests.length, 'tests taken'], ['诗', poems, 'poems memorised'], ['日', Object.keys(st.days).length, 'study days']].map(([i, n, t]) => `<div class="card stat"><span class="zh ic">${i}</span><b>${n}</b><span class="muted small">${t}</span></div>`).join('')}</div>
    <section class="section"><div class="section-title"><h2>Study calendar</h2><span class="muted small">last 16 weeks</span></div><div class="card flat"><div class="cal">${days.map(([d, n]) => `<i title="${d}: ${n}" style="opacity:${n ? 0.25 + 0.75 * n / maxD : 1};${n ? 'background:var(--jade)' : ''}"></i>`).join('')}</div></div></section>
    <section class="section"><div class="section-title"><h2>Words by level</h2></div><div class="grid g3">${stats.map((s, i) => `<a class="card" href="#/level/${i + 1}" style="text-decoration:none;color:inherit"><div class="row" style="justify-content:space-between"><b>HSK ${i + 1} · ${LEVEL_INFO[i + 1].name}</b><span class="small muted">${s.k} / ${s.n}</span></div>
      <div class="bar" style="margin-top:8px;display:flex"><i style="width:${s.k / s.n * 100}%"></i><i style="width:${s.l / s.n * 100}%;background:var(--gold)"></i></div><div class="small muted" style="margin-top:4px">${s.k} known · ${s.l} learning</div></a>`).join('')}</div></section>
    ${tests.length ? `<section class="section"><div class="section-title"><h2>Test scores</h2></div><div class="card flat"><div class="spark">${tests.slice(0, 40).reverse().map(t => `<i title="HSK ${t.L} · ${t.pct}%" style="height:${Math.max(4, t.pct)}%;background:${t.pct >= 60 ? 'var(--jade)' : 'var(--red2)'}"></i>`).join('')}</div></div></section>` : ''}
    <section class="section"><div class="section-title"><h2>Backup</h2></div><div class="row"><button class="btn" id="ex">Export progress</button><label class="btn ghost">Import<input type="file" id="im" accept=".json" hidden></label><button class="btn ghost" id="rs" style="color:var(--red)">Reset everything</button></div></section></div>`;
  main.querySelector('#ex').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([store.exportData()], { type: 'application/json' })); a.download = `ink-garden-progress-${store.today()}.json`; a.click(); };
  main.querySelector('#im').onchange = async (e) => { try { store.importData(await e.target.files[0].text()); toast('Progress imported'); render(main); } catch { toast('That file could not be read'); } };
  main.querySelector('#rs').onclick = () => { if (confirm('Delete all progress, flashcards and test history?')) { store.resetAll(); render(main); } };
}
