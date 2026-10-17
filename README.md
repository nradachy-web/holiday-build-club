# Prompt Dept.

Clothing concepts for the one-more-prompt crowd.

[Live collection](https://promptdept.store/)

## Onesies Round 04

**139 current designs: all 114 earlier designs approved and unchanged, plus 25 new adult onesies.** Every one of the 25 Onesies Round 03 concepts is now a keeper. No designs retired this round. The 188 earlier rejected designs remain recoverable outside the Pages folder.

This round adds eight Claude concepts, eight ChatGPT concepts, four Codex concepts, three model rivalry concepts and two originals. The catalog now contains 58 adult onesies. The approved tired cursor mascot and every keeper record/image remain unchanged.

The gallery opens on the new 25. Personal hearts stay local and can be moved with the existing explicit transfer links. Earlier design approvals live separately from browser hearts: the copied brief lists PREVIOUSLY APPROVED, then KEEP and REPLACE for only the new round. A phone missing old hearts cannot silently revoke an earlier approval. An empty browser still has zero personal hearts. Review next shows only new unhearted ideas; saved picks remain personal.

“Copy a transfer link” creates a snapshot containing only selected current design IDs in the URL fragment. Opening it previews the designs, then “Add these keepers” merges them with existing hearts without clearing newer picks. Cancel changes nothing. No automatic cross-device sync or globally seeded owner shortlist exists.

## Run and verify

```sh
npm ci
npm run dev
npm run test:review
```

The preview serves `site/` on port 4173. State tests cover legacy storage migration, malformed data, blocked storage, keeper preservation, exact review partitioning, retired design exclusion, required assets, malformed transfer links, deduplication and non-destructive cross-device merges.

All 47 state tests pass. All 148 local pages, scripts and catalog images returned HTTP 200. Connected Chrome checks through CUA passed save/reload/remove, review partitioning, category filters, empty search recovery and modal Escape/focus. Layouts at 320, 390, 768 and 1440 pixels had no horizontal overflow or hero text overflow. SHA-256 comparisons confirm that all 114 approved product images and the logo are byte-for-byte unchanged.

Round 04 verification covers exact preservation of 114 records, promotion of all 25 prior new designs, 25 new concepts, round-scoped briefs and older phone transfers that cannot erase newer hearts. The standalone Playwright script is maintained separately from connected Chrome verification through CUA.

The optional browser regression script is `scripts/verify-brand.mjs`. With Playwright Chromium installed, `npm test` starts a temporary preview and runs it. `SITE_URL=https://promptdept.store/ npm run test:live` checks a deployed version. Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing browser. Screenshots go to ignored `qa/`.

## Current artwork and identity

- `capsules/onesies-round4/`: 25 full-resolution mockups, exact prompts and provenance.
- `capsules/onesies-round3/`: prior originals and reference-matched Clawd edits, unchanged.
- `site/keepers.js`: the 114 stable keeper records and legacy holiday IDs.
- `site/round12.js`: the new collection and current catalog.
- `brand/identity/round3/prompt-dept-logo.png`: approved transparent raster mascot master.
- `site/identity.html`: approved logo presentation and selected product applications.
- `archive/site-round3/`, `archive/site-round4/`, `archive/site-round5/`, `archive/site-round6/`, `archive/site-round7/`, `archive/site-round8/`, `archive/site-round9/`, `archive/site-round10/`, `archive/site-round11/`: removed public artwork, prior catalog data and legacy page sources.
- `capsules/round3/`, `capsules/round4/`, `capsules/round5/`, `capsules/round6/`, `capsules/round7/`, `capsules/round8/`, `capsules/onesies-round1/`, `capsules/onesies-round2/`, `designs/`: previous original image generations and their manifests.
- `brand/production/`, `blender/`: earlier editable vector and native Blender construction studies.

Image generation uses the built-in imagegen tool, one initial call per asset, with targeted corrections recorded in the provenance file. The original generated files are retained. To optimize the new images, install Sharp or set `SHARP_MODULE` to an installed copy, then run `node scripts/prepare-round12.cjs`. This leaves all keeper assets and the logo untouched. Committed site assets need no build. Earlier generation scripts are historical and should not be run to rebuild the current catalog.

These are digital design mockups, not actual product photographs or factory-ready artwork. The exact prints, embroidery digitization, knit charts, colors, fits, labels and physical samples still need production work. New onesie concepts use adult hooded footless silhouettes. Cuffs, lining, pockets, fabric and print placement must be adapted to a selected supplier template. No single supplier is confirmed to reproduce every rendered construction detail. The private sourcebook records template, material, landed-cost and sample gaps; rendered quality is not a physical sample approval. The onesies are adult lounge suits only.

## Publishing and business files

The custom domain is `promptdept.store`, with `www.promptdept.store` redirecting to it. GitHub Pages stores the custom domain in repository settings because this site deploys through Actions. Namecheap uses the four GitHub Pages apex A records and a `www` CNAME to `nradachy-web.github.io`.

GitHub Actions publishes only `site/`. No checkout, charge, reservation, analytics, advertising pixels or automatic subscription exists. The shortlist button opens an email draft; it does not send anything. Fonts and licenses are served locally. A commercial store needs appropriate commercial hosting and fulfillment setup.

Prompt Dept. is the selected working name, not a claim of trademark clearance. Of the new 25 designs, 23 are independent, unaffiliated fan concepts and two use original copy and graphics. Model marks use faithful references, with no invented substitute logos for supposed legal protection. Parody and other defenses depend on the specific use; vendor brand policies are not a legal ruling. No license or legal clearance is claimed.

Twenty specialist lanes contributed to this project. Private supplier research, financial assumptions, business reviews and the launch notebook remain in ignored `business/` and `research/` directories. They are not published or available in a public clone. The current local sourcebook is `business/onesies-round4-sourcebook.html`; the launch notebook is `business/launch.html`. The private manufacturing desk at `business/manufacturing.html` compares inventory and made-per-order suboptions, supplier evidence, sample/QC workflows, unit economics, cash timing, channel gates and unsent RFQs. Contrado remains a premium sample benchmark alongside the $79 to $99 retail target. Cost inputs are illustrative, not quotes or approved orders.

No physical samples, supplier orders or commercial checkout have been created.
