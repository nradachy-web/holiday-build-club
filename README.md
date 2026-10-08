# Prompt Dept.

Independent clothing concepts for the one-more-prompt crowd.

[Design prototype](https://nradachy-web.github.io/holiday-build-club/) | [Original holiday archive](https://nradachy-web.github.io/holiday-build-club/holiday.html)

## Collection

28 new product concepts: four sweats, four tees, three hats, seven accessories, three adult onesies, three original holiday knits and four fan concepts. The original ten holiday sweaters remain in the archive.

This repository contains 27 new AI product mockups, one AI editorial hero, a native Blender keychain render, six original outlined SVG artwork studies, the original holiday assets and the responsive static prototype.

Prompt Dept. is the selected working name, not a claim of trademark clearance. These are design concepts, not physically sampled or available products. No checkout, charge, reservation or automatic subscription exists. Fan concepts are independent and not affiliated with Anthropic or OpenAI; third-party marks are not commercially cleared. Adult lounge suits only.

## Run and verify

```sh
npm ci
npx playwright install chromium
npm run dev
```

The preview serves `site/` on port 4173. Stop it before the self-contained browser check:

```sh
npm test
```

For an existing deployment:

```sh
SITE_URL=https://nradachy-web.github.io/holiday-build-club/ npm run test:live
```

Optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. The current Mac has a detected fallback; otherwise Playwright uses its installed browser. Screenshots are written to ignored `qa/`.

Checks cover all 28 designs and category counts, search and empty state, favorite persistence, modal focus after saving, Escape, exact and legacy links, email draft contents, all product image decoding, 320/390/768 px layouts, and resource/browser errors. No email is sent.

## Design sources

- `capsules/`: original new PNGs and exact imagegen prompt/source manifests.
- `designs/`: the original ten holiday PNGs and their prompts.
- `brand/production/`: six outlined transparent SVG studies, proof gallery, generator and licensed font.
- `blender/prompt-dept-accessories.blend`: editable EMPTY METER keychain, 19 product objects, packed font, camera and lighting.
- `blender/prompt-dept-accessories.py`: reproducible background-only Blender 5.1.1 source.
- `blender/prompt-dept-accessories.png`: actual CPU Cycles render, visually inspected.
- `blender/holiday-build-club.blend`: original ten simplified sweater construction studies and modeled yarn scene.
- `site/`: static design prototype and archive.

The generated garments illustrate art direction. They do not establish actual fabric, construction, fit, print finish or supplier capability. The separate Blender and vector studies are editable explorations, not exact reconstructions or factory-ready tech packs. Supplier templates, stitch charts, separations, embroidery digitization, grading, labels and physical samples remain production work.

## Rebuild artwork

```sh
python3 brand/production/build_artwork.py
blender --background --factory-startup --threads 4 --python blender/prompt-dept-accessories.py
node scripts/build-catalog.mjs
```

Image generation used the built-in imagegen tool, one call per asset. Selected files were copied into this project; original generated files were retained. A targeted edit removed the rejected working name from one tee.

Optional image optimization uses `scripts/optimize-images.cjs` and Sharp. Set `SHARP_MODULE` to an installed Sharp module or install it locally. The committed assets require no build.

## Data and publishing

Favorites use localStorage. Feedback remains in the page until the visitor chooses to send an email. The mailto button only opens a draft to Nick at Modern Apex. No analytics or advertising pixels are installed. Fonts and their licenses are served locally.

GitHub Actions publishes only `site/`. This is a design-research prototype; the commercial launch and checkout belong on appropriate commercial hosting.

Twenty specialist lanes contributed to the project. Internal supplier research, financial assumptions, business reviews and the complete launch notebook are kept in ignored local `business/` and `research/` directories, outside public publication. The local standalone plan is `business/launch.html`; it includes its own calculator data. Those private files are not present in a public clone.
