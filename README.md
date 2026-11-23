# 🦴 Bone Explorer

A kid-friendly (ages 6–9) explorer of all 206 bones in the human skeleton. Zoom in, tap any bone, and learn what it does, a fun fact, and something to try on your own body.

## Run it

It's a static site with no build step and no dependencies.

- Open `index.html` in a browser, **or**
- Serve the folder: `python3 -m http.server` and visit http://localhost:8000
- To deploy, upload the folder to any static host (GitHub Pages, Netlify, etc.).

Deep links work: `index.html#femur-l` opens the left thigh bone.

## Features

- **All 206 bones** drawn as separate SVG shapes, with front and back views plus close-ups for the skull side, the ear bones and the roof of the mouth.
- **Zoom:** pinch, scroll, drag or use the buttons. Tapping a bone that's too small to hit zooms in toward it first.
- **Info card** for each bone: everyday name, real name with a "say it" guide, what it does, a fun fact, and a "Try it!" activity.
- **Explore by body part:** chips that zoom to a body part and list its bones.
- **Search** by everyday or real name ("kneecap", "patella", "toe").
- **Quiz** with Easy, Medium and Expert levels. Expert asks for the exact side.
- **Read aloud** using the browser's built-in speech.
- **Progress:** found bones are remembered in this browser (localStorage).

## Files

| File | What it does |
| --- | --- |
| `about.html` | About page: where the site came from, privacy notes and a link to this repo |
| `js/geo.js` | Shape helpers that turn control points into smooth, shaded bone paths |
| `js/scenes.js` | The drawings: front, back, skull side, ear and roof-of-mouth views |
| `js/bones.js` | Text for every bone, plus the body-part groups |
| `js/viewer.js` | Pan, zoom, pinch and tap handling |
| `js/app.js` | The UI: selection, info panel, search, quiz and speech |
| `css/style.css` | Styles, including the phone bottom-sheet layout |

## License

Copyright © 2026 Nicolas Nowinski. Released under the [MIT License](LICENSE).
