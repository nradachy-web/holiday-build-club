const fs=require('fs');
const sharp=require(process.env.SHARP_MODULE || 'sharp');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('capsules/round8/manifest.json'));
 fs.mkdirSync('site/assets/round8',{recursive:true});
 for(const entry of manifest.entries){
  const input='capsules/round8/'+entry.id+'.png';
  if(!fs.existsSync(input))throw Error('Missing original: '+input);
  await sharp(input).resize({width:1000,withoutEnlargement:true}).webp({quality:85}).toFile('site/assets/round8/'+entry.id+'.webp');
 }
 console.log(manifest.entries.length+' Round 08 assets optimized. Keeper assets and approved logo untouched.');
})().catch(error=>{console.error(error);process.exit(1)});
