import { $, $$, esc, modal, pyHtml, joinPy } from './lib/ui.js';
import * as store from './lib/store.js';
import { loadIndex } from './lib/data.js';
import { stop, speak } from './lib/audio.js';

const routes = [
  [/^\/?$/, 'home'],
  [/^\/levels$/, 'levels'],
  [/^\/level\/(\d)$/, 'level'],
  [/^\/word\/([\d]-\d{4})$/, 'word'],
  [/^\/pinyin$/, 'pinyin'],
  [/^\/strokes$/, 'strokes'],
  [/^\/grammar(?:\/(\d))?$/, 'grammar'],
  [/^\/sentences$/, 'sentences'],
  [/^\/scenes$/, 'scenes'],
  [/^\/scene\/([\w-]+)$/, 'scene'],
  [/^\/poems$/, 'poems'],
  [/^\/poems\/guide$/, 'poemguide'],
  [/^\/poem\/(\d+)$/, 'poem'],
  [/^\/reading$/, 'reading'],
  [/^\/reading\/guide$/, 'readingguide'],
  [/^\/novel\/([\w-]+)$/, 'novel'],
  [/^\/tests(?:\/(\d))?$/, 'tests'],
  [/^\/test\/(\d)\/(\w+)$/, 'test'],
  [/^\/review$/, 'review'],
  [/^\/checker(?:\/(.+))?$/, 'checker'],
  [/^\/practice(?:\/(.+))?$/, 'practice'],
  [/^\/progress$/, 'progress'],
  [/^\/resources$/, 'resources'],
  [/^\/about$/, 'about'],
];
const main = $('#main');
let cleanup = null;
async function route() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const [path] = hash.split('?');
  stop();
  if (typeof cleanup === 'function') { try { cleanup(); } catch {} }
  cleanup = null;
  let name = 'notfound', params = [];
  for (const [re, n] of routes) { const m = path.match(re); if (m) { name = n; params = m.slice(1); break; } }
  $$('.mainnav a').forEach(a => {
    const href = a.getAttribute('href').slice(1);
    a.classList.toggle('active', href === path || (href !== '/' && path.startsWith(href.replace(/s$/, ''))));
  });
  $$('.navgroup').forEach(g => g.classList.toggle('has-active', !!g.querySelector('a.active')));
  closeMenu(); document.activeElement?.blur?.();
  main.innerHTML = '<div class="loading">loading</div>';
  try {
    const mod = await import(`./pages/${name === 'notfound' ? 'home' : name}.js`);
    main.innerHTML = '';
    cleanup = await mod.render(main, params, new URLSearchParams(hash.split('?')[1] || ''));
    main.firstElementChild?.classList.add('fade-in');
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="wrap"><div class="card empty"><h3>Something went wrong</h3><p class="muted">${esc(e.message)}</p><a class="btn" href="#/">Back home</a></div></div>`;
  }
  if (!hash.includes('#')) window.scrollTo({ top: 0, behavior: 'instant' });
  const t = main.querySelector('h1')?.textContent;
  document.title = (t ? t.trim() + ' · ' : '') + '墨园 Ink Garden';
}
window.addEventListener('hashchange', route);

// ---- nav / theme ----
const nav = $('#mainnav'), scrim = $('#scrim'), menuBtn = $('#menuBtn');
function closeMenu() { nav.classList.remove('open'); scrim.classList.remove('show'); menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.onclick = () => { const o = !nav.classList.contains('open'); nav.classList.toggle('open', o); scrim.classList.toggle('show', o); menuBtn.setAttribute('aria-expanded', String(o)); };
scrim.onclick = closeMenu;
function applyTheme(t) { document.documentElement.dataset.theme = t; document.querySelector('meta[name=theme-color]').content = t === 'night' ? '#16181c' : '#f4ecdd'; }
applyTheme(store.setting('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'paper'));
$('#themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'night' ? 'paper' : 'night'; store.setting('theme', t); applyTheme(t); };

// ---- search ----
async function openSearch() {
  const m = modal(`<h3>Search</h3><input type="search" id="sq" placeholder="Type 汉字, pinyin (nihao / ni3hao3) or English…" autocomplete="off" autofocus><div id="sres" style="margin-top:14px;display:grid;gap:6px"></div>`);
  const idx = await loadIndex();
  const inp = m.el.querySelector('#sq'), out = m.el.querySelector('#sres');
  const plain = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'v').replace(/[\s']/g, '').toLowerCase();
  const rows = idx.map(r => ({ r, pl: plain(r[1]), en: r[2].toLowerCase() }));
  inp.focus();
  inp.oninput = () => {
    const q = inp.value.trim(); if (!q) { out.innerHTML = ''; return; }
    const ql = plain(q.replace(/[1-5]/g, '')), qe = q.toLowerCase();
    const isZh = /[\u4e00-\u9fff]/.test(q);
    let res = rows.filter(x => isZh ? x.r[0].includes(q) : (x.pl.startsWith(ql) || x.en.split(/[^a-z]+/).includes(qe) || (qe.length > 3 && x.en.includes(qe))));
    res.sort((a, b) => (a.r[0] === q ? -1 : 0) - (b.r[0] === q ? -1 : 0) || a.r[0].length - b.r[0].length || a.r[3] - b.r[3]);
    out.innerHTML = res.slice(0, 40).map(({ r }) => `<a class="card flat" style="padding:10px 14px;display:flex;gap:14px;align-items:center" href="#/word/${r[4]}"><span class="zh" style="font-size:1.6rem;min-width:3.5em">${esc(r[0])}</span><span style="flex:1"><b>${pyHtml(r[1])}</b><br><span class="muted small">${esc(r[2])}</span></span><span class="chip">HSK ${r[3]}</span></a>`).join('') || '<p class="muted">No matches.</p>';
    out.querySelectorAll('a').forEach(a => a.addEventListener('click', () => m.close()));
  };
}
$('#searchBtn').onclick = openSearch;
document.addEventListener('keydown', e => { if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
route();

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (!b) return;
  e.preventDefault();
  speak(b.dataset.say, { rate: +(b.dataset.rate || 0.85), btn: b });
});
