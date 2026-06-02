# Frantic Barista

**Computer Graphics course demo: visual rendering, game-loop logic, and compact data representation.**

Frantic Barista is a real-time 2D canvas simulation where the player prepares coffee orders by matching ingredient ratios, temperature, and optional pastries before customer patience expires. The project is designed to be playable, but it also exposes the computer graphics ideas behind the experience.

## Professor Demo Focus

| Course idea | Where it appears in the project |
| --- | --- |
| 3D/2D visual pipeline analogy | The game maps mathematical state values into a fixed 800 x 450 canvas raster grid. |
| Raster drawing | `Renderer.js` draws all visible shapes onto the HTML canvas. |
| Curves and geometry | Cups, bows, croissants, pastries, gauges, and streams use arcs, quadratic curves, and Bezier curves. |
| Color and shading | The scene uses gradients, alpha blending, shadows, glow, and time-based lighting transitions. |
| Clipping and compositing | Cup shapes clip ingredient layers so the liquid appears inside the glass/cup body. |
| Animation loop | `Game.loop()` uses `requestAnimationFrame()` and delta time to update simulation state separately from drawing. |
| Interactive logic | Keyboard event listeners collect input, while `Cup.js` and `Customer.js` store mathematical state. |
| Collision-style thresholds | Order validation compares actual vs. target ingredient vectors using tolerance thresholds. |
| Procedural generation | `Customer.js` creates orders from level, difficulty, inventory, temperature, and pastry state. |
| Information theory | A live "Graphics Lab" panel shows Shannon entropy for each generated order. |
| Compression | The same panel compares verbose JSON order data with a compact symbolic recipe such as `I|E45|O35|B20`. |

[**Play the Game (GitHub Pages)**](https://aeroplein.github.io/frantic-barista/)

## Architecture

The project intentionally separates logic from rendering:

- `src/classes/Game.js` owns state, input, timing, scoring, progression, and the main loop.
- `src/classes/Cup.js` stores drink geometry and ingredient percentages.
- `src/classes/Customer.js` generates order requirements and patience decay.
- `src/classes/Renderer.js` performs all canvas drawing.
- `src/constants.js` stores colors, ingredient mappings, shop items, and key bindings.
- `index.html` contains the HUD, controls, canvas, shop screen, and professor-facing live metrics panel.

## Live Technical Panel

During gameplay, the top-right **Graphics Lab** panel shows:

- current FPS derived from frame delta time,
- fixed canvas raster resolution,
- active order state,
- Shannon entropy of the required ingredient distribution,
- compact recipe encoding,
- raw JSON length vs. packed recipe length.

This gives a direct demonstration of how rendering, interaction, and information representation connect inside the same application.

## How to Play

| Key | Action |
| --- | --- |
| `E`, `O`, `B`, `M`, `C`, `W`, `A`, `L`, `S` | Pour ingredients |
| `H` / `I` | Select hot or iced mode |
| `P` | Cycle pastry selection after unlocking the bakery case |
| `SPACE` | Serve the order |
| `T`, `DELETE`, `BACKSPACE` | Trash/reset the current cup |

## Local Development

```bash
npm install
npm run dev
```

Build for submission:

```bash
npm run build
```

## Short Presentation Script

"Frantic Barista demonstrates computer graphics through a real-time canvas game. The mathematical state of the drink is stored separately from rendering: the cup contains ingredient percentages, temperature, ripple values, and ice positions, while the renderer converts that state into pixels using curves, gradients, clipping, alpha blending, and particles. The game loop uses `requestAnimationFrame` and delta time so state updates and drawing remain independent. Orders become more complex procedurally as the level increases, and the Graphics Lab panel shows the information-theory side by calculating entropy and comparing verbose order data with a compact encoded recipe."
