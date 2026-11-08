import { esc, pyHtml, playBtn, toast, shuffle, pick } from '../lib/ui.js';
import { json, loadLevel } from '../lib/data.js';
import { playSyllable, playWord, playFile } from '../lib/audio.js';

const INITIALS = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS = ['a', 'o', 'e', 'i', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'ü', 'üe', 'üan', 'ün'];
const ZERO = { i: 'yi', ia: 'ya', iao: 'yao', ie: 'ye', iu: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong', u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei', uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng', ü: 'yu', üe: 'yue', üan: 'yuan', ün: 'yun' };
export function spell(ini, fin) {
  if (!ini) return ZERO[fin] || fin;
  if ('jqx'.includes(ini) && ini.length === 1 && fin.startsWith('ü')) return ini + fin.replace('ü', 'u');
  return ini + fin;
}
const fileKey = (s) => s.replace(/ü/g, 'v');
const TM = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
export function mark(syl, t) {
  if (t < 1 || t > 4) return syl;
  let i = syl.search(/[ae]/); if (i < 0) i = syl.indexOf('ou'); 
  if (i < 0) { const m = [...syl].map((c, k) => 'iouü'.includes(c) ? k : -1).filter(k => k >= 0); i = m[m.length - 1]; }
  if (i < 0 || i === undefined) return syl;
  const c = syl[i]; return syl.slice(0, i) + TM[c][t - 1] + syl.slice(i + 1);
}
export const toneSvg = (t, color = `var(--t${t})`) => {
  const y = (v) => 100 - (v - 1) * 22.5;
  const pts = { 1: [[10, 5], [190, 5]], 2: [[10, 3], [190, 5]], 3: [[10, 2], [90, 1], [190, 4]], 4: [[10, 5], [190, 1]], 5: [[80, 3], [120, 3]] }[t];
  const d = pts.length === 3 ? `M${pts[0][0]},${y(pts[0][1])} Q${pts[1][0]},${y(pts[1][1]) + 18} ${pts[2][0]},${y(pts[2][1])}` : `M${pts[0][0]},${y(pts[0][1])} L${pts[1][0]},${y(pts[1][1])}`;
  return `<svg class="tonesvg" viewBox="0 0 200 110">${[1, 2, 3, 4, 5].map(v => `<line x1="0" x2="200" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/>`).join('')}<path d="${d}" stroke="${color}"/></svg>`;
};
const INI_TIPS = [
  ['b p m f', 'Lips', 'b is like an unaspirated "p" (as in s<b>p</b>y). p is a strong "p" with a puff of air (hold a tissue — it should move). m, f as in English.', ['ba', 'pa', 'ma', 'fa']],
  ['d t n l', 'Tongue tip', 'd = unaspirated "t" (s<b>t</b>op), t = "t" with a puff of air. n, l as in English.', ['da', 'ta', 'na', 'la']],
  ['g k h', 'Back of tongue', 'g = unaspirated "k" (s<b>k</b>y), k = "k" with a puff. h is raspier than English h — like a soft Scottish "loch".', ['ge', 'ke', 'he']],
  ['j q x', 'Tongue flat behind lower teeth', 'Smile slightly. j ≈ "jee" but softer, q ≈ "chee" with air, x ≈ "shee" with a smile. Always followed by i or ü (the ü is written u: ju, qu, xu).', ['ji', 'qi', 'xi', 'ju', 'qu', 'xu']],
  ['zh ch sh r', 'Tongue curled back (retroflex)', 'Curl the tip of your tongue up toward the roof of your mouth. zh ≈ "j" in "jerk", ch ≈ "ch" in "church" with air, sh ≈ "sh" in "shirt", r ≈ the "s" in "plea<b>s</b>ure" mixed with English r.', ['zhi', 'chi', 'shi', 'ri']],
  ['z c s', 'Tongue tip behind upper teeth', 'z ≈ "ds" in "ki<b>ds</b>", c ≈ "ts" in "ca<b>ts</b>" with a puff of air, s as in English.', ['zi', 'ci', 'si']],
];
const FIN_TIPS = [
  ['-i after zh ch sh r z c s', 'In zhi, chi, shi, ri, zi, ci, si the i is NOT "ee". It is a buzzing continuation of the consonant. Just hold the consonant and add voice.'],
  ['e', 'Not like English e. Say "uh" from the back of your throat with unrounded lips (like "duh" without moving the jaw).'],
  ['ü (yu, ju, qu, xu, nü, lü)', 'Say "ee" and round your lips as if whistling, keeping your tongue still.'],
  ['ian / yan', 'Sounds like "yen", not "yan".'],
  ['iu, ui, un', 'Short spellings of iou, uei, uen: liù ≈ "lyo", guì ≈ "gway", lùn ≈ "lwun".'],
  ['-n vs -ng', '-n ends with the tongue tip on the gum ridge (fan), -ng ends at the back with mouth open (fang).'],
  ['er', 'Like the American "are" with a curled tongue. Also added to words in Beijing speech: 哪儿 nǎr.'],
];
export async function render(main) {
  const sy = await json('data/syllables.json');
  main.innerHTML = `<div class="wrap">
  <div class="page-head"><div class="eyebrow">Pronunciation guide</div><h1>Pinyin &amp; tones</h1>
  <p class="lead">Pinyin is the official way to write Chinese sounds with Latin letters. Every syllable has three parts: an <b>initial</b> (start consonant), a <b>final</b> (vowel part) and a <b>tone</b> (the pitch shape). All audio below is recorded by native Mandarin speakers.</p></div>
  <div class="toc"><a href="#tones" data-jump>The 4 tones</a><a href="#trainer" data-jump>Tone trainer</a><a href="#chart" data-jump>Pinyin chart</a><a href="#initials" data-jump>Initials</a><a href="#finals" data-jump>Finals</a><a href="#sandhi" data-jump>Tone changes</a><a href="#pairs" data-jump>Tone pairs</a><a href="#/checker">Pronunciation checker →</a></div>

  <section class="section" id="tones"><div class="section-title"><h2>The four tones</h2><span class="muted">plus the light neutral tone</span></div>
  <div class="grid g4">${[[1, 'High & flat', '55', 'Sing a steady high note, like holding "laaa".', 'mā 妈 mother'], [2, 'Rising', '35', 'Rise like asking "huh?" or "what?"', 'má 麻 hemp'], [3, 'Low dip', '214', 'Dip low and (when alone) rise a little. In speech it mostly stays low and creaky.', 'mǎ 马 horse'], [4, 'Falling', '51', 'Drop sharply, like a firm "No!"', 'mà 骂 to scold']].map(([t, n, c, d, ex]) => `
    <div class="card"><div class="row"><h3 class="t${t}" style="margin:0">Tone ${t}</h3><span class="chip">${c}</span><span class="spacer"></span><button class="play" data-syl="ma${t}" aria-label="Play">${'<svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 001.5.86l12-7.5a1 1 0 000-1.72l-12-7.5A1 1 0 007 4.5z"/></svg>'}</button></div>
    ${toneSvg(t)}<b>${n}</b><p class="muted small" style="margin:4px 0">${d}</p><div class="zh">${ex}</div></div>`).join('')}
    <div class="card"><div class="row"><h3 class="t5" style="margin:0">Neutral</h3><span class="chip">light</span></div>${toneSvg(5)}<b>Short &amp; light</b><p class="muted small" style="margin:4px 0">No mark. Said quickly and softly after another syllable: 妈妈 māma, 你们 nǐmen, 吗 ma.</p></div>
  </div>
  <div class="callout">Where does the tone mark go? On <b>a</b> or <b>e</b> if present; in <b>ou</b> on the o; otherwise on the last vowel (guì, liù).</div></section>

  <section class="section" id="trainer"><div class="section-title"><h2>Tone trainer</h2><span class="muted">Hear a syllable — which tone is it?</span></div>
  <div class="card" style="text-align:center"><div class="row" style="justify-content:center"><button class="btn red" id="trPlay">▶ Play a sound</button><span class="chip" id="trScore">0 / 0</span></div>
  <div class="tone-pick" style="justify-content:center;margin-top:16px" id="trPick">${[1, 2, 3, 4].map(t => `<button data-t="${t}" class="t${t}">${['ˉ', 'ˊ', 'ˇ', 'ˋ'][t - 1]} ${t}</button>`).join('')}</div><div class="status" id="trSt"></div></div></section>

  <section class="section" id="chart"><div class="section-title"><h2>Pinyin chart</h2><span class="muted">Tap any syllable to hear it in all four tones</span></div>
  <div class="row" style="margin-bottom:12px"><div class="seg" id="chTone"><button data-t="0" class="on">Choose</button><button data-t="1">1st</button><button data-t="2">2nd</button><button data-t="3">3rd</button><button data-t="4">4th</button></div><span class="muted small">"Choose" opens all 4 tones; pick a tone to play instantly.</span></div>
  <div class="chart-wrap"><table class="chart"><thead><tr><th class="rowh"></th>${INITIALS.map(i => `<th>${i || '∅'}</th>`).join('')}</tr></thead><tbody>
  ${FINALS.map(f => `<tr><th class="rowh">${f}</th>${INITIALS.map(i => { const s = spell(i, f); const k = fileKey(s); return sy[k] ? `<td><button data-k="${k}" data-s="${s}">${s}</button></td>` : '<td></td>'; }).join('')}</tr>`).join('')}
  </tbody></table></div></section>

  <section class="section" id="initials"><div class="section-title"><h2>Initials — how to make each sound</h2></div>
  <div class="grid g3">${INI_TIPS.map(([g, where, tip, ex]) => `<div class="card"><h3>${g}</h3><div class="eyebrow" style="color:var(--jade)">${where}</div><p class="small" style="margin-top:6px">${tip}</p><div class="row">${ex.map(e => `<button class="chip" data-k="${fileKey(e)}1" data-direct>${mark(e, 1)}</button>`).join('')}</div></div>`).join('')}</div>
  <div class="callout jade">The key idea is <b>aspiration</b>: b/p, d/t, g/k, j/q, zh/ch, z/c are pairs that differ only in the puff of air. Chinese b is not "voiced" like English b.</div></section>

  <section class="section" id="finals"><div class="section-title"><h2>Finals — the tricky ones</h2></div>
  <div class="grid g2">${FIN_TIPS.map(([a, b]) => `<div class="card flat"><h4>${a}</h4><p class="small muted" style="margin:0">${b}</p></div>`).join('')}</div></section>

  <section class="section" id="sandhi"><div class="section-title"><h2>Tone changes (变调)</h2></div>
  <div class="grid g3">
   <div class="card"><h3>Two 3rd tones</h3><p>When two 3rd tones meet, the first becomes 2nd tone.</p><p class="zh" style="font-size:1.3rem">你好 nǐ hǎo → <b class="t2">ní</b> hǎo</p><p class="small muted">Pinyin is still written nǐ hǎo.</p></div>
   <div class="card"><h3>不 bù</h3><p>不 becomes 2nd tone before a 4th tone.</p><p class="zh" style="font-size:1.3rem">不是 → <b class="t2">bú</b> shì · 不对 → <b class="t2">bú</b> duì</p><p class="small muted">Otherwise it stays bù: 不好 bù hǎo.</p></div>
   <div class="card"><h3>一 yī</h3><p>Before a 4th tone → yí. Before tones 1, 2, 3 → yì. Alone, counting or at the end → yī.</p><p class="zh" style="font-size:1.3rem">一个 <b class="t2">yí</b> ge · 一天 <b class="t4">yì</b> tiān · 第一 dì yī</p></div>
   <div class="card"><h3>Half 3rd tone</h3><p>A 3rd tone before tones 1, 2, 4 or neutral only dips low — it doesn't rise back up.</p><p class="zh" style="font-size:1.3rem">很多 hěn duō · 老师 lǎo shī</p></div>
   <div class="card"><h3>Neutral tone</h3><p>Particles (的 了 吗 呢 吧), doubled family words (妈妈 爸爸) and many second syllables (东西 dōngxi, 朋友 péngyou) are light and short.</p></div>
   <div class="card"><h3>儿化 erhua</h3><p>In northern speech 儿 joins the syllable before it: 哪儿 nǎr, 一点儿 yìdiǎnr, 玩儿 wánr.</p></div>
  </div></section>

  <section class="section" id="pairs"><div class="section-title"><h2>Tone pairs</h2><span class="muted">Most words have two syllables — drill these 20 combinations</span></div>
  <div class="tablewrap"><table class="simple" id="pairsT"><tbody><tr><td class="muted">loading…</td></tr></tbody></table></div></section>
  </div>`;
  main.querySelectorAll('[data-jump]').forEach(a => a.onclick = (e) => { e.preventDefault(); main.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); });
  let chTone = 0;
  main.querySelector('#chTone').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; chTone = +b.dataset.t; main.querySelectorAll('#chTone button').forEach(x => x.classList.toggle('on', x === b)); };
  main.addEventListener('click', (e) => {
    const p = e.target.closest('[data-syl]'); if (p) return playSyllable(p.dataset.syl, p);
    const d = e.target.closest('[data-direct]'); if (d) return playSyllable(d.dataset.k, d);
    const c = e.target.closest('.chart button[data-k]');
    if (c) {
      const k = c.dataset.k, s = c.dataset.s, tones = sy[k];
      if (chTone) { if (tones.includes(chTone)) playSyllable(k + chTone, c); else toast(`${s} has no tone ${chTone}`); return; }
      showPop(c, k, s, tones);
    }
  });
  function showPop(anchor, k, s, tones) {
    document.querySelector('.pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'pop';
    pop.innerHTML = `<div class="row"><b style="font-size:1.3rem">${s}</b><span class="spacer"></span><button class="iconbtn" data-x style="width:32px;height:32px">✕</button></div><div class="tone-pick" style="margin-top:10px">${[1, 2, 3, 4].map(t => `<button class="t${t}" ${tones.includes(t) ? '' : 'disabled style="opacity:.3"'} data-pt="${t}">${mark(s, t)}</button>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn sm ghost" data-all>▶ All tones</button><a class="btn sm ghost" href="#/checker/${encodeURIComponent(mark(s, tones[0]))}">Practise</a></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left + r.width / 2 - pop.offsetWidth / 2)) + 'px';
    pop.style.top = (r.bottom + 8 + pop.offsetHeight > innerHeight ? r.top - pop.offsetHeight - 8 : r.bottom + 8) + 'px';
    pop.onclick = async (e) => {
      if (e.target.closest('[data-x]')) return pop.remove();
      const b = e.target.closest('[data-pt]'); if (b) return playSyllable(k + b.dataset.pt, b);
      if (e.target.closest('[data-all]')) for (const t of tones) await playSyllable(k + t);
    };
    if (tones.length) playSyllable(k + tones[0]);
  }
  const closePop = (e) => { if (!e.target.closest('.pop') && !e.target.closest('.chart button')) document.querySelector('.pop')?.remove(); };
  document.addEventListener('pointerdown', closePop);
  // trainer
  const keys = Object.keys(sy).filter(k => sy[k].length === 4 && !/^(_|fe|fiao|lo|yo)/.test(k));
  let cur = null, right = 0, total = 0, answered = false;
  main.querySelector('#trPlay').onclick = (e) => { if (!cur || answered) { cur = { k: pick(keys), t: 1 + Math.floor(Math.random() * 4) }; answered = false; main.querySelector('#trSt').textContent = 'Listen… then pick the tone.'; main.querySelector('#trSt').className = 'status'; } playSyllable(cur.k + cur.t, e.currentTarget); };
  main.querySelector('#trPick').onclick = (e) => {
    const b = e.target.closest('button'); if (!b || !cur || answered) return;
    answered = true; total++; const ok = +b.dataset.t === cur.t; if (ok) right++;
    const st = main.querySelector('#trSt'); st.className = 'status ' + (ok ? 'good' : 'bad');
    st.innerHTML = `${ok ? '✓ Correct!' : '✗ It was tone ' + cur.t + '.'} <b>${mark(cur.k.replace(/v/g, 'ü'), cur.t)}</b> — press play for the next one.`;
    main.querySelector('#trScore').textContent = `${right} / ${total}`;
  };
  // tone pairs
  const ws = (await Promise.all([1, 2, 3].map(loadLevel))).flat().filter(w => w.a && w.p.split(' ').length === 2);
  const tn = (s) => { for (const [t, m] of [[1, 'āēīōūǖ'], [2, 'áéíóúǘ'], [3, 'ǎěǐǒǔǚ'], [4, 'àèìòùǜ']]) if ([...s].some(c => m.includes(c))) return t; return 5; };
  const grid = {}; ws.forEach(w => { const [a, b] = w.p.split(' ').map(tn); const k = a + '' + b; (grid[k] ||= []).push(w); });
  const T = main.querySelector('#pairsT');
  T.innerHTML = `<thead><tr><th></th>${[1, 2, 3, 4, 5].map(b => `<th class="t${b}">+ ${b === 5 ? 'neutral' : 'tone ' + b}</th>`).join('')}</tr></thead><tbody>${[1, 2, 3, 4].map(a => `<tr><th class="t${a}">Tone ${a}</th>${[1, 2, 3, 4, 5].map(b => { const l = (grid[a + '' + b] || []).slice(0, 3); return `<td>${l.map(w => `<button class="chip" data-pw="${w.id}" style="margin:2px"><span class="zh">${esc(w.s)}</span> ${pyHtml(w.p)}</button>`).join('') || '<span class="muted">—</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody>`;
  const wmap = new Map(ws.map(w => [w.id, w]));
  T.onclick = (e) => { const b = e.target.closest('[data-pw]'); if (b) playWord(wmap.get(b.dataset.pw), b); };
  return () => { document.removeEventListener('pointerdown', closePop); document.querySelector('.pop')?.remove(); };
}
