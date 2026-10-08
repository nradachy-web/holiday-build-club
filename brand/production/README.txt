PROMPT DEPT
ORIGINAL ARTWORK MASTERS / CONSTRUCTION STUDIES 01-06

These six files are editable SVG originals. Every visible letter is an
outlined Barlow Condensed glyph. Each word group and the original broken
three-bar meter can be selected, recolored or rescaled in vector software.
The artboards are transparent. The local index.html adds an ink-colored
preview surface, which is not baked into the SVG artwork.

Master files
01-change-a-button.svg
02-not-this.svg
03-in-the-summary.svg
04-last-token.svg
05-after-reset.svg
06-all-my-money.svg

Artwork setup
Artboard: 12 x 14 inches, viewBox 0 0 1200 1400.
The physical artboard size is a starting point for print placement.
Ink preview surface: #151613.
Bone artwork: #EEEAE0.
Acid artwork: #D5FF45.
No raster images, external image references or live text are required to
display the six masters. There are no vendor logos.

Editable source
build_artwork.py rebuilds the six masters and local proof page.
The source contains the actual phrases and all layout choices, so wording
can also be changed before generating new outlines.
Default font: site/assets/font-2.ttf, Barlow Condensed 800.
FontTools is used when available. A dependency-free static TrueType
quadratic-outline reader supports the same source when it is unavailable.
The original font license is copied into fonts/ alongside the Blender TTF.
The source font is licensed separately under its bundled OFL file.

Review
Open index.html to inspect all six masters on the intended dark ground.
manifest.json records the source font, palette and file hashes.

Production boundary
These are construction studies, not factory tech packs. Final artwork
size, underbase, ink matching, garment choice, traps, registration,
embroidery conversion and print method need supplier proofing and physical
samples. The accessory model is a visual construction study with separate
editable geometry; it does not establish manufacturing tolerances.
These originals were constructed independently. They do not claim to
match generated lifestyle or product mockups.

Related Blender study
../../blender/prompt-dept-accessories.py
../../blender/prompt-dept-accessories.blend
../../blender/prompt-dept-accessories.png

The Blender script must run in its own background process and refuses to
modify an interactive open scene. It saves its .blend before rendering.
