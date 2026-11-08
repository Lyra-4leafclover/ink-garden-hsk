import { esc, pyHtml, toneOf, stripTone, icons, pick } from '../lib/ui.js';
import { loadLevel, findBySimp } from '../lib/data.js';
import { playWord, speak, playSyllable } from '../lib/audio.js';
import { toneSvg } from './pinyin.js';
import * as store from '../lib/store.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const pinyinArr = (t) => window.pinyinPro ? pinyinPro.pinyin(t, { type: 'array', toneType: 'symbol' }) : [];
const initialOf = (s) => (s.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/) || [''])[0];

// autocorrelation pitch detector (Hz) on Float32 frame
function detectPitch(buf, sr) {
  let rms = 0; for (const v of buf) rms += v * v; rms = Math.sqrt(rms / buf.length);
  if (rms < 0.012) return 0;
  const minL = Math.floor(sr / 450), maxL = Math.floor(sr / 70);
  let best = 0, bestL = 0;
  for (let L = minL; L <= maxL; L++) {
    let c = 0; for (let i = 0; i < buf.length - L; i++) c += buf[i] * buf[i + L];
    if (c > best) { best = c; bestL = L; }
  }
  let e = 0; for (let i = 0; i < buf.length - bestL; i++) e += buf[i] * buf[i];
  return best / e > 0.45 ? sr / bestL : 0;
}

export async function render(main, [target]) {
  let word = target ? decodeURIComponent(target) : null, entry = null;
  const lvSel = store.setting('checkerLevel') || 1;
  main.innerHTML = `<div class="wrap narrow">
    <div class="page-head"><div class="eyebrow">Speak &amp; check</div><h1>Pronunciation checker</h1>
    <p class="lead">Listen to the model, press the red button and say it. You get two kinds of feedback: <b>what Chinese speech recognition heard</b> (syllable &amp; tone check), and <b>your pitch curve</b> drawn against the ideal tone shapes.</p></div>
    <div class="card" style="text-align:center">
      <div class="row" style="justify-content:center;margin-bottom:10px"><input type="text" id="tw" placeholder="Type a word or sentence" style="max-width:320px;font-family:var(--zh);font-size:1.15rem" value="${esc(word || '')}"><select id="lv">${[1, 2, 3, 4, 5, 6].map(l => `<option value="${l}" ${l == lvSel ? 'selected' : ''}>HSK ${l}</option>`).join('')}</select><button class="btn ghost" id="rand">Random word</button></div>
      <div id="target" style="margin:16px 0"></div>
      <div class="row" style="justify-content:center;margin-bottom:18px"><button class="btn red" id="model">${icons.play.replace('<svg', '<svg style="fill:currentColor;stroke:none"')} Hear model</button><button class="btn ghost" id="slow">Slow</button><button class="btn ghost" id="mine" disabled>▶ My recording</button></div>
      <button class="mic" id="mic" aria-label="Record">${icons.mic}</button>
      <div class="status" id="st" style="margin-top:12px">Tap the microphone and speak.</div>
      <div id="result"></div>
      <canvas class="pitch" id="cv" width="900" height="240" style="margin-top:16px"></canvas>
      <div class="small muted" style="margin-top:6px"><span style="color:var(--red)">━</span> your pitch &nbsp; <span style="color:var(--line2)">━</span> ideal tone shape</div>
    </div>
    <div class="callout" style="margin-top:18px">${SR ? 'Speech recognition works best in <b>Safari on iPad/iPhone/Mac</b> and <b>Chrome</b> on desktop/Android (Chrome sends audio to Google to recognise it). Allow microphone access when asked.' : 'Your browser has no built-in speech recognition (try Safari or Chrome). The pitch-curve check below still works!'} Recognition sometimes picks a homophone (a different character with the same sound) — that's still counted correct if the sounds match.</div>
  </div>`;
  const $ = (s) => main.querySelector(s);
  const st = $('#st'), res = $('#result'), cv = $('#cv'), ctx = cv.getContext('2d');
  let syls = [], recUrl = null, stream = null, ac = null, recording = false, pitches = [];

  async function setTarget(w) {
    word = w.trim(); entry = await findBySimp(word);
    syls = pinyinArr(word);
    $('#target').innerHTML = `<div class="zh" style="font-size:clamp(2.6rem,9vw,4.4rem);line-height:1.1">${esc(word)}</div><div style="font-size:1.4rem">${syls.map(s => `<span class="t${toneOf(s)}">${esc(s)}</span>`).join(' ')}</div>${entry ? `<div class="muted">${esc(entry.m)} · <a href="#/word/${entry.id}">HSK ${entry.lv}</a></div>` : ''}`;
    res.innerHTML = ''; drawPitch();
  }
  async function playModel(btn, slow) {
    if (entry && !slow) { const L = await loadLevel(entry.lv); const w = L.find(x => x.id === entry.id); return playWord(w, btn); }
    if (syls.length === 1 && !slow) { return playSyllable(stripTone(syls[0]).replace('ü', 'v') + toneOf(syls[0]), btn); }
    return speak(word, { rate: slow ? 0.5 : 0.85, btn });
  }
  $('#model').onclick = (e) => playModel(e.currentTarget);
  $('#slow').onclick = (e) => playModel(e.currentTarget, true);
  $('#rand').onclick = async () => { const L = +$('#lv').value; store.setting('checkerLevel', L); const ws = await loadLevel(L); const w = pick(ws); $('#tw').value = w.s; setTarget(w.s); };
  $('#tw').onchange = () => { if ($('#tw').value.trim()) setTarget($('#tw').value); };
  $('#mine').onclick = () => { if (recUrl) new Audio(recUrl).play(); };

  function drawPitch() {
    const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const n = Math.max(1, syls.length), seg = W / n;
    ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.strokeStyle = css('--line2');
    syls.forEach((s, i) => {
      const t = toneOf(s), x0 = i * seg + seg * 0.12, x1 = (i + 1) * seg - seg * 0.12, y = (v) => H - 20 - (v - 1) * (H - 40) / 4;
      ctx.beginPath();
      if (t === 1) { ctx.moveTo(x0, y(5)); ctx.lineTo(x1, y(5)); }
      if (t === 2) { ctx.moveTo(x0, y(3)); ctx.lineTo(x1, y(5)); }
      if (t === 3) { ctx.moveTo(x0, y(2)); ctx.quadraticCurveTo((x0 + x1) / 2, y(0.4), x1, y(i < n - 1 ? 1.5 : 4)); }
      if (t === 4) { ctx.moveTo(x0, y(5)); ctx.lineTo(x1, y(1)); }
      if (t === 5) { ctx.moveTo(x0 + seg * .3, y(2.5)); ctx.lineTo(x1 - seg * .3, y(2.5)); }
      ctx.stroke();
    });
    const v = pitches.filter(p => p > 0);
    if (v.length > 3) {
      const st = pitches.map(p => p > 0 ? 12 * Math.log2(p) : null);
      const vals = st.filter(x => x !== null).sort((a, b) => a - b);
      const lo = vals[Math.floor(vals.length * 0.05)], hi = vals[Math.floor(vals.length * 0.95)], range = Math.max(5, hi - lo);
      let first = st.findIndex(x => x !== null), last = st.length - 1 - [...st].reverse().findIndex(x => x !== null);
      const span = Math.max(1, last - first);
      ctx.strokeStyle = css('--red'); ctx.lineWidth = 4; ctx.beginPath(); let pen = false;
      for (let i = first; i <= last; i++) {
        if (st[i] === null) { pen = false; continue; }
        const x = W * 0.03 + (i - first) / span * W * 0.94, y = H - 20 - Math.min(1, Math.max(0, (st[i] - lo) / range)) * (H - 40);
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  async function startRec() {
    if (recording) return stopRec();
    if (!word) { st.textContent = 'Pick or type a word first.'; return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch { st.className = 'status bad'; st.textContent = 'Microphone permission was blocked. Allow it in your browser settings and try again.'; return; }
    recording = true; $('#mic').classList.add('rec'); st.className = 'status'; st.textContent = 'Listening… speak now, then tap again to stop.';
    pitches = []; res.innerHTML = '';
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 2048; src.connect(an);
    const buf = new Float32Array(an.fftSize);
    const tick = () => { if (!recording) return; an.getFloatTimeDomainData(buf); pitches.push(detectPitch(buf, ac.sampleRate)); drawPitch(); setTimeout(tick, 25); };
    tick();
    try { const mr = new MediaRecorder(stream); const chunks = []; mr.ondataavailable = e => chunks.push(e.data); mr.onstop = () => { recUrl = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })); $('#mine').disabled = false; }; mr.start(); stream._mr = mr; } catch {}
    if (SR) {
      const r = new SR(); r.lang = 'zh-CN'; r.interimResults = false; r.maxAlternatives = 5; stream._sr = r;
      r.onresult = (e) => { const alts = [...e.results[0]].map(a => a.transcript.replace(/[。，？！\s,.?!]/g, '')); grade(alts); };
      r.onerror = (e) => { if (e.error !== 'aborted') { res.innerHTML = `<p class="muted small">Speech recognition: ${esc(e.error)}. Use the pitch curve and your recording to compare.</p>`; } };
      r.onend = () => { if (recording) stopRec(); };
      try { r.start(); } catch {}
    } else setTimeout(() => recording && stopRec(), 3500);
  }
  function stopRec() {
    recording = false; $('#mic').classList.remove('rec');
    try { stream?._sr?.stop(); } catch {}
    try { stream?._mr?.stop(); } catch {}
    stream?.getTracks().forEach(t => t.stop()); ac?.close?.();
    if (!SR) st.textContent = 'Compare your red curve with the grey tone shapes. Tap ▶ My recording to listen back.';
    else if (!res.innerHTML) st.textContent = 'Processing…';
    store.activity();
  }
  function grade(alts) {
    const tgt = syls.map(s => ({ s, t: toneOf(s), b: stripTone(s) }));
    let best = null;
    for (const a of alts) {
      const got = pinyinArr(a).map(s => ({ s, t: toneOf(s), b: stripTone(s) }));
      const marks = tgt.map((x, i) => { const g = got[i]; if (!g) return 'bad'; if (g.b === x.b && (g.t === x.t || x.t === 5 || g.t === 5)) return 'ok'; if (g.b === x.b) return 'tone'; if (initialOf(g.b) === initialOf(x.b)) return 'bad'; return 'bad'; });
      const score = marks.filter(m => m === 'ok').length + marks.filter(m => m === 'tone').length * 0.5 - Math.abs(got.length - tgt.length) * 0.5;
      if (!best || score > best.score) best = { a, got, marks, score };
    }
    if (!best) return;
    const pct = Math.max(0, Math.round(best.score / tgt.length * 100));
    const exact = alts.includes(word.replace(/[。，？！\s,.?!]/g, ''));
    st.className = 'status ' + (pct >= 80 ? 'good' : 'bad');
    st.innerHTML = exact || pct === 100 ? '完美！Perfect — every sound and tone matched.' : pct >= 60 ? `Close! ${pct}% — check the highlighted syllables.` : `Keep practising — ${pct}%. Listen to the model again and copy the tone shapes.`;
    res.innerHTML = `<div class="small muted" style="margin-top:10px">Heard: <span class="zh" style="font-size:1.1rem;color:var(--ink)">${esc(best.a) || '—'}</span> ${best.got.map(g => esc(g.s)).join(' ')}</div>
    <div class="meter">${tgt.map((x, i) => `<div class="syl ${best.marks[i]}"><div class="hz">${esc([...word.replace(/[^\p{Script=Han}]/gu, '')][i] || '')}</div><div class="t${x.t}">${esc(x.s)}</div><div class="small">${best.marks[i] === 'ok' ? '✓' : best.marks[i] === 'tone' ? 'tone?' : best.got[i] ? 'heard ' + esc(best.got[i].s) : 'missed'}</div></div>`).join('')}</div>
    <div class="small muted">Green = right, yellow = right sound but the tone sounded different, red = different sound.</div>`;
    if (pct >= 80 && entry) store.activity(2);
  }
  $('#mic').onclick = startRec;
  if (word) setTarget(word); else $('#rand').click();
  return () => { if (recording) stopRec(); };
}
