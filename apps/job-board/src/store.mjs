import {freshState,validateBackup} from './model.mjs';
let db; let queue=Promise.resolve();
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
function write(value){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(value,'state');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage unavailable'));});}
export async function openStore(){
 try{const req=indexedDB.open('career-job-board',1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');db=await request(req);db.onversionchange=()=>db.close();const saved=await request(db.transaction('workspace').objectStore('workspace').get('state'));let state=freshState();let recovered=false;
 if(saved){try{state={...validateBackup(saved),cache:saved.cache||null};}catch{recovered=true;}}
 // Do not overwrite a corrupt backup during storage probing.
 if(!recovered)await write(state);return {state,persistent:!recovered,warning:recovered?'Saved data could not be read. Export this session; the original stored copy has been preserved.':''};
 }catch{return {state:freshState(),persistent:false,warning:'Browser storage is unavailable. Changes last for this session only. Export a backup or open the full board.'};}
}
export function saveStore(state){const snapshot=structuredClone(state);queue=queue.catch(()=>{}).then(()=>{if(!db)throw new Error('Storage unavailable');return write(snapshot);});return queue;}
