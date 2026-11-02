/** Read-only adapter inspection. Does not approve, save, or publish a company. */
import {collect} from '../supabase/functions/_shared/adapters.ts';
const [adapter,board,region='global']=Deno.args;
if(!['greenhouse','lever','ashby'].includes(adapter)||!board){console.error('Usage: deno run --allow-net scripts/inspect-source.ts <greenhouse|lever|ashby> <board> [global|eu]');Deno.exit(1);}
const jobs=await collect({id:'inspection',name:board,industry:'',adapter,board_token:board,region,career_url:''});
console.log(JSON.stringify({adapter,board,inspectedAt:new Date().toISOString(),count:jobs.length,example:jobs[0]?{title:jobs[0].title,url:jobs[0].canonical_url,location:jobs[0].location,publishedAt:jobs[0].published_at,descriptionLength:jobs[0].description.length}:null},null,2));
