const fs=require('fs');
const sharp=require(process.env.SHARP_MODULE || 'sharp');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('capsules/round3/manifest.json'));
 const revisions=JSON.parse(fs.readFileSync('capsules/round3/revisions.json')).entries;
 let count=0;
 for(const e of manifest.entries){
  const rev=revisions.find(r=>r.id===e.id);
  const revised=rev&&fs.existsSync('capsules/round3/'+rev.filename);
  const input='capsules/round3/'+(revised?rev.filename:e.id+'.png');
  if(!fs.existsSync(input))continue;
  await sharp(input).resize({width:1000,withoutEnlargement:true}).webp({quality:85}).toFile('site/assets/round3/'+e.id+'.webp');count++;
 }
 await sharp('brand/identity/round3/prompt-dept-logo.png').resize({width:1600,withoutEnlargement:true}).webp({quality:92}).toFile('site/assets/round3/prompt-dept-logo.webp');
 fs.copyFileSync('brand/identity/round3/prompt-dept-logo.png','site/assets/round3/prompt-dept-logo.png');
 console.log(count+' product assets optimized. Logo copied.');
})().catch(e=>{console.error(e);process.exit(1)});
