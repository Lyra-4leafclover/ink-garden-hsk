import { esc } from '../lib/ui.js';
import { SCENES } from '../content/scenes.js';
import * as store from '../lib/store.js';

export async function render(main) {
  const seen = store.get().scenes || {};
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">看图学词 · Picture scenes</div><h1>Picture scenes</h1>
    <p class="lead">${SCENES.length} hand-painted everyday places with ${SCENES.reduce((a, s) => a + s.spots.length, 0)} tappable words. Explore with labels on, then hide the labels and quiz yourself: “Where is the 猫?”</p></div>
    <div class="grid g3">${SCENES.map(s => `<a class="card scene-card" href="#/scene/${s.id}"><div class="ph"><img src="art/scene-${s.id}.webp" alt="${esc(s.en)}" loading="lazy"></div><div class="b"><div class="row" style="justify-content:space-between"><h3 style="margin:0"><span class="zh">${s.zh}</span> · ${esc(s.en)}</h3><span class="chip">HSK ${s.lv}+</span></div><div class="muted small">${s.spots.length} words${seen[s.id] ? ` · quiz best ${seen[s.id]}%` : ''}</div></div></a>`).join('')}</div></div>`;
}
