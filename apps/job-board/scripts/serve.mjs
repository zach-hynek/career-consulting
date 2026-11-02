import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');const port=Number(process.env.PORT||4180);
createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;if(!['/','/index.html','/job-board.html'].includes(name)){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(resolve(root,name==='/'?'index.html':name.slice(1))));}catch{res.writeHead(500).end('Run npm run build first.');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
