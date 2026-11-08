import { esc } from './ui.js';
const hex = (ch) => ch.codePointAt(0).toString(16);
const dataCache = new Map();
export function charData(ch) {
  if (!dataCache.has(ch)) dataCache.set(ch, fetch(`data/strokes/${hex(ch)}.json`).then(r => { if (!r.ok) throw new Error('no stroke data'); return r.json(); }).catch(e => { dataCache.delete(ch); throw e; }));
  return dataCache.get(ch);
}
export const hasStrokes = async (ch) => { try { await charData(ch); return true; } catch { return false; } };
const loader = (ch, onLoad, onError) => { charData(ch).then(onLoad).catch(onError); };
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export function gridSvg(type = 'mi') {
  const mi = type === 'mi' ? '<line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/>' : '';
  return `<svg class="grid" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/>${mi}</svg>`;
}
function size(el) { return Math.max(120, Math.floor(el.getBoundingClientRect().width)) || 300; }
export function writer(el, ch, opts = {}) {
  el.innerHTML = '';
  const s = size(el);
  return HanziWriter.create(el, ch, {
    width: s, height: s, padding: Math.round(s * 0.06), charDataLoader: loader,
    strokeColor: css('--ink'), radicalColor: css('--red'), outlineColor: css('--line2'), highlightColor: css('--jade'),
    drawingColor: css('--ink'), drawingWidth: Math.max(14, s / 22), strokeAnimationSpeed: 1, delayBetweenStrokes: 280,
    showCharacter: true, showOutline: true, onLoadCharDataError: () => { el.innerHTML = `<div class="ghost" style="font-size:${s * 0.7}px;color:var(--ink)">${esc(ch)}</div><div class="status small" style="position:absolute;bottom:4px;width:100%">stroke data unavailable</div>`; },
    ...opts,
  });
}
/** Renders a stroke-by-stroke strip */
export async function strokeStrip(el, ch) {
  try {
    const d = await charData(ch);
    const n = d.strokes.length, ink = 'var(--ink)', red = 'var(--red)', dim = 'var(--line2)';
    el.innerHTML = d.strokes.map((_, k) => `<div class="st" title="Stroke ${k + 1}"><b>${k + 1}</b><svg viewBox="0 0 1024 1024"><g transform="translate(0,900) scale(1,-1)">${d.strokes.map((p, i) => `<path d="${p}" fill="${i < k ? ink : i === k ? red : dim}" ${i > k ? 'opacity=".5"' : ''}/>`).join('')}</g></svg></div>`).join('');
    return n;
  } catch { el.innerHTML = '<span class="muted small">No stroke data for this character.</span>'; return 0; }
}
export function staticChar(ch, px = 80) {
  return `<span class="zh" style="font-size:${px}px">${esc(ch)}</span>`;
}
/** Free-hand practice canvas with Apple Pencil pressure support */
export function practiceCanvas(box, { ghost = '', ghostOn = true } = {}) {
  box.innerHTML = `${gridSvg('mi')}<div class="ghost"></div><canvas></canvas>`;
  const cv = box.querySelector('canvas'), g = box.querySelector('.ghost');
  const ctx = cv.getContext('2d');
  let strokes = [], cur = null;
  function setGhost(ch, on) { g.textContent = on ? ch : ''; g.style.fontSize = box.clientWidth * 0.78 + 'px'; }
  setGhost(ghost, ghostOn);
  function resize() {
    const r = box.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
    g.style.fontSize = r.width * 0.78 + 'px';
  }
  function drawStroke(s) {
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const base = box.clientWidth / 26;
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      ctx.lineWidth = base * (0.35 + (b.p || 0.5) * 1.3);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0].x, s[0].y, base * 0.5, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); }
  }
  function redraw() { ctx.clearRect(0, 0, cv.width, cv.height); strokes.forEach(drawStroke); }
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'mouse' ? 0.5 : (e.pressure || 0.5) }; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); redraw(); });
  cv.addEventListener('pointermove', e => { if (!cur) return; e.preventDefault(); const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; evs.forEach(ev => cur.push(pt(ev))); redraw(); });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  const ro = new ResizeObserver(resize); ro.observe(box);
  return { clear() { strokes = []; redraw(); }, undo() { strokes.pop(); redraw(); }, setGhost, count: () => strokes.length };
}
