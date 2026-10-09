# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://promptdept.store/)

## Round 08

**101 current designs: 71 selected keepers, unchanged, plus 30 new ideas.** The 15 unhearted Round 07 concepts have left the public site. Across all rounds, 117 rejected concepts remain recoverable outside the Pages folder.

Round 07 gained 15 keepers. Round 08 develops specific situations and visual punchlines: a yes-or-no question becomes an agent committee; past-you wrote “obviously” in unreadable notes; a simple dropdown receives a formal appeal. Fourteen tees, seven hoodies, four caps, two holiday knits, a mug, a tote and an adult onesie extend the collection. The approved tired cursor mascot remains unchanged. These are individual jokes voiced by the wearer, not claims about everyone's neurodivergent experience.

The gallery opens on the new 30. Current, carried-forward, keeper and review filters preserve the selection workflow. Hearts from both legacy storage keys retain their IDs. Removed IDs stay compatible with storage but do not resurrect rejected designs or enter the current review brief. Preferences remain local to the browser.

“Copy a transfer link” creates a snapshot containing only selected current design IDs in the URL fragment. Opening it previews the included designs. “Add these keepers” explicitly merges them with the receiving device's existing hearts; it never clears newer picks. Cancel makes no changes. No automatic cross-device sync or universal owner shortlist is created. The 15 phone selections were merged with the 56 previously confirmed keepers before this round.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion, required assets, malformed transfer links, deduplication and non-destructive cross-device merges.

Round 08 was checked in the connected Chrome browser through CUA at 320, 390, 768 and 1440 pixels, including import preview, explicit merge, persistence, older-link reuse, filter counts, empty search recovery and modal focus. The 25 Node state tests passed.

The optional browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://promptdept.store/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/round8/`: 30 full-resolution generated mockups, exact prompts and provenance.
- `site/keepers.js`: the 71 stable keeper records and legacy holiday IDs.
- `site/round8.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/`, `archive/site-round4/`, `archive/site-round5/`, `archive/site-round6/`, `archive/site-round7/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `capsules/round4/`, `capsules/round5/`, `capsules/round6/`, `capsules/round7/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one initial call per asset, plus a recorded solid-color cap correction. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round8.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. The onesies are adult lounge suits only.

## Publishing and business files

The custom domain is `promptdept.store`, with `www.promptdept.store` redirecting to it. GitHub Pages stores the custom domain in repository settings because this site deploys through Actions. Namecheap uses the four GitHub Pages apex A records and a `www` CNAME to `nradachy-web.github.io`.

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Fan concepts using third-party marks are independent, unaffiliated and not commercially cleared. The new 30 designs use original characters and jokes.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/round8-sourcebook.html`; the plan is `business/launch.html`.

No physical samples, supplier orders or commercial checkout have been created.
