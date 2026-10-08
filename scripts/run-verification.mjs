import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('site');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ttf':'font/ttf','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{try{const parsed=new URL(req.url,'http://127.0.0.1');let file=path.resolve(root,'.'+decodeURIComponent(parsed.pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error('Invalid path');if(file===root||parsed.pathname.endsWith('/'))file=path.join(file,'index.html');const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(4173,'127.0.0.1',resolve);});
try{await import('./verify-brand.mjs');}finally{await new Promise(resolve=>server.close(resolve));}
