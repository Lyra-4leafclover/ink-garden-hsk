import { esc } from '../lib/ui.js';
import { json } from '../lib/data.js';
import * as store from '../lib/store.js';

const IDS = ['kongyiji', 'guxiang', 'xiyouji1'];
export async function render(main) {
  const ns = await Promise.all(IDS.map(id => json(`data/novels/${id}.json`)));
  const pos = store.get().reading || {};
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">读小说 · Real literature</div><h1>Read real Chinese books</h1>
    <p class="lead">Three complete texts from classic Chinese literature, in a tap-to-translate reader. Tap any word for pinyin, meaning and audio; turn on pinyin over every word; highlight words above your level; add words to your flashcards.</p>
    <a class="btn" href="#/reading/guide">How to read a Chinese novel →</a></div>
    <div class="grid g3">${ns.map(n => { const p = pos[n.id]; const pct = p ? Math.round((p + 1) / n.paras.length * 100) : 0; return `<a class="card novel-card" href="#/novel/${n.id}">
      <div class="ph"><img src="art/novel-${n.id === 'xiyouji1' ? 'xiyouji' : n.id}.webp" alt="" loading="lazy"></div>
      <div class="b"><div class="row" style="justify-content:space-between"><span class="eyebrow">${n.author} ${esc(n.authorEn)} · ${n.year}</span><span class="chip">HSK ${n.lv}+</span></div>
      <h3 class="zh" style="font-size:1.7rem;margin:6px 0 0">${esc(n.title)}</h3><b>${esc(n.en)}</b>
      <p class="muted small">${esc(n.intro)}</p>
      <div class="small muted">${n.chars.toLocaleString()} characters · ${n.coverage}% of words are HSK words</div>
      ${pct ? `<div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div><div class="small muted">${pct}% read</div>` : ''}</div></a>`; }).join('')}</div>
    <div class="callout" style="margin-top:22px">All three texts are in the public domain (Lu Xun died in 1936; 西游记 is from the 16th century). Texts from <a href="https://zh.wikisource.org" target="_blank" rel="noopener">Wikisource</a>, converted to simplified characters.</div></div>`;
}
