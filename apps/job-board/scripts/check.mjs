import {spawnSync} from 'node:child_process';
import {readdir,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const folder of ['src','scripts'])for(const file of await readdir(resolve(root,folder))){if(!file.endsWith('.mjs'))continue;const r=spawnSync(process.execPath,['--check',resolve(root,folder,file)],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);}
JSON.parse(await readFile(resolve(root,'public/config.json'),'utf8'));console.log('JavaScript syntax and public configuration are valid.');
