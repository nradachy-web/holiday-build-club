import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=[];
for(const folder of ['sweats','tees','headwear','accessories','onesies']){
  const file=folder==='accessories'?'products.json':'manifest.json';
  const list=JSON.parse(await readFile(path.join(root,'capsules',folder,file),'utf8'));
  for(const d of list){
    const type=folder==='sweats'?(d.id.includes('plan')||d.id.includes('meetings')?'Hoodie':'Crewneck'):folder==='tees'?'Oversized tee':folder==='headwear'?(d.id.startsWith('beanie')?'Beanie':'Cap'):folder==='onesies'?'Adult lounge suit':({ 'wallet-tokens':'Faux-leather cardholder','deskmat-context':'Desk mat','mug-thinking':'Mug','tote-supervisor':'Tote','socks-offline':'Socks','patch-human':'Patch'}[d.id]);
    const category=({sweats:'Sweats',tees:'Tees',headwear:'Hats',accessories:'Accessories',onesies:'Onesies'})[folder];
    const capsule=/context|summary|lore|chaos|meetings|supervisor|human/.test(d.id)?'Context collapse':d.id==='onesie-one-more'?'Holiday build club':'Token panic';
    catalog.push({id:d.id,name:d.name,type,category,capsule,phrase:d.phrase,description:d.description,alt:d.alt,fan:false,image:`assets/prompt-dept/${d.id}.webp`,tags:capsule+' '+(d.phrase||'')});
  }
}
const rootList=JSON.parse(await readFile(path.join(root,'capsules/root-image-manifest.json'),'utf8'));
const descriptions={
  'santa-rate-limited':'Even Santa has a usage ceiling. Burgundy, bone and tiny acid-green meters, with one very tired gift-giver. A holiday knit concept for anyone rationing their last few prompts.',
  'context-christmas':'The gifts are here. The context is gone. An evergreen knit concept with an empty gift box and little memories floating out of it.',
  'naughty-compaction':'Good news: the entire naughty list disappeared in the summary. Bone, black and red with traditional reindeer bands and one suspiciously shredded document.',
  'clawd-timeout':'Clawd has been sent to think about what he did. The familiar pixel mascot gets a washed-black tee concept and a very familiar waiting period.',
  'clawd-christmas':'One token left. Obviously it went to Santa. A Clawd fan knit concept in warm orange, pine and bone.',
  'gpt-please':'You were polite. The button is still broken. A deadpan Codex fan tee concept with the OpenAI Blossom.',
  'codex-reset':'The moon is asleep, and so are you until the next reset. A midnight-blue Codex fan knit concept with the OpenAI Blossom.'
};
for(const d of rootList){const fan=d.category==='Fan concepts';catalog.push({id:d.id,name:d.name,type:['clawd-timeout','gpt-please'].includes(d.id)?'Oversized tee':'Holiday knit',category:fan?'Fan lab':'Holiday',capsule:fan?'Independent fan lab':'Holiday build club',phrase:d.phrase,description:descriptions[d.id],alt:d.name+' clothing concept featuring '+d.phrase.replaceAll(' / ',' '),fan,image:`assets/prompt-dept/${d.id}.webp`,tags:d.phrase+' holiday Christmas reset context'});}
catalog.push({id:'empty-meter-keychain',name:'Empty Meter Keychain',type:'Keychain study',category:'Accessories',capsule:'Token panic',phrase:'EMPTY METER / ASK ME AFTER RESET',description:'A native Blender construction study: dark enamel-style face, metal rim, a meter running on fumes and an Ask Me After Reset message. An editable accessory idea, not a manufactured sample.',alt:'Blender render of a black and silver keychain with an empty meter and Ask Me After Reset lettering',fan:false,native:true,image:'assets/prompt-dept/empty-meter-keychain.webp',tags:'Blender keychain token reset'});
const order=['approved-plan','change-button','onesie-reset','last-token','hat-after-reset','santa-rate-limited','summary-works','wallet-tokens','agent-meetings','context-lore','hat-out-of-tokens','deskmat-context','monthly-wait','onesie-context','naughty-compaction','approved-chaos','mug-thinking','beanie-thinking','tote-supervisor','onesie-one-more','context-christmas','socks-offline','patch-human','empty-meter-keychain','clawd-timeout','gpt-please','clawd-christmas','codex-reset'];
catalog.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
if(catalog.length!==28||new Set(catalog.map(d=>d.id)).size!==28)throw Error('Expected 28 distinct concepts');
const holiday=['claude-claus','codex-midnight','silent-deploy','claude-tokens','codex-naughty','vibe-snow','claude-alpine','codex-argyle','santa-debug','pair-programming'];
await writeFile(path.join(root,'site/catalog.js'),'const CATALOG = '+JSON.stringify(catalog,null,2)+';\nconst HOLIDAY_IDS = '+JSON.stringify(holiday)+';\n');
console.log('Catalog built: '+catalog.length+' designs');
