const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
async function main() {
  const root = path.resolve(__dirname,'..');
  const target = path.join(root,'site/assets/prompt-dept');
  await fs.mkdir(target,{recursive:true});
  for (const folder of ['root','sweats','tees','headwear','accessories','onesies','editorial']) {
    const dir = path.join(root,'capsules',folder);
    let files;
    try { files = await fs.readdir(dir); } catch { continue; }
    for (const file of files.filter(f=>f.endsWith('.png'))) {
      const dest = path.join(target,file.replace('.png','.webp'));
      await sharp(path.join(dir,file)).resize({width:file==='hero.png'?1122:900}).webp({quality:84}).toFile(dest);
      console.log(path.basename(dest));
    }
  }
  await sharp(path.join(root,'capsules/editorial/hero.png')).resize(1200,630,{fit:'cover',position:'centre'}).jpeg({quality:88}).toFile(path.join(target,'social.jpg'));
}
main().catch(e=>{console.error(e);process.exit(1);});
