# Stagecoach loader

The S opening animation as a drop-in, so it can sit on the Lovable site without changing anything else there.
Navy screen, then: name, point, single ring, the S draws itself, name settles. About 3.4 seconds. Any tap, key or scroll skips it. Plays once per browser session. Hidden for people who turn on "reduce motion".

## Lovable (React + Vite): the clean way
1. Copy `stagecoach-loader.css` and `StagecoachLoader.tsx` into `src/components/`.
2. In your root layout (`src/routes/__root.tsx`), add `import StagecoachLoader from "../components/StagecoachLoader"` and put `<StagecoachLoader />` as the first thing inside the layout.
3. Montserrat is already loaded on the site, so nothing else is needed.

Nothing else on the site is touched. Remove the one line in `__root.tsx` to turn it off.

## Any other site: plain HTML
1. Add `stagecoach-loader.css` to the page.
2. Paste the `<div class="sc-loader">…</div>` from `stagecoach-loader.html` right after `<body>`.
3. Add `<script src="stagecoach-loader.js"></script>` before `</body>`.

Open `demo.html` to see it run.

## Tuning
- Length: change the four `3.2s` values in the CSS and the `3400` in the script together.
- Colours: `#10192B` background, `#F4F1E9` cream, `#E37970` coral point.
- To play on every visit instead of once per session, delete the two `sessionStorage` lines.
