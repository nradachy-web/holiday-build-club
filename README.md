# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://promptdept.store/)

## Onesies Round 01

**114 current designs: 84 approved keepers, unchanged, plus 30 new adult onesies.** The 17 unselected Round 08 concepts have left the public site. Across all rounds, 134 rejected designs remain recoverable outside the Pages folder.

Nick selected 13 Round 08 designs, bringing the confirmed keeper set to 84. This round focuses entirely on adult one-piece lounge suits: upholstery camouflage, clashing patchwork, snack repeats, architectural prints, literal house clothes and illustrated social or coding complications. Three earlier onesies remain, giving 33 adult onesies across the current catalog. The approved tired cursor mascot and every keeper record/image remain unchanged.

The gallery opens on the new 30. Personal hearts stay local and can be moved with the existing explicit transfer links. Earlier design approvals now live separately from browser hearts: the copied brief lists PREVIOUSLY APPROVED, then KEEP and REPLACE for only the new round. A phone missing old hearts cannot silently revoke an earlier approval. An empty browser still has zero personal hearts. Review next shows only new unhearted ideas; saved picks remain personal.

“Copy a transfer link” creates a snapshot containing only selected current design IDs in the URL fragment. Opening it previews the designs, then “Add these keepers” merges them with existing hearts without clearing newer picks. Cancel changes nothing. No automatic cross-device sync or globally seeded owner shortlist exists.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion, required assets, malformed transfer links, deduplication and non-destructive cross-device merges.

Onesies Round 01 was checked in the connected Chrome browser through CUA at 320, 390, 768 and 1440 pixels, including import preview, explicit merge, persistence, older-link reuse, filter counts, empty search recovery and modal focus. The 38 Node state tests passed.

The optional browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://promptdept.store/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/onesies-round1/`: 30 full-resolution generated mockups, exact prompts and provenance.
- `site/keepers.js`: the 84 stable keeper records and legacy holiday IDs.
- `site/round9.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/`, `archive/site-round4/`, `archive/site-round5/`, `archive/site-round6/`, `archive/site-round7/`, `archive/site-round8/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `capsules/round4/`, `capsules/round5/`, `capsules/round6/`, `capsules/round7/`, `capsules/round8/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one initial call per asset, plus five targeted corrections for wrist/ankle construction and lettering placement. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round9.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. New onesie mockups use a verified adult allover-print garment route with printed self-fabric wrist hems and gathered ankle openings. The private sourcebook records template, material, landed-cost and sample gaps; rendered quality is not a physical sample approval. The onesies are adult lounge suits only.

## Publishing and business files

The custom domain is `promptdept.store`, with `www.promptdept.store` redirecting to it. GitHub Pages stores the custom domain in repository settings because this site deploys through Actions. Namecheap uses the four GitHub Pages apex A records and a `www` CNAME to `nradachy-web.github.io`.

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Fan concepts using third-party marks are independent, unaffiliated and not commercially cleared. The new 30 designs use original characters and jokes.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/onesies-round1-sourcebook.html`; the plan is `business/launch.html`.

No physical samples, supplier orders or commercial checkout have been created.
