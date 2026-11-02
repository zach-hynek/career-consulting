import {checked} from './db.ts';
const industries=[['nuclear-energy','Nuclear & energy'],['climate-deep-tech','Climate & deep tech'],['ai-startups','AI & startups']];
export async function publish(db:any){
 const companies=checked(await db.from('jb_companies').select('id,name,industry,rationale,career_url,adapter,source_status,last_verified_at').eq('approved',true).eq('enabled',true).not('reuse_reviewed_at','is',null).order('name'));
 const version=crypto.randomUUID(),publishedAt=new Date().toISOString(),collections=[];let totalJobs=0;
 for(const [industry,label] of industries){const set=companies.filter((c:any)=>c.industry===industry);const ids=set.map((c:any)=>c.id);let jobs:any[]=[];
 if(ids.length){for(let start=0;start<30000;start+=500){const batch=checked(await db.from('jb_jobs').select('id,company_id,source_id,canonical_url,title,location,workplace,remote_eligibility,role_function,excerpt,salary,published_at,first_seen_at,last_verified_at').in('company_id',ids).eq('closed',false).order('id').range(start,start+499));jobs.push(...batch);if(batch.length<500)break;if(start===29500)throw new Error('Catalog capacity reached');}}
 totalJobs+=jobs.length;if(totalJobs>30000)throw new Error('Catalog capacity reached');
 const byId=new Map(set.map((c:any)=>[c.id,c]));const payload={schemaVersion:1,version,companies:set.map((c:any)=>({id:c.id,name:c.name,industry:c.industry,rationale:c.rationale,careerUrl:c.career_url,sourceStatus:c.source_status,lastVerifiedAt:c.last_verified_at})),jobs:jobs.map(j=>{const c:any=byId.get(j.company_id);return {id:j.id,companyId:j.company_id,company:c.name,industry:c.industry,title:j.title,location:j.location,workplace:j.workplace,remoteEligibility:j.remote_eligibility,function:j.role_function,excerpt:j.excerpt,salary:j.salary,url:j.canonical_url,sourceId:j.source_id,source:c.adapter,sourceStatus:c.source_status,publishedAt:j.published_at,firstSeenAt:j.first_seen_at,lastVerifiedAt:j.last_verified_at};})};
 const path=`${version}/${industry}.json`;checked(await db.storage.from('job-board-catalog').upload(path,JSON.stringify(payload),{contentType:'application/json',cacheControl:'86400',upsert:false}));collections.push({id:industry,label,count:jobs.length,path});
 }
 const manifest={schemaVersion:1,version,publishedAt,companyCount:companies.length,collections};
 // Readers see the new manifest only after every immutable shard is available.
 checked(await db.storage.from('job-board-catalog').upload('manifest.json',JSON.stringify(manifest),{contentType:'application/json',cacheControl:'300',upsert:true}));
 const previous=checked(await db.from('jb_publications').select('manifest').eq('id',true).maybeSingle());
 checked(await db.from('jb_publications').upsert({id:true,manifest,created_at:publishedAt}));
 // Keep the previous generation for clients that just fetched its manifest. Remove older generations on later daily runs.
 const folders=checked(await db.storage.from('job-board-catalog').list('',{limit:100,sortBy:{column:'name',order:'asc'}}));
 for(const folder of folders)if(folder.id===null&&/^[0-9a-f-]{36}$/.test(folder.name)&&folder.name!==version&&folder.name!==previous?.manifest?.version){checked(await db.storage.from('job-board-catalog').remove(industries.map(([id])=>`${folder.name}/${id}.json`)));}
 return manifest;
}
