# Holiday Build Club

Ten independent Christmas knitwear concepts for Claude Code fans, Codex fans, and the wider coding community. Static responsive collection page, editable Blender construction studies, and original image-generation outputs.

[Live collection](https://nradachy-web.github.io/holiday-build-club/)

The site is a concept preview. It does not accept orders, charge customers, reserve stock, or claim that digital renders are manufactured products. Branded designs are not affiliated with Anthropic or OpenAI and need rights clearance before commercial release.

## Run locally

```sh
npm run dev
```

Open the local address printed by the server. The static files are in `site/`; there is no build step, server API, tracking pixel, or external font request.

## Verify

```sh
npm ci
npx playwright install chromium
npm test
```

The test uses the running local server by default. Set `SITE_URL` for a published page. Optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium executable. Screenshots are saved in ignored `qa/`.

Checks cover the ten concepts, category filters, local favorite persistence, design dialogs, Escape, exact design links, email draft contents, size preferences, narrow mobile layouts, and resource errors. The email draft is inspected without sending it.

## Design sources

- `designs/`: ten full-resolution AI concept mockups, the art direction, exact generation prompts, and launch recommendations.
- `blender/holiday-build-club.blend`: ten editable geometry and material studies plus a separate physical-yarn scene. Textures are packed into the file.
- `blender/make_textures.py`: original four-color pattern studies.
- `blender/build_collection.py`: reproducible Blender 5.1 source and Cycles render setup.
- `site/assets/yarn-macro.webp`: a real Blender render of modeled yarn curves.

The AI product mockups and simplified Blender construction studies are separate explorations. The Blender studies are not exact 3D reconstructions of the AI mockups or production knitting patterns. Factory stitch charts, gauge, seam construction, final yarn colors, tech packs, grading, and physical samples remain to be developed. Some generated mockups include more colors than the four-color production target.

Image prompts are preserved in `designs/image-manifest.json`. Product images were generated with the built-in image_gen tool and copied into this repository. Web versions are optimized WebP files; originals are preserved.

## Interaction and data

Favorites use localStorage in the visitor's own browser. No preference is sent to a server. The interest link opens a prefilled email to Nick at Modern Apex, with the chosen designs and optional size. The visitor must send it. Direct email is visible for visitors without a configured mail app.

## Deployment

GitHub Actions deploys only `site/` to GitHub Pages on changes to that directory. The source repository also includes the design assets and Blender source. Font licenses are included beside the locally served fonts.
