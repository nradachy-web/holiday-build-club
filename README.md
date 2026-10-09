# Prompt Dept.

Independent clothing concepts for the one-more-prompt crowd.

[Design prototype](https://nradachy-web.github.io/holiday-build-club/) | [Original holiday archive](https://nradachy-web.github.io/holiday-build-club/holiday.html)

## Collection

Round 03 has **48 active concepts: 30 new designs and 18 carried forward unchanged**. The new range includes six tees, three hoodies, two crewnecks, three caps, five holiday knits, two socks, two desk mats, a woven blanket, a laptop sleeve, a tote, a mug, a phone case, a zip wallet and one adult onesie. Twenty earlier unselected ideas remain recoverable through the Earlier round filter and their exact links.

A new original cursor mascot and illustrated clothing direction replace the rejected PD monogram. The main gallery opens on the new 30, with separate views for all current pieces, the 18 carried forward, favorites and the archive. Existing saved IDs survive across both storage keys; archived saved pieces remain available and included in the review brief.

The repository retains full-resolution generated PNGs, exact prompts, three revised concepts, optimized site assets, the transparent logo concept master and earlier Blender/vector studies.

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

Checks cover the 48 active designs, 20 archived ideas and category counts, search and empty state, favorite persistence, modal focus after saving, Escape, exact and legacy links, email draft contents, all product image decoding, 320/390/768 px layouts, and resource/browser errors. No email is sent.

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

## Keeper review and ASCII identity

Hearts are keepers. Unsaved designs are the replacement queue. Existing favorites from both prior collections are read without changing their IDs. The review has Keep these / Replace these filters, a copyable exact-ID brief and a JSON download. Preferences stay in local browser storage, sync between open tabs on the same origin, and are not automatically sent or shared across devices. Replacements are developed after the user shares their completed choices; the static site does not run background image generation or overwrite any design.

`npm run test:review` checks migration, malformed data, blocked-storage fallback, complete keep/replace partitioning and brief contents. Browser regression coverage lives in `scripts/verify-brand.mjs`.

The new identity is at `site/identity.html`: an original stepped PD cursor monogram, compact outlined wordmarks and a dimensional ASCII edition. Transparent SVG masters are in `site/assets/identity/`, with ink and bone variants. Rebuild with `python3 brand/identity/build_identity.py`. The canvas renderer animates only while visible, with a reduced-motion still frame and static SVG fallback. Use the solid mark for small labels and embroidery; proof physical production separately.

## Round 03 assets and verification

- `capsules/round3/manifest.json`: the 30 exact built-in imagegen prompts.
- `capsules/round3/revisions.json`: refined courier, agreeable-robot cap and adult onesie directions.
- `capsules/round3/provenance.json`: original and revised generated-file references.
- `brand/identity/round3/prompt-dept-logo.png`: transparent raster concept master. Vector cleanup and production simplification remain.
- `site/round3.js`: current collection, stable carryover IDs and retained archive.
- `business/round3-sourcebook.html`: private local visual supplier map for all 48 current designs, linked to official product pages and the detailed evidence reports. This file is intentionally excluded from public publication.

This pass used six passing state/migration tests, desktop and mobile browser checks through CUA, visual inspection of all 30 new renders, and hash verification that all 18 keeper images were unchanged. No samples, supplier orders or commercial checkout were created.

To regenerate optimized Round 03 assets, install Sharp or set `SHARP_MODULE`, then run `node scripts/prepare-round3.cjs`.
