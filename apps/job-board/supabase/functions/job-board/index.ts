import {admin,checked} from '../_shared/db.ts';
import {json,corsHeaders,publicURL,approvedPath,boundedFetch} from '../_shared/security.ts';
import {recognizeATS,extractATS,extractStructuredHTML} from '../_shared/adapters.ts';
async function digest(value:string){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(data)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const fallback=(url:string,message='Save the link and paste the job details.')=>({status:'manual_required',fields:{url},message});
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});
 const path=new URL(request.url).pathname.split('/job-board')[1]||'/';
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 try{const db=admin();
  if(request.method==='GET'&&/^\/jobs\/[a-f0-9-]{36}$/.test(path)){
   const id=path.split('/')[2];const job=checked(await db.from('jb_jobs').select('id,company_id,description,last_verified_at,closed').eq('id',id).maybeSingle());if(!job)return json({error:'Not found'},404);
   const company=checked(await db.from('jb_companies').select('approved,enabled,reuse_reviewed_at').eq('id',job.company_id).single());if(!company.approved||!company.enabled||!company.reuse_reviewed_at)return json({error:'Not found'},404);
   return json({id:job.id,description:job.description,lastVerifiedAt:job.last_verified_at,closed:job.closed},200,'public, max-age=3600');
  }
  if(request.method!=='POST'||path!=='/extract')return json({error:'Not found'},404);
  if(Number(request.headers.get('content-length'))>4096)return json({error:'Request too large'},413);
  // Stream the body with a hard cap; content-length can be absent or untrusted.
  const reader=request.body?.getReader();if(!reader)return json({error:'Missing body'},400);let body='',bytes=0;const decoder=new TextDecoder();try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>4096)return json({error:'Request too large'},413);body+=decoder.decode(value,{stream:true});}}finally{await reader.cancel().catch(()=>{});}body+=decoder.decode();
  let input:any;try{input=JSON.parse(body);}catch{return json({error:'Invalid JSON'},400);}
  let url:URL;try{url=publicURL(input.url);}catch{return json(fallback(typeof input.url==='string'?input.url.slice(0,2048):'','Automatic extraction accepts public HTTPS pages only.'))}
  const settings=checked(await db.from('jb_settings').select('enabled,extraction_daily_limit').eq('id',true).single());if(!settings.enabled)return json(fallback(url.href,'Automatic extraction is currently paused.'));
  const now=new Date(),day=now.toISOString().slice(0,10),hour=now.toISOString().slice(0,13);
  if(!checked(await db.rpc('jb_take_budget',{p_scope:`extract:${day}`,p_limit:settings.extraction_daily_limit,p_expires:new Date(Date.now()+2*86400000).toISOString()})))return json(fallback(url.href,'Daily import limit reached. Paste the details to continue.'),429);
  // Coarse per-client throttling supplements the authoritative global budget. Never retain raw IP addresses.
  const client=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const clientHash=await digest(`${Deno.env.get('JOB_BOARD_RATE_SALT')||'job-board'}:${day}:${client}`);
  if(!checked(await db.rpc('jb_take_budget',{p_scope:`client:${hour}:${clientHash}`,p_limit:10,p_expires:new Date(Date.now()+2*86400000).toISOString()})))return json(fallback(url.href,'Hourly import limit reached. Paste the details to continue.'),429);
  const key=await digest(url.href);const cached=checked(await db.from('jb_extract_cache').select('result').eq('key',key).gt('expires_at',new Date().toISOString()).maybeSingle());if(cached)return json(cached.result);
  let result:any=fallback(url.href);
  try{
   if(recognizeATS(url.href)){result=await extractATS(url.href);}
   else{const companies=checked(await db.from('jb_companies').select('approved_hosts').eq('approved',true).eq('enabled',true).not('reuse_reviewed_at','is',null));const allowed=companies.flatMap((c:any)=>Array.isArray(c.approved_hosts)?c.approved_hosts:[]).some((h:any)=>h.host===url.hostname&&Array.isArray(h.paths)&&approvedPath(url,h.paths));
    if(allowed){const response=await boundedFetch(url.href,url.hostname);if(!response.type.includes('text/html'))throw new Error('Unsupported content type');result=extractStructuredHTML(response.text,url.href);}else result=fallback(url.href,'This host is not approved for automatic extraction. The link can still be tracked privately.');}
  }catch{result=fallback(url.href,'The source is blocked, unavailable, or incomplete. Paste the description to continue.');}
  // Results are an ephemeral private response cache, never part of the published catalog.
  checked(await db.from('jb_extract_cache').upsert({key,result,expires_at:new Date(Date.now()+(result.status==='manual_required'?3600000:86400000)).toISOString()}));return json(result);
 }catch{return json({error:'Service unavailable; manual entry remains available.'},503);}
});
