import { esc } from '../lib/ui.js';
const STEPS = [
  ['Pick text slightly above your level', 'Aim for a text where you know about 90–95% of the words. Below that, reading becomes dictionary work. Graded readers (Mandarin Companion, Chinese Breeze) are perfect from HSK 3; real literature like Lu Xun works from HSK 5.'],
  ['Read the summary first', 'Knowing what happens lets your brain focus on language instead of plot. Each section here starts with a short English summary.'],
  ['Read a paragraph without stopping', 'Guess from context. Only tap words that appear again and again or that block your understanding.'],
  ['Find the skeleton of long sentences', 'Chinese puts all descriptions BEFORE the noun, so sentences can have long 的-chains. Find the subject and main verb first: 我 …… 回到 …… 故乡. Then add the details.'],
  ['Know the old-style words', 'Writing from the 1920s uses 罢 (吧), 么 (吗), 的 (地/得), 那 (哪). Classical novels use 道 (说), 甚 (什么), 却, 便 (就). They become familiar fast.'],
  ['Re-read and read aloud', 'Read the same chapter 2–3 times. The second time, turn pinyin off and read aloud. This is the fastest way to build reading speed.'],
  ['Collect words, not every word', 'Add 5–10 useful words per session to your flashcards. Review them tomorrow. Rare literary words can be ignored.'],
  ['Track your progress', 'The reader remembers where you stopped. A chapter a week is great progress.'],
];
const NEXT = [['Graded readers', 'Mandarin Companion · Chinese Breeze · Du Chinese app', 'HSK 2–4'], ['Short stories', '鲁迅《呐喊》, 老舍《骆驼祥子》excerpts, 沈从文《边城》', 'HSK 5–6'], ['Modern novels', '余华《活着》, 刘慈欣《三体》, 韩寒', 'HSK 6+'], ['Classics (abridged)', '少儿版《西游记》《三国演义》《红楼梦》', 'HSK 4+']];
export async function render(main) {
  main.innerHTML = `<div class="wrap narrow">
    <div class="page-head"><div class="eyebrow">读小说 · Guide</div><h1>How to read a Chinese novel</h1><p class="lead">Reading real books is the most enjoyable way to grow your vocabulary. Here's a method that works.</p></div>
    ${STEPS.map(([t, d], i) => `<div class="card flat" style="margin-bottom:12px;display:flex;gap:16px"><div class="zh" style="font-size:2rem;color:var(--red);line-height:1">${'一二三四五六七八'[i]}</div><div><h3 style="margin:0 0 4px">${esc(t)}</h3><p style="margin:0">${esc(d)}</p></div></div>`).join('')}
    <section class="section"><div class="section-title"><h2>The reader's tools</h2></div><div class="grid g2">
      <div class="card flat"><b>Tap a word</b><p class="muted small">See pinyin, meaning, HSK level and hear it.</p></div>
      <div class="card flat"><b>Pinyin on / off</b><p class="muted small">Pinyin above every word — turn it off as you improve.</p></div>
      <div class="card flat"><b>Highlight hard words</b><p class="muted small">Underlines HSK 5–6 and non-HSK words.</p></div>
      <div class="card flat"><b>Listen</b><p class="muted small">Have any paragraph read aloud.</p></div></div></section>
    <section class="section"><div class="section-title"><h2>What to read next</h2></div><div class="grid g2">${NEXT.map(([a, b, c]) => `<div class="card flat"><div class="row" style="justify-content:space-between"><b>${a}</b><span class="chip">${c}</span></div><p class="zh muted" style="margin:6px 0 0">${b}</p></div>`).join('')}</div></section>
    <div class="row" style="justify-content:center;margin:30px 0"><a class="btn red" href="#/reading">Start reading →</a></div></div>`;
}
