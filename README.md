# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://nradachy-web.github.io/holiday-build-club/)

## Round 04

**60 current designs: 30 selected keepers, unchanged, plus 30 new ideas.** All 38 rejected concepts from earlier rounds have been removed from the published site. Their original files and review history remain in the repository outside the Pages folder.

The new round focuses on relatable AI coding satire: false fixes, confident mistakes, forgotten context, endless follow-ups and agents that need adult supervision. Seven tees, four hoodies, two crewnecks, four caps, six holiday knits, two socks, two desk mats, a mug, a tote and an adult onesie extend the selected styles. The owner-approved tired cursor mascot remains the brand identity, with new character scenes on eight products.

Hearts are keepers. The gallery opens on the new 30, with separate views for all current designs, the 30 carried forward, favorites and the review queue. Favorites from both legacy storage keys retain their IDs. Removed IDs remain in storage for compatibility but do not resurrect rejected artwork or enter the current review brief. Preferences remain in this browser and are not automatically synced or sent anywhere.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion and required assets.

The browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://nradachy-web.github.io/holiday-build-club/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/round4/`: 30 full-resolution generated mockups, exact prompts and provenance.
- `site/keepers.js`: the 30 stable keeper records and legacy holiday IDs.
- `site/round4.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one call per asset. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round4.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. The onesies are adult lounge suits only.

## Publishing and business files

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Fan concepts using third-party marks are independent, unaffiliated and not commercially cleared. The new 30 designs use original characters and jokes.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/round4-sourcebook.html`; the plan is `business/launch.html`.

No physical samples, supplier orders or commercial checkout have been created.
