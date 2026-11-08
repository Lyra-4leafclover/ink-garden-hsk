import { esc } from '../lib/ui.js';
import { writer, gridSvg } from '../lib/hanzi.js';

const BASIC = [
  ['横', 'héng', 'Horizontal', 'Left → right, slightly rising.', '一'],
  ['竖', 'shù', 'Vertical', 'Top → bottom, straight down.', '十'],
  ['撇', 'piě', 'Left-falling', 'From top right sweeping down to the left.', '人'],
  ['捺', 'nà', 'Right-falling', 'From top left down to the right, thickening at the end.', '八'],
  ['点', 'diǎn', 'Dot', 'A short press, usually downward to the right.', '六'],
  ['提', 'tí', 'Rising', 'Flick from lower left up to the right.', '习'],
  ['折', 'zhé', 'Turning', 'One stroke that changes direction (no lifting the pen).', '口'],
  ['钩', 'gōu', 'Hook', 'A small flick at the end of a stroke.', '小'],
];
const RULES = [
  ['先横后竖', 'Horizontal before vertical', '十', 'When a horizontal and vertical cross, write the horizontal first.'],
  ['先撇后捺', 'Left-falling before right-falling', '人', '撇 (丿) comes before 捺 (㇏).'],
  ['从上到下', 'Top to bottom', '三', 'Write upper parts before lower parts.'],
  ['从左到右', 'Left to right', '你', 'Write left components before right ones.'],
  ['从外到内', 'Outside before inside', '月', 'Frame first, then fill the inside — but…'],
  ['先里头后封口', 'Inside before closing', '国', '…for full enclosures, the bottom line that closes the box comes last.'],
  ['先中间后两边', 'Middle before sides', '小', 'When the middle stands out, write it first, then the left and right.'],
  ['点在最后', 'Top-right dots last', '我', 'A dot at the top right (我, 犬, 书) is usually written at the very end.'],
  ['底部走之最后', 'Bottom-left enclosures last', '这', '辶 and 廴 that wrap the bottom-left are written after what they hold.'],
];
const RADICALS = [['亻', 'person', '你 他 住'], ['口', 'mouth', '吃 喝 叫'], ['氵', 'water', '河 海 洗'], ['扌', 'hand', '打 找 拿'], ['木', 'tree / wood', '林 椅 桌'], ['女', 'woman', '妈 好 姐'], ['讠', 'speech', '说 话 语'], ['心 / 忄', 'heart', '想 快 忙'], ['日', 'sun / day', '明 时 早'], ['月', 'moon / flesh', '朋 脸 腿'], ['艹', 'grass', '花 茶 菜'], ['辶', 'walk', '这 还 进'], ['纟', 'silk', '红 绿 给'], ['钅', 'metal', '钱 铁 钟'], ['饣', 'food', '饭 饿 馆'], ['宀', 'roof', '家 字 安'], ['火 / 灬', 'fire', '灯 热 点'], ['土', 'earth', '地 场 坐'], ['目', 'eye', '看 眼 睛'], ['足 / 𧾷', 'foot', '跑 跳 路'], ['车', 'vehicle', '辆 较 转'], ['门', 'door', '问 间 闻'], ['雨', 'rain', '雪 零 雷'], ['贝', 'shell / money', '贵 买 货']];

export async function render(main) {
  main.innerHTML = `<div class="wrap">
    <div class="page-head"><div class="eyebrow">书法基础 · The foundations</div><h1>Stroke order</h1>
    <p class="lead">Every character is built from a small set of strokes written in a fixed order. Learning the order makes characters easier to remember, neater to write, and is required for handwriting input on phones and iPads.</p></div>
    <section class="section"><div class="section-title"><h2>The 8 basic strokes</h2></div>
      <div class="grid g4">${BASIC.map(([zh, py, en, d, ex], i) => `<div class="card" style="text-align:center"><div class="tz" style="max-width:140px" data-ch="${ex}" id="b${i}">${gridSvg('tian')}<div class="hw"></div></div><h3 style="margin:12px 0 0"><span class="zh">${zh}</span> <span class="muted" style="font-size:1rem">${py}</span></h3><b>${en}</b><p class="muted small" style="margin:4px 0 0">${d}</p></div>`).join('')}</div>
    </section>
    <section class="section"><div class="section-title"><h2>The rules of stroke order</h2><span class="muted">笔顺规则 — tap a character to replay</span></div>
      <div class="grid g3">${RULES.map(([zh, en, ex, d], i) => `<div class="card"><div class="row" style="align-items:flex-start;flex-wrap:nowrap;gap:16px"><div class="tz" style="max-width:120px;flex:none" data-ch="${ex}" id="r${i}">${gridSvg('mi')}<div class="hw"></div></div><div><div class="eyebrow">Rule ${i + 1}</div><h3 class="zh" style="font-size:1.25rem;margin:2px 0">${zh}</h3><b>${en}</b><p class="muted small" style="margin:4px 0 0">${d}</p></div></div></div>`).join('')}</div>
      <div class="callout" style="margin-top:18px">Want to practise? Open any word (e.g. <a href="#/word/1-0001">爱</a>) and use <b>Trace &amp; write</b>, or go to <a href="#/practice">Writing practice</a> to trace anything you type.</div>
    </section>
    <section class="section"><div class="section-title"><h2>24 radicals worth knowing</h2><span class="muted">部首 — the meaning hints inside characters</span></div>
      <div class="grid g6">${RADICALS.map(([r, m, ex]) => `<div class="card flat" style="text-align:center;padding:14px"><div class="zh" style="font-size:2.4rem;line-height:1.1;color:var(--red)">${r}</div><b class="small">${m}</b><div class="zh muted">${ex.split(' ').map(c => `<a href="#/practice/${encodeURIComponent(c)}" style="color:inherit;text-decoration:none">${c}</a>`).join(' ')}</div></div>`).join('')}</div>
    </section></div>`;
  const ws = [];
  const io = new IntersectionObserver((ents) => ents.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, ch = el.dataset.ch;
    const w = writer(el.querySelector('.hw'), ch, { showCharacter: false, showOutline: true, delayBetweenLoops: 1600 });
    w.loopCharacterAnimation(); ws.push(w);
    el.onclick = () => { w.hideCharacter(); w.animateCharacter(); };
  }), { rootMargin: '100px' });
  main.querySelectorAll('[data-ch]').forEach(el => io.observe(el));
  return () => { io.disconnect(); ws.forEach(w => { try { w.pauseAnimation(); } catch {} }); };
}
