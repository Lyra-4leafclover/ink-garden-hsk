import { rng, shuffle, pick } from './ui.js';
import { loadLevel, loadSentences } from './data.js';

export const FORMAT = {
  1: { L: 20, R: 20, W: 0, min: 30 }, 2: { L: 25, R: 25, W: 0, min: 40 }, 3: { L: 25, R: 25, W: 10, min: 55 },
  4: { L: 25, R: 30, W: 10, min: 65 }, 5: { L: 30, R: 30, W: 10, min: 75 }, 6: { L: 30, R: 35, W: 10, min: 85 },
};
export const TESTS_PER_LEVEL = 30;
const isP = (t) => /^[\p{P}\s\w]+$/u.test(t);
const firstMean = (w) => w.m[0].replace(/\(.*?\)\s*/g, '').trim() || w.m[0];

async function pools(L) {
  const cur = await loadLevel(L);
  const prev = L > 1 ? (await Promise.all(Array.from({ length: L - 1 }, (_, i) => loadLevel(i + 1)))).flat() : [];
  const all = [...prev, ...cur];
  const sents = (await loadSentences(L)).filter(s => s.zh.filter(t => !isP(t)).length >= 3);
  return { cur, all, sents, bySimp: new Map(all.map(w => [w.s, w])) };
}

function distractWords(w, pool, R, n = 3, key = (x) => x.s) {
  const out = new Set(), res = [];
  const same = pool.filter(x => x.s !== w.s && x.s.length === w.s.length && x.pos?.[0] === w.pos?.[0]);
  for (const src of [same, pool]) {
    for (const x of shuffle(src, R)) { if (res.length >= n) break; const k = key(x); if (k !== key(w) && !out.has(k)) { out.add(k); res.push(x); } }
  }
  return res;
}
const mc = (R, ans, wrong) => { const opts = shuffle([ans, ...wrong], R); return { opts, ans: opts.indexOf(ans) }; };

const GEN = {
  // Listening
  lword(P, R, L) { const w = pick(P.cur, R); const d = distractWords(w, P.all, R); const showPy = L <= 2;
    return { sec: 'L', type: 'lword', q: 'Listen and choose the word you hear.', audio: { word: w.id, text: w.s }, ...mc(R, w, d), fmt: (x) => `<span class="zh">${x.s}</span>${showPy ? ` <small>${x.p}</small>` : ''}`, word: w.id, exp: `${w.s} (${w.p}) — ${firstMean(w)}` }; },
  lmean(P, R) { const w = pick(P.cur, R); const d = distractWords(w, P.all, R, 3, firstMean);
    return { sec: 'L', type: 'lmean', q: 'Listen. What does the word mean?', audio: { word: w.id, text: w.s }, ...mc(R, w, d), fmt: (x) => firstMean(x), word: w.id, exp: `${w.s} (${w.p}) — ${firstMean(w)}` }; },
  lsent(P, R) { const s = pick(P.sents, R); const others = shuffle(P.sents.filter(x => x.en !== s.en), R).slice(0, 3);
    return { sec: 'L', type: 'lsent', q: 'Listen to the sentence. Which translation is correct?', audio: { text: s.zh.join('') }, ...mc(R, s, others), fmt: (x) => x.en, exp: `${s.zh.join('')} — ${s.en}`, sent: s }; },
  ltf(P, R) { const s = pick(P.sents, R); const t = R() < 0.5; const shown = t ? s : pick(P.sents.filter(x => x.en !== s.en), R);
    return { sec: 'L', type: 'ltf', q: `Listen. Does it match this meaning? <b>“${shown.en}”</b>`, audio: { text: s.zh.join('') }, opts: ['✓ True', '✗ False'], ans: t ? 0 : 1, fmt: (x) => x, exp: `${s.zh.join('')} — ${s.en}`, sent: s }; },
  // Reading
  rmean(P, R) { const w = pick(P.cur, R); const d = distractWords(w, P.all, R, 3, firstMean);
    return { sec: 'R', type: 'rmean', q: `Choose the meaning of <span class="zh big">${w.s}</span>`, ...mc(R, w, d), fmt: (x) => firstMean(x), word: w.id, exp: `${w.s} (${w.p}) — ${w.m.join('; ')}` }; },
  rword(P, R) { const w = pick(P.cur, R); const d = distractWords(w, P.all, R);
    return { sec: 'R', type: 'rword', q: `Which word means <b>“${firstMean(w)}”</b>?`, ...mc(R, w, d), fmt: (x) => `<span class="zh">${x.s}</span>`, word: w.id, exp: `${w.s} (${w.p}) — ${firstMean(w)}` }; },
  rgap(P, R) {
    for (let k = 0; k < 30; k++) {
      const s = pick(P.sents, R);
      const idx = s.zh.map((t, i) => (P.bySimp.has(t) && !isP(t) ? i : -1)).filter(i => i >= 0);
      if (!idx.length) continue;
      const i = pick(idx, R), w = P.bySimp.get(s.zh[i]);
      const d = distractWords(w, P.all, R).filter(x => !s.zh.includes(x.s));
      if (d.length < 3) continue;
      const html = s.zh.map((t, j) => j === i ? '<span class="gap">（　　）</span>' : t).join('');
      return { sec: 'R', type: 'rgap', q: `Choose the word that fits the blank.<div class="zh qs">${html}</div><div class="muted small">${s.en}</div>`, ...mc(R, w, d.slice(0, 3)), fmt: (x) => `<span class="zh">${x.s}</span>`, word: w.id, exp: `${s.zh.join('')} — ${w.s} (${w.p}) = ${firstMean(w)}`, sent: s };
    }
    return GEN.rword(P, R);
  },
  rtrans(P, R) { const s = pick(P.sents, R); const others = shuffle(P.sents.filter(x => x.en !== s.en), R).slice(0, 3);
    return { sec: 'R', type: 'rtrans', q: `What does this sentence mean?<div class="zh qs">${s.zh.join('')}</div>`, ...mc(R, s, others), fmt: (x) => x.en, exp: `${s.zh.join('')} — ${s.en}`, sent: s }; },
  // Writing
  worder(P, R, L) {
    const max = L <= 3 ? 7 : L <= 4 ? 9 : 12;
    const ok = P.sents.filter(s => { const n = s.zh.filter(t => !isP(t)).length; return n >= 4 && n <= max; });
    const s = pick(ok.length ? ok : P.sents, R); const toks = s.zh.filter(t => !isP(t));
    let order = shuffle(toks.map((_, i) => i), R); if (order.every((v, i) => v === i)) order.reverse();
    return { sec: 'W', type: 'worder', q: `Put the words in the right order. <span class="muted">(${s.en})</span>`, toks, order, exp: `${s.zh.join('')} — ${s.en}`, sent: s };
  },
  wchar(P, R) {
    for (let k = 0; k < 40; k++) {
      const w = pick(P.cur, R); if (w.s.length !== 1) continue;
      const base = w.n.replace(/\d/g, '');
      const homo = P.all.filter(x => x.s.length === 1 && x.s !== w.s && x.n.replace(/\d/g, '') === base);
      const d = [...shuffle(homo, R), ...distractWords(w, P.all.filter(x => x.s.length === 1), R)].filter((x, i, a) => a.findIndex(y => y.s === x.s) === i).slice(0, 3);
      if (d.length < 3) continue;
      return { sec: 'W', type: 'wchar', q: `Which character is <b>${w.p}</b> — “${firstMean(w)}”?`, ...mc(R, w, d), fmt: (x) => `<span class="zh big">${x.s}</span>`, word: w.id, exp: `${w.s} (${w.p}) — ${firstMean(w)}` };
    }
    return GEN.rword(P, R);
  },
};
const MIX = { L: ['lword', 'lword', 'lmean', 'lsent', 'ltf', 'lsent'], R: ['rmean', 'rword', 'rgap', 'rgap', 'rtrans', 'rgap'], W: ['worder', 'worder', 'wchar'] };

export async function makeTest(L, id, { only } = {}) {
  const P = await pools(L);
  const seed = typeof id === 'number' ? L * 10007 + id * 131 : Date.now();
  const R = rng(seed);
  const F = FORMAT[L], qs = [];
  const secs = only ? { L: 0, R: 0, W: 0, [only]: only === 'W' ? 20 : 25 } : F;
  for (const sec of ['L', 'R', 'W']) {
    const n = secs[sec] || 0, types = MIX[sec];
    const early = L <= 2 ? types.filter(t => t !== 'lsent' || R() < 0.5) : types;
    for (let i = 0; i < n; i++) qs.push(GEN[early[i % early.length]](P, R, L));
  }
  return { L, id, qs, minutes: only ? Math.round(qs.length * 0.9) : F.min };
}
