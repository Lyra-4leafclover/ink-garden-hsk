export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MARKS = { 1: 'āēīōūǖĀĒĪŌŪǕ', 2: 'áéíóúǘÁÉÍÓÚǗ', 3: 'ǎěǐǒǔǚǍĚǏǑǓǙ', 4: 'àèìòùǜÀÈÌÒÙǛ' };
export function toneOf(syl) {
  for (const t of [1, 2, 3, 4]) for (const ch of syl) if (MARKS[t].includes(ch)) return t;
  const m = syl.match(/([1-5])$/); if (m) return +m[1];
  return 5;
}
const PLAIN = { ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e', ī: 'i', í: 'i', ǐ: 'i', ì: 'i', ō: 'o', ó: 'o', ǒ: 'o', ò: 'o', ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü' };
export const stripTone = (s) => s.toLowerCase().replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, c => PLAIN[c]);
/** pinyin string with spaces between syllables -> coloured html (joined) */
export function pyHtml(py, { join = true } = {}) {
  if (!py) return '';
  const parts = String(py).split(/\s+/).filter(Boolean);
  return parts.map(p => `<span class="t${toneOf(p)}">${esc(p)}</span>`).join(join ? '' : ' ');
}
export function joinPy(py) { return String(py || '').replace(/\s+/g, ''); }

export function rubyHtml(zh, py, { hl = null, cls = '' } = {}) {
  return `<div class="ruby ${cls}">` + zh.map((t, i) => {
    const p = py?.[i] ?? '';
    const isP = /^[\p{P}\s]+$/u.test(t);
    return `<span class="tk${hl && t === hl ? ' hl' : ''}">${isP ? '<span class="p">&nbsp;</span>' : `<span class="p">${pyHtml(p)}</span>`}${esc(t)}</span>`;
  }).join('') + '</div>';
}

export const icons = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 001.5.86l12-7.5a1 1 0 000-1.72l-12-7.5A1 1 0 007 4.5z"/></svg>',
  slow: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 8.5v7l6-3.5z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/></svg>',
  brush: '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-8 8H6v-6z"/></svg>',
};
export const playBtn = (attrs = '', cls = '') => `<button class="play ${cls}" ${attrs} aria-label="Play audio" title="Listen">${icons.play}</button>`;

export function toast(msg, ms = 2200) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
export function modal(html, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box" role="dialog" aria-modal="true"><button class="iconbtn x" aria-label="Close">${icons.x}</button>${html}</div>`;
  const close = () => { m.remove(); document.removeEventListener('keydown', key); onClose?.(); };
  const key = (e) => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('.x')) close(); });
  document.addEventListener('keydown', key);
  root.appendChild(m);
  return { el: m.querySelector('.box'), close };
}
export function shuffle(a, rnd = Math.random) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
export const levelName = (L) => ['', '初', '二', '三', '四', '五', '六'][L];
export const LEVEL_INFO = {
  1: { zh: '一级', name: 'Seedling', words: 150, desc: 'Greetings, numbers, family, time — your first 150 words.', art: 'level1' },
  2: { zh: '二级', name: 'Bamboo', words: 300, desc: 'Daily life: shopping, weather, travel, simple past.', art: 'level2' },
  3: { zh: '三级', name: 'Orchid', words: 600, desc: 'Everyday conversations, comparisons, complements.', art: 'level3' },
  4: { zh: '四级', name: 'Lotus', words: 1200, desc: 'Discuss a wide range of topics with native speakers.', art: 'level4' },
  5: { zh: '五级', name: 'Pine', words: 2500, desc: 'Read newspapers, watch films, give a full speech.', art: 'level5' },
  6: { zh: '六级', name: 'Dragon', words: 5000, desc: 'Fluent reading and writing on almost any subject.', art: 'level6' },
};
export function cssEscapeAttr(s) { return String(s).replace(/"/g, '\\"'); }

const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('zh', { granularity: 'word' }) : null;
export function segment(text) {
  if (SEG) return [...SEG.segment(text)].map(s => s.segment).filter(s => s.trim());
  return [...text].filter(s => s.trim());
}
export function toPy(text) {
  if (!window.pinyinPro || /^[\p{P}\s\w]+$/u.test(text)) return '';
  return pinyinPro.pinyin(text, { toneType: 'symbol' });
}
export function autoRuby(text, opts) {
  const zh = [...text];
  const py = window.pinyinPro ? pinyinPro.pinyin(text, { type: 'array', toneType: 'symbol' }) : [];
  return rubyHtml(zh, zh.map((c, i) => /\p{Script=Han}/u.test(c) ? (py[i] || '') : ''), opts);
}
export const sayBtn = (text, cls = '') => `<button class="play ${cls}" data-say="${esc(text)}" aria-label="Listen" title="Listen">${icons.play}</button>`;
