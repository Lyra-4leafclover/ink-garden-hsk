# 墨园 Ink Garden — HSK 1–6

A free, beautiful website for learning Chinese from HSK 1 to HSK 6. Everything runs in the browser — no account, no server, progress is saved on your device. Works on phone, iPad and laptop, and can be added to the home screen like an app.

## What's inside

- **All 4,991 HSK 1–6 words** with pinyin, meanings, measure words, radicals, native-speaker audio and example sentences
- **Stroke order** animations for every character + the stroke rules and 24 common radicals
- **Tracing on iPad** (finger or Apple Pencil) with stroke-by-stroke checking, plus 米字格/田字格 free practice
- **Pinyin & tones** chart with audio for every syllable in all four tones
- **Pronunciation checker** — speak into the mic, see which syllables/tones were right and your pitch curve
- **80 grammar points** (HSK 1–6) with examples and word-order exercises
- **Sentence building** with real sentences
- **12 picture scenes** (188 tap-to-learn words) with quizzes
- **56 classical & modern poems** with pinyin, translations, notes, background, recitation mode + a guide to reading poetry
- **3 real texts** — 鲁迅《孔乙己》《故乡》 and 《西游记》第一回 — in a tap-a-word reader + a guide to reading novels
- **180 mock tests** (30 per level) in HSK format — listening, reading, writing — plus unlimited practice
- **Flashcards** with spaced repetition, progress dashboard, streaks, study calendar, backup/restore
- Search, word of the day, night mode, offline support

## Run it locally

It's a static site. From this folder:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. (Opening `index.html` directly from disk won't work because the browser blocks loading data files.)

## Publish free with GitHub Pages

Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. The site appears at `https://<username>.github.io/ink-garden-hsk/` after a minute.

## Rebuilding the data (optional)

Scripts in `build/` regenerate `data/` from the open sources below (`build_vocab.py`, `build_strokes.py`, `build_novels.py`).

## Credits & licences

- HSK word lists — [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT)
- Audio — [audio-cmn](https://github.com/hugolpz/audio-cmn) (CC BY-SA); the `audio/` folder is shared under the same licence
- Example sentences — [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR)
- Stroke data — [Hanzi Writer](https://hanziwriter.org) / Make Me a Hanzi (Arphic Public License)
- Dictionary — [CC-CEDICT](https://cc-cedict.org) (CC BY-SA 4.0)
- Pinyin — [pinyin-pro](https://github.com/zh-lx/pinyin-pro) (MIT)
- Novel texts — [Wikisource](https://zh.wikisource.org) (public domain)
