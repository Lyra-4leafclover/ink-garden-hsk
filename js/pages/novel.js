import { esc, icons, pyHtml } from '../lib/ui.js';
import { json, getWord } from '../lib/data.js';
import { speak, stop, playWord } from '../lib/audio.js';
import { SUMMARIES, NOVEL_TIPS } from '../content/novels.js';
import * as store from '../lib/store.js';

const isHan = (t) => /^[\u4e00-\u9fff]+$/.test(t);
export async function render(main, [id]) {
  let n; try { n = await json(`data/novels/${id}.json`); } catch { main.innerHTML = '<div class="wrap"><h1>Not found</h1><a href="#/reading">Back</a></div>'; return; }
  const S = SUMMARIES[id] || {}, st = store.get();
  const opt = { py: !!store.setting('rdPy'), hl: store.setting('rdHl') !== false, sum: store.setting('rdSum') !== false, fs: store.setting('rdFs') || 1.35 };
  main.innerHTML = `<div class="wrap narrow">
    <div class="row" style="justify-content:space-between;margin:18px 0"><a href="#/reading" class="btn sm ghost">${icons.back} All books</a><span class="muted small">${n.chars.toLocaleString()} characters</span></div>
    <div class="page-head" style="margin-top:0"><div class="eyebrow">${n.author} ${esc(n.authorEn)} · ${n.year}</div><h1 class="zh">${esc(n.title)}</h1><b>${esc(n.en)}</b><p class="lead">${esc(n.intro)}</p></div>
    <div class="callout"><b>Reading tips</b><ul style="margin:6px 0 0;padding-left:20px">${(NOVEL_TIPS[id] || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <details class="card flat" style="margin-bottom:16px"><summary style="cursor:pointer"><b>Key vocabulary (${n.key.length})</b></summary><div class="words" style="margin-top:12px">${n.key.map(k => { const d = n.dict[k]; return `<div class="wcard"><div class="hz" style="font-size:1.6rem">${esc(k)}</div><div class="py">${pyHtml(d[0], { join: false })}</div><div class="mn small">${esc(d[1].slice(0, 60))}</div></div>`; }).join('')}</div></details>
    <div class="reader-bar"><button class="chip ${opt.py ? 'on' : ''}" data-o="py">拼 Pinyin</button><button class="chip ${opt.hl ? 'on' : ''}" data-o="hl">Highlight hard words</button><button class="chip ${opt.sum ? 'on' : ''}" data-o="sum">English summaries</button><span style="flex:1"></span><button class="chip" data-fs="-1">A−</button><button class="chip" data-fs="1">A+</button></div>
    <div class="reader" id="rd" style="--rfs:${opt.fs}rem"></div>
    <div class="callout jade" style="margin-top:24px">读完了！Finished? <a href="#/review">Review the words you saved →</a> or try <a href="#/reading">another book</a>.</div>
  </div>
  <div class="wpop" id="wp" hidden></div>`;
  const rd = main.querySelector('#rd'), wp = main.querySelector('#wp');
  const cls = (t) => { const d = n.dict[t]; if (!d) return ''; return d[2] === 0 ? 'lv7' : 'lv' + d[2]; };
  rd.innerHTML = n.paras.map((p, i) => `${S[i] ? `<div class="summary-box">${S[i]}</div>` : ''}<p data-i="${i}"><button class="play sm pread" data-i="${i}" aria-label="Read paragraph">${icons.play}</button>${p.map(t => isHan(t) ? `<span class="w ${cls(t)}" data-t="${esc(t)}" data-p="${esc(n.dict[t]?.[0] || '')}">${esc(t)}</span>` : esc(t)).join('')}</p>`).join('');
  const apply = () => { rd.classList.toggle('show-py', opt.py); rd.classList.toggle('hl', opt.hl); rd.classList.toggle('no-sum', !opt.sum); rd.style.setProperty('--rfs', opt.fs + 'rem'); };
  apply();
  main.querySelector('.reader-bar').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.o) { const o = b.dataset.o; opt[o] = !opt[o]; b.classList.toggle('on', opt[o]); store.setting({ py: 'rdPy', hl: 'rdHl', sum: 'rdSum' }[o], opt[o]); }
    if (b.dataset.fs) { opt.fs = Math.min(2.2, Math.max(1, +(opt.fs + b.dataset.fs * 0.15).toFixed(2))); store.setting('rdFs', opt.fs); }
    apply();
  };
  let sel = null;
  rd.onclick = async (e) => {
    const pr = e.target.closest('.pread');
    if (pr) { const i = +pr.dataset.i; speak(n.paras[i].join(''), { rate: 0.85, btn: pr }); return; }
    const w = e.target.closest('.w'); if (!w) return;
    sel?.classList.remove('sel'); sel = w; w.classList.add('sel');
    const t = w.dataset.t, d = n.dict[t] || ['', '', 0, ''];
    const hw = d[3] ? await getWord(d[3]) : null;
    wp.innerHTML = `<button class="iconbtn x" aria-label="Close">${icons.x}</button><div class="row" style="flex-wrap:nowrap;gap:14px;align-items:center"><button class="play" id="wpp">${icons.play}</button><div><div class="zh" style="font-size:2rem;line-height:1.1">${esc(t)}</div><div>${pyHtml(d[0], { join: false })}</div></div><div style="flex:1;min-width:0"><div>${esc(hw ? hw.m.join('; ') : d[1] || '(no dictionary entry — likely a name or literary word)')}</div><div class="small muted">${d[2] ? `HSK ${d[2]}` : 'Not in HSK'}</div></div></div>
      <div class="row" style="margin-top:10px">${hw ? `<button class="btn sm" id="wpa">${store.card(hw.id) ? '✓ In flashcards' : '+ Flashcards'}</button><a class="btn sm ghost" href="#/word/${hw.id}">Stroke order &amp; examples</a>` : `<a class="btn sm ghost" href="#/practice/${encodeURIComponent(t)}">Practise writing</a>`}</div>`;
    wp.hidden = false;
    wp.querySelector('.x').onclick = () => { wp.hidden = true; sel?.classList.remove('sel'); };
    wp.querySelector('#wpp').onclick = (ev) => hw ? playWord(hw, ev.currentTarget) : speak(t, { btn: ev.currentTarget });
    wp.querySelector('#wpa')?.addEventListener('click', (ev) => { store.addCard(hw.id); ev.currentTarget.textContent = '✓ In flashcards'; });
    hw ? playWord(hw) : speak(t);
  };
  // remember position
  const ps = [...rd.querySelectorAll('p[data-i]')];
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { const i = +en.target.dataset.i; const r = (st.reading ||= {}); if (!(r[id] >= i)) { r[id] = i; store.save(); } } }), { rootMargin: '-40% 0px -40% 0px' });
  ps.forEach(p => io.observe(p));
  const last = st.reading?.[id];
  if (last > 2) { const t = document.createElement('div'); t.className = 'callout'; t.innerHTML = `You stopped at paragraph ${last + 1}. <button class="btn sm" id="resume">Continue reading</button>`; rd.before(t); t.querySelector('#resume').onclick = () => ps[last]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  store.activity();
  return () => { io.disconnect(); stop(); };
}
