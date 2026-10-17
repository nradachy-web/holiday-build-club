const fs = require('fs');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
(async () => {
  const manifest = JSON.parse(fs.readFileSync('capsules/onesies-round4/manifest.json'));
  fs.mkdirSync('site/assets/round12', { recursive: true });
  for (const entry of manifest.entries) {
    const input = 'capsules/onesies-round4/' + entry.id + '.png';
    if (!fs.existsSync(input)) throw Error('Missing image: ' + input);
    await sharp(input).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 85 }).toFile('site/assets/round12/' + entry.id + '.webp');
  }
  console.log(manifest.entries.length + ' Onesies Round 04 images optimized. Approved artwork untouched.');
})().catch(error => { console.error(error); process.exit(1); });
