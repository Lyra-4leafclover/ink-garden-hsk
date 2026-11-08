import { LEVEL_INFO } from '../lib/ui.js';
export async function render(main) {
  main.innerHTML = `<div class="wrap"><div class="page-head"><div class="eyebrow">Levels &amp; words</div><h1>HSK 1 – 6</h1>
  <p class="lead">The HSK (汉语水平考试) is the official Chinese proficiency test. Each level adds new words on top of the previous ones. Pick a level to browse its words, learn stroke order, hear native audio and practise.</p></div>
  <div class="grid g3">${[1, 2, 3, 4, 5, 6].map(L => { const i = LEVEL_INFO[L]; return `<a class="card level-card" href="#/level/${L}"><div class="lc-art" style="background-image:url(art/${i.art}.webp)"></div><div class="lc-body"><div class="lc-num">HSK ${L}<span>${i.zh} · ${i.name}</span></div><div class="muted small">${i.desc}</div></div></a>`; }).join('')}</div>
  <div class="callout" style="margin-top:28px"><b>HSK 2.0 vs 3.0:</b> these word lists follow the classic 6-level HSK (2.0) used by most textbooks and tests today. The newer HSK 3.0 has 9 levels and reuses almost all of these words, so everything here still counts.</div></div>`;
}
