let current = null, currentBtn = null;
function setBtn(btn, on) { if (btn) btn.classList.toggle('playing', on); }
export function stop() {
  if (current) { try { current.pause(); } catch {} current = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  setBtn(currentBtn, false); currentBtn = null;
}
export function playFile(src, btn) {
  stop();
  return new Promise((res) => {
    const a = new Audio(src); current = a; currentBtn = btn; setBtn(btn, true);
    a.onended = a.onerror = () => { setBtn(btn, false); res(); };
    a.play().catch(() => { setBtn(btn, false); res(); });
  });
}
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices().filter(v => /^zh|cmn/i.test(v.lang)); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function bestVoice() {
  const pref = localStorage.getItem('inkgarden.voice');
  const cn = voices.filter(v => /zh[-_]CN|cmn/i.test(v.lang));
  const pool = cn.length ? cn : voices;
  return pool.find(v => v.name === pref) || pool.find(v => /Xiaoxiao|Yunxi|Tingting|Ting-Ting|普通话|Mandarin|Lili|Yaoyao|Huihui/i.test(v.name) && !/HK|TW/.test(v.lang)) || pool[0];
}
export const ttsAvailable = () => 'speechSynthesis' in window;
export const zhVoices = () => voices;
export function speak(text, { rate = 0.9, btn } = {}) {
  stop();
  if (!ttsAvailable()) return Promise.resolve(false);
  return new Promise((res) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = rate; const v = bestVoice(); if (v) u.voice = v;
    currentBtn = btn; setBtn(btn, true);
    u.onend = u.onerror = () => { setBtn(btn, false); res(true); };
    speechSynthesis.speak(u);
  });
}
export function playWord(w, btn, { slow = false } = {}) {
  if (w.a && !slow) return playFile(`audio/w/${w.id}.mp3`, btn);
  return speak(w.s, { rate: slow ? 0.55 : 0.8, btn });
}
// syllable key like "ma3" / "lv4"
export function playSyllable(key, btn) { return playFile(`audio/s/${key}.mp3`, btn); }
