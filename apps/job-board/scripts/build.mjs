import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {build} from 'esbuild';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
let config=JSON.parse(await readFile(resolve(root,'public/config.json'),'utf8'));try{config={...config,...JSON.parse(await readFile(resolve(root,'public/config.local.json'),'utf8'))};}catch(error){if(error.code!=='ENOENT')throw error;}
for(const key of Object.keys(config))if(!['schemaVersion','catalogUrl','apiUrl','siteUrl','curationStatus'].includes(key))throw new Error(`Unrecognized public config key: ${key}. Never put credentials in the frontend.`);
for(const k of ['catalogUrl','apiUrl','siteUrl'])if(config[k]){const u=new URL(config[k]);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error(`Invalid ${k}`);}
const bundle=await build({entryPoints:[resolve(root,'src/app.mjs')],bundle:true,write:false,format:'esm',target:'es2022',minify:true,legalComments:'none'});
let html=await readFile(resolve(root,'src/index.html'),'utf8');const styles=await readFile(resolve(root,'src/styles.css'),'utf8');html=html.replace('/* APP_STYLES */',()=>styles).replace('/* APP_CONFIG */',()=>JSON.stringify(config).replace(/</g,'\\u003c')).replace('<script>/* APP_CODE */</script>',()=>`<script type="module">${bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
await mkdir(resolve(root,'dist'),{recursive:true});for(const name of ['index.html','job-board.html'])await writeFile(resolve(root,'dist',name),html);
await copyFile(resolve(root,'public/_headers'),resolve(root,'dist/_headers'));
console.log(`Built dist/index.html and dist/job-board.html (${Math.round(Buffer.byteLength(html)/1024)} KB each). Personal records are never bundled.`);
