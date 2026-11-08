const KEY = 'inkgarden.v1';
const DAY = 86400000;
let state;
function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { state = {}; }
  state.cards ??= {}; state.tests ??= []; state.days ??= {}; state.settings ??= {}; state.saved ??= []; state.poems ??= {}; state.scenes ??= {};
}
load();
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
export const get = () => state;
export const today = () => new Date().toLocaleDateString('en-CA');
export function activity(n = 1) { const d = today(); state.days[d] = (state.days[d] || 0) + n; save(); }
export function streak() {
  let s = 0; const d = new Date();
  if (!state.days[today()]) d.setDate(d.getDate() - 1);
  while (state.days[d.toLocaleDateString('en-CA')]) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
export const setting = (k, v) => { if (v === undefined) return state.settings[k]; state.settings[k] = v; save(); };
// ---- spaced repetition (SM-2 style) ----
export function card(id) { return state.cards[id]; }
export function addCard(id) { if (!state.cards[id]) { state.cards[id] = { due: Date.now(), ivl: 0, ease: 2.5, reps: 0, lapses: 0, added: Date.now() }; save(); return true; } return false; }
export function removeCard(id) { delete state.cards[id]; save(); }
export function status(id) { const c = state.cards[id]; if (!c) return ''; if (c.known || c.ivl >= 21) return 'known'; return 'learning'; }
export function markKnown(id, on = true) { addCard(id); state.cards[id].known = on; if (on) { state.cards[id].ivl = Math.max(state.cards[id].ivl, 30); state.cards[id].due = Date.now() + 30 * DAY; } save(); }
/** grade: 0 again, 1 hard, 2 good, 3 easy */
export function review(id, grade) {
  addCard(id); const c = state.cards[id];
  if (grade === 0) { c.lapses++; c.reps = 0; c.ivl = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = Date.now() + 60 * 1000; }
  else {
    c.reps++;
    if (c.reps === 1) c.ivl = grade === 3 ? 4 : grade === 1 ? 0.5 : 1;
    else if (c.reps === 2) c.ivl = grade === 3 ? 7 : grade === 1 ? 2 : 3;
    else c.ivl = Math.round(c.ivl * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));
    c.ease = Math.max(1.3, c.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
    c.due = Date.now() + c.ivl * DAY;
  }
  c.last = Date.now(); save(); activity();
}
export function nextIvlLabel(id, grade) {
  const c = state.cards[id] || { reps: 0, ivl: 0, ease: 2.5 };
  if (grade === 0) return '1 min';
  let ivl;
  if (c.reps === 0) ivl = grade === 3 ? 4 : grade === 1 ? 0.5 : 1;
  else if (c.reps === 1) ivl = grade === 3 ? 7 : grade === 1 ? 2 : 3;
  else ivl = Math.round(c.ivl * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));
  return ivl < 1 ? '12 h' : ivl < 30 ? `${ivl} d` : ivl < 365 ? `${Math.round(ivl / 30)} mo` : `${(ivl / 365).toFixed(1)} y`;
}
export function dueCards() { const now = Date.now(); return Object.entries(state.cards).filter(([, c]) => c.due <= now).map(([id]) => id); }
export function addTest(r) { state.tests.unshift(r); state.tests = state.tests.slice(0, 300); save(); activity(5); }
export function exportData() { return JSON.stringify(state); }
export function importData(txt) { const d = JSON.parse(txt); localStorage.setItem(KEY, JSON.stringify(d)); load(); }
export function resetAll() { localStorage.removeItem(KEY); load(); }
