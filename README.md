# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://promptdept.store/)

## Round 07

**86 current designs: 56 selected keepers, unchanged, plus 30 new ideas.** The 14 unhearted Round 06 concepts have left the public site. Across all rounds, 102 rejected concepts now remain recoverable outside the Pages folder.

Round 06 gained 16 keepers. Round 07 builds on the selected specific situations and dry contradictions: Forgot the Password. Rebuilt the Website; I Replied in My Head. Check There; and I Rehearsed This. Stick to Your Lines. Graphic-led pieces let the illustration deliver the joke. Twelve tees, five hoodies, three crewnecks, four caps, three holiday knits, two mugs and an adult onesie extend the collection. The approved tired cursor mascot remains unchanged. The humor is voiced by the wearer, not a claim about everyone's neurodivergent experience.

The gallery opens on the new 30. Current, carried-forward, keeper and review filters preserve the selection workflow. Hearts from both legacy storage keys retain their IDs. Removed IDs stay compatible with storage but do not resurrect rejected designs or enter the current review brief. Preferences remain local to the browser.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion and required assets.

The browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://promptdept.store/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/round7/`: 30 full-resolution generated mockups, exact prompts and provenance.
- `site/keepers.js`: the 56 stable keeper records and legacy holiday IDs.
- `site/round7.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/`, `archive/site-round4/`, `archive/site-round5/`, `archive/site-round6/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `capsules/round4/`, `capsules/round5/`, `capsules/round6/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one call per asset. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round7.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. The onesies are adult lounge suits only.

## Publishing and business files

The custom domain is `promptdept.store`, with `www.promptdept.store` redirecting to it. GitHub Pages stores the custom domain in repository settings because this site deploys through Actions. Namecheap uses the four GitHub Pages apex A records and a `www` CNAME to `nradachy-web.github.io`.

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Fan concepts using third-party marks are independent, unaffiliated and not commercially cleared. The new 30 designs use original characters and jokes.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/round7-sourcebook.html`; the plan is `business/launch.html`.

No physical samples, supplier orders or commercial checkout have been created.
