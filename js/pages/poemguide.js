import { esc, autoRuby, sayBtn } from '../lib/ui.js';

const STEPS = [
 ['1. Know the form', 'Most Tang poems are 绝句 juéjù (4 lines) or 律诗 lǜshī (8 lines), with 5 (五言) or 7 (七言) characters per line. 词 cí poems follow a song tune, so lines vary in length.'],
 ['2. Read with the rhythm', 'Five-character lines break 2 + 3: 床前 / 明月光. Seven-character lines break 2 + 2 + 3: 两个 / 黄鹂 / 鸣翠柳. Pause slightly at each break and lengthen the last syllable of each line.'],
 ['3. One character ≈ one word', 'Classical Chinese is very compact. Most characters are whole words: 望 = look at, 思 = think of, 闻 = hear. Modern Chinese often turns them into two-character words (思 → 思念, 闻 → 听到).'],
 ['4. Fill in the missing subject', 'Poems rarely say "I". 举头望明月 — who raises their head? The poet. Add the subject in your head as you read.'],
 ['5. Look for parallel lines (对仗)', 'In regulated verse, two lines mirror each other word for word: noun ↔ noun, colour ↔ colour, number ↔ number. 两个黄鹂鸣翠柳 / 一行白鹭上青天. Once you spot this, meaning becomes easier.'],
 ['6. Learn the symbols', 'Moon 月 = homesickness; willow 柳 = farewell (柳 sounds like 留 "stay"); wild goose 雁 = letters from afar; plum 梅 = perseverance; autumn 秋 = sadness; wine 酒 = friendship or sorrow.'],
 ['7. Feel the rhyme', 'Even-numbered lines rhyme (and often line 1): 光 guāng, 霜 shuāng, 乡 xiāng. Some rhymes no longer match in modern Mandarin because pronunciation has changed in 1300 years.'],
 ['8. Know the background', 'Who wrote it, when, and why? A poem written in exile or war reads very differently. Every poem here has a background note.'],
 ['9. Read aloud, then recite', 'Chinese students memorise poems by reading aloud (朗读) many times. Use Read aloud, then try Recite test: characters disappear and you fill them in.'],
];
const SYMBOLS = [['月', 'moon', 'home, family, longing'], ['柳', 'willow', 'farewell'], ['雁', 'wild goose', 'news from home'], ['梅', 'plum blossom', 'endurance, purity'], ['竹', 'bamboo', 'integrity, flexibility'], ['菊', 'chrysanthemum', 'retirement, autumn'], ['松', 'pine', 'long life, steadfastness'], ['酒', 'wine', 'friendship, sorrow'], ['秋', 'autumn', 'sadness, ageing'], ['春', 'spring', 'youth, hope'], ['鸟', 'returning birds', 'going home'], ['水', 'flowing water', 'passing time']];
const CLASSIC = [['之', 'zhī', '的 (possessive) / him, it / to go'], ['其', 'qí', 'his, her, its'], ['乃', 'nǎi', 'then; is'], ['亦', 'yì', 'also (= 也)'], ['皆', 'jiē', 'all (= 都)'], ['欲', 'yù', 'want to (= 想)'], ['君', 'jūn', 'you (polite)'], ['吾', 'wú', 'I, my'], ['何', 'hé', 'what, why, how'], ['无', 'wú', 'there is no (= 没有)'], ['闻', 'wén', 'to hear'], ['归', 'guī', 'to return home'], ['尽', 'jìn', 'to end, exhaust'], ['似', 'sì', 'to resemble (= 像)'], ['于', 'yú', 'at, in; than']];

export async function render(main) {
  main.innerHTML = `<div class="wrap narrow">
    <div class="page-head"><div class="eyebrow">读诗 · Guide</div><h1>How to read a Chinese poem</h1>
    <p class="lead">Classical poems are short, musical and dense. Here is a simple method that works from HSK 2 onwards.</p></div>
    <div class="card poem-sheet" style="margin-bottom:24px"><div class="eyebrow">Example · 静夜思 · 李白</div>
      ${['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'].map(l => `<div class="poem-line" style="flex-direction:column;align-items:center"><div class="pl-zh">${autoRuby(l)}</div></div>`).join('')}
      <div style="margin-top:10px">${sayBtn('床前明月光，疑是地上霜。举头望明月，低头思故乡。')} <a href="#/poem/1">Open the full lesson →</a></div></div>
    ${STEPS.map(([t, d]) => `<div class="card flat" style="margin-bottom:12px"><h3 style="margin:0 0 4px">${esc(t)}</h3><p style="margin:0">${esc(d)}</p></div>`).join('')}
    <section class="section"><div class="section-title"><h2>Common symbols</h2></div><div class="grid g4">${SYMBOLS.map(([z, e, m]) => `<div class="card flat" style="text-align:center"><div class="zh" style="font-size:2.2rem;color:var(--red)">${z}</div><b>${e}</b><div class="muted small">${m}</div></div>`).join('')}</div></section>
    <section class="section"><div class="section-title"><h2>15 classical words you'll meet everywhere</h2></div><div class="grid g3">${CLASSIC.map(([z, p, m]) => `<div class="card flat row" style="flex-wrap:nowrap;gap:12px">${sayBtn(z, 'sm')}<span class="zh" style="font-size:1.8rem">${z}</span><div><b>${p}</b><div class="muted small">${esc(m)}</div></div></div>`).join('')}</div></section>
    <div class="row" style="justify-content:center;margin:30px 0"><a class="btn red" href="#/poems">Browse all poems →</a></div></div>`;
}
