import {admin,checked} from '../_shared/db.ts';
import {collect} from '../_shared/adapters.ts';
import {serviceAuthorized,json} from '../_shared/security.ts';
import {publish} from '../_shared/publish.ts';
Deno.serve(async request=>{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!serviceAuthorized(request,Deno.env.get('JOB_BOARD_REFRESH_SECRET')||''))return json({error:'Unauthorized'},401);
 const db=admin();
 try{
  const settings=checked(await db.from('jb_settings').select('enabled').eq('id',true).single());if(!settings.enabled)return json({status:'disabled'});
  const sources=checked(await db.rpc('jb_claim_source'));const company=sources?.[0];
  if(company){try{const jobs=await collect(company);checked(await db.rpc('jb_finish_source',{p_company:company.id,p_lease:company.lease_id,p_jobs:jobs}));return json({status:'refreshed',companyId:company.id,jobs:jobs.length});}catch(error){const blocked=/\(40[13]\)|\(429\)/.test(String(error));checked(await db.rpc('jb_fail_source',{p_company:company.id,p_lease:company.lease_id,p_blocked:blocked}));return json({status:'retained',companyId:company.id,message:'Source unavailable or incomplete; previous listings retained.'});}}
  // Publish at most daily, after all currently due sources have completed.
  const last=checked(await db.from('jb_publications').select('created_at').eq('id',true).maybeSingle());
  if(last&&Date.now()-Date.parse(last.created_at)<23*3600000)return json({status:'idle'});
  if(!checked(await db.rpc('jb_claim_publication')))return json({status:'idle'});
  const manifest=await publish(db);checked(await db.rpc('jb_cleanup'));return json({status:'published',version:manifest.version});
 }catch{return json({error:'Refresh failed. Prior catalog retained; inspect server logs and configuration.'},500);}
});
