# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://nradachy-web.github.io/holiday-build-club/)

## Round 05

**66 current designs: 36 selected keepers, unchanged, plus 30 new ideas.** The 24 unhearted Round 04 concepts have left the public site. Across all rounds, 62 rejected concepts now remain recoverable outside the Pages folder.

This round puts the human in the joke: Works on My Screenshot, I Cause Code, CEO of Clicking Yes, Skill Issue Billed Monthly, and Paid Extra to Wait Faster. Eight tees, four hoodies, two crewnecks, four caps, six holiday knits, two desk mats, socks, a mug, a tote and an adult onesie extend the selected styles. The approved tired cursor mascot remains unchanged.

The gallery opens on the new 30. Current, carried-forward, keeper and review filters preserve the selection workflow. Hearts from both legacy storage keys retain their IDs. Removed IDs stay compatible with storage but do not resurrect rejected designs or enter the current review brief. Preferences remain local to the browser.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion and required assets.

The browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://nradachy-web.github.io/holiday-build-club/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/round5/`: 30 full-resolution generated mockups, exact prompts and provenance.
- `site/keepers.js`: the 36 stable keeper records and legacy holiday IDs.
- `site/round5.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/ and archive/site-round4/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `capsules/round4/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one call per asset. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round5.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. The onesies are adult lounge suits only.

## Publishing and business files

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Fan concepts using third-party marks are independent, unaffiliated and not commercially cleared. The new 30 designs use original characters and jokes.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/round5-sourcebook.html`; the plan is `business/launch.html`.

No physical samples, supplier orders or commercial checkout have been created.
