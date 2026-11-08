const cache = new Map();
export function json(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }).catch(e => { cache.delete(url); throw e; }));
  return cache.get(url);
}
export const loadLevel = (L) => json(`data/hsk${L}.json`);
export const loadSentences = (L) => json(`data/sentences${L}.json`);
export const loadIndex = () => json('data/index.json');
export async function loadAll() { return (await Promise.all([1, 2, 3, 4, 5, 6].map(loadLevel))).flat(); }
export async function getWord(id) {
  const L = +String(id).split('-')[0];
  const words = await loadLevel(L);
  return words.find(w => w.id === id);
}
let bySimp = null;
export async function wordMap() {
  if (bySimp) return bySimp;
  const idx = await loadIndex();
  bySimp = new Map(idx.map(r => [r[0], { s: r[0], p: r[1], m: r[2], lv: r[3], id: r[4] }]));
  return bySimp;
}
export async function findBySimp(s) { return (await wordMap()).get(s); }
