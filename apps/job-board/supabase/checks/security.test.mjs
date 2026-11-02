// Narrow credential / database-migration checks allowed by Zach’s weekly policy.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
const source=await readFile(new URL('../functions/_shared/security.ts',import.meta.url),'utf8');
const compiled=await transform(source,{loader:'ts',format:'esm',target:'es2022'});
const security=await import('data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'));
test('credential gate, public destinations, approved paths, and private networks',()=>{
 const secret='a'.repeat(40);
 assert.equal(security.serviceAuthorized(new Request('https://example.org'),secret),false);
 assert.equal(security.serviceAuthorized(new Request('https://example.org',{headers:{'x-job-board-secret':secret}}),secret),true);
 assert.equal(security.serviceAuthorized(new Request('https://example.org',{headers:{'x-job-board-secret':'short'}}),'short'),false);
 for(const url of ['http://example.org','https://user:pass@example.org','https://127.0.0.1/','https://169.254.169.254/','https://localhost/','https://private.internal/jobs','https://example.org:8443/','file:///etc/passwd'])assert.throws(()=>security.publicURL(url));
 for(const ip of ['10.0.0.1','127.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','2001:db8::1'])assert.equal(security.privateIP(ip),true,ip);
 for(const ip of ['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])assert.equal(security.privateIP(ip),false,ip);
 assert.equal(security.approvedPath(new URL('https://company.org/careers/role'),['/careers']),true);
 for(const path of ['/career-spy','/admin','/careers/%2e%2e/admin','/careers/%5cadmin'])assert.equal(security.approvedPath(new URL('https://company.org'+path),['/careers']),false,path);
 assert.equal(security.approvedPath(new URL('https://company.org/anything'),['/']),false);
});
test('migration denies public data/secret access and reconciles only complete snapshots',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 await db.exec(await readFile(new URL('../migrations/202610290001_job_board.sql',import.meta.url),'utf8'));
 for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);for(const table of ['jb_settings','jb_companies','jb_jobs','jb_runs','jb_budgets','jb_extract_cache','jb_publications']){await assert.rejects(db.query(`select * from public.${table}`),/permission denied/);await assert.rejects(db.query(`delete from public.${table}`),/permission denied/);}await assert.rejects(db.query(`select public.jb_claim_source()`),/permission denied/);await assert.rejects(db.query(`select public.jb_take_budget('bypass',1,now())`),/permission denied/);await db.exec('reset role');}
 await db.exec("update public.jb_settings set enabled=true; insert into public.jb_companies(name,industry,career_url,adapter,board_token,approved,enabled,reuse_reviewed_at) values('Fictional Security Fixture','ai-startups','https://company.org/careers','greenhouse','fictional',true,true,now());");
 const [{id}]=(await db.query('select id from public.jb_companies')).rows;
 const claim=async()=>{await db.query('update public.jb_companies set next_refresh_at=now() where id=$1',[id]);return (await db.query('select * from public.jb_claim_source()')).rows[0];};
 let c=await claim();const job={source_id:'1',title:'Operations Lead',canonical_url:'https://company.org/careers/1',description:'Public role'};
 await db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,JSON.stringify([job])]);
 c=await claim();await assert.rejects(db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,JSON.stringify([job,job])]),/Duplicate/);
 assert.equal((await db.query('select missing_successes from public.jb_jobs')).rows[0].missing_successes,0);
 await db.query('select public.jb_fail_source($1,$2,false)',[id,c.lease_id]);
 c=await claim();await db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,'[]']);assert.equal((await db.query('select closed from public.jb_jobs')).rows[0].closed,false);
 c=await claim();await db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,'[]']);assert.equal((await db.query('select closed from public.jb_jobs')).rows[0].closed,true);
 c=await claim();await db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,JSON.stringify([{...job,source_id:'changed'}])]);assert.equal((await db.query('select count(*)::int as n from public.jb_jobs')).rows[0].n,1);
 await assert.rejects(db.query('select public.jb_finish_source($1,$2,$3::jsonb)',[id,c.lease_id,'[]']),/Expired/);
 assert.equal((await db.query("select public.jb_take_budget('quota',1,now()+interval '1 day') as ok")).rows[0].ok,true);assert.equal((await db.query("select public.jb_take_budget('quota',1,now()+interval '1 day') as ok")).rows[0].ok,false);
 }finally{await db.close();}
});
