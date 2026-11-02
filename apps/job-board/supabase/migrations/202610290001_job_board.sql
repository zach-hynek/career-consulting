begin;
create table public.jb_settings (
 id boolean primary key default true check(id),
 enabled boolean not null default false,
 extraction_daily_limit integer not null default 300 check(extraction_daily_limit between 0 and 3000),
 ingestion_daily_limit integer not null default 120 check(ingestion_daily_limit between 0 and 500),
 publication_lease_until timestamptz,
 updated_at timestamptz not null default now()
);
insert into public.jb_settings(id) values(true);
create table public.jb_companies (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 200),
 industry text not null check(industry in ('nuclear-energy','climate-deep-tech','ai-startups')),
 rationale text not null default '', career_url text not null,
 research_links text[] not null default '{}',
 adapter text not null default 'manual' check(adapter in ('manual','greenhouse','lever','ashby')),
 board_token text not null default '', region text not null default 'global' check(region in ('global','eu')),
 approved boolean not null default false, enabled boolean not null default false,
 reuse_reviewed_at timestamptz, approved_hosts jsonb not null default '[]',
 source_status text not null default 'manual' check(source_status in ('manual','pending','healthy','stale','blocked')),
 last_verified_at timestamptz,last_attempt_at timestamptz,next_refresh_at timestamptz not null default now(),
 lease_id uuid,leased_until timestamptz,
 check(not approved or reuse_reviewed_at is not null),
 check(adapter='manual' or board_token ~ '^[a-zA-Z0-9_-]{1,150}$')
);
create unique index jb_company_board on public.jb_companies(adapter,region,board_token) where adapter<>'manual';
create table public.jb_jobs (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.jb_companies(id),
 source_id text not null, canonical_url text not null,
 title text not null,location text not null default '',workplace text not null default 'Unknown',
 remote_eligibility text not null default '',role_function text not null default 'Other',
 description text not null default '',excerpt text not null default '', salary jsonb,
 published_at timestamptz,first_seen_at timestamptz not null default now(),last_verified_at timestamptz not null default now(),
 missing_successes integer not null default 0 check(missing_successes>=0),closed boolean not null default false,
 unique(company_id,source_id),unique(company_id,canonical_url)
);
create index jb_jobs_active on public.jb_jobs(company_id) where not closed;
create table public.jb_runs (
 id uuid primary key default gen_random_uuid(),company_id uuid references public.jb_companies(id),
 started_at timestamptz not null default now(),finished_at timestamptz, outcome text not null,job_count integer not null default 0,
 message text not null default ''
);
create table public.jb_budgets (scope text primary key,hits integer not null,expires_at timestamptz not null);
create table public.jb_extract_cache (key text primary key,result jsonb not null,expires_at timestamptz not null);
create table public.jb_publications (id boolean primary key default true check(id),manifest jsonb not null,created_at timestamptz not null default now());

create or replace function public.jb_take_budget(p_scope text,p_limit integer,p_expires timestamptz) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare used integer;
begin
 if p_limit<=0 then return false;end if;
 insert into jb_budgets(scope,hits,expires_at) values(p_scope,1,p_expires)
 on conflict(scope) do update set hits=jb_budgets.hits+1 where jb_budgets.hits<p_limit returning hits into used;
 return used is not null;
end $$;
create or replace function public.jb_claim_source() returns setof public.jb_companies language plpgsql security definer set search_path=public,pg_temp as $$
declare c jb_companies;maximum integer;
begin
 select ingestion_daily_limit into maximum from jb_settings where id and enabled;
 if maximum is null then return;end if;
 perform pg_advisory_xact_lock(907291);
 select * into c from jb_companies where approved and enabled and adapter<>'manual' and reuse_reviewed_at is not null and next_refresh_at<=now() and (leased_until is null or leased_until<now()) order by next_refresh_at limit 1 for update skip locked;
 if c.id is null then return;end if;
 if not jb_take_budget('ingest:'||to_char(now() at time zone 'UTC','YYYY-MM-DD'),maximum,now()+interval '2 days') then return;end if;
 update jb_companies set lease_id=gen_random_uuid(),leased_until=now()+interval '3 minutes',last_attempt_at=now(),next_refresh_at=(date_trunc('day',now() at time zone 'UTC')+interval '1 day 4 hours') at time zone 'UTC' where id=c.id returning * into c;
 return next c;
end $$;
create or replace function public.jb_finish_source(p_company uuid,p_lease uuid,p_jobs jsonb) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare c jb_companies;j jsonb;counted integer:=0;ids text[]:='{}';urls text[]:='{}';prior integer;
begin
 select * into c from jb_companies where id=p_company for update;
 if c.id is null or c.lease_id is distinct from p_lease or c.leased_until<now() then raise exception 'Expired source lease';end if;
 if not c.approved or not c.enabled or not exists(select 1 from jb_settings where id and enabled) then raise exception 'Source disabled';end if;
 if jsonb_typeof(p_jobs)<>'array' or jsonb_array_length(p_jobs)>3000 then raise exception 'Invalid source snapshot';end if;
 select count(*) into prior from jb_jobs where company_id=p_company and not closed;
 if prior>=10 and jsonb_array_length(p_jobs)<prior*0.1 then raise exception 'Suspicious source shrink; review before closure';end if;
 for j in select * from jsonb_array_elements(p_jobs) loop
  if coalesce(j->>'source_id','')='' or coalesce(j->>'title','')='' or coalesce(j->>'canonical_url','')!~'^https://' then raise exception 'Incomplete source record';end if;
  if j->>'source_id'=any(ids) or j->>'canonical_url'=any(urls) then raise exception 'Duplicate source record';end if;
  ids:=array_append(ids,j->>'source_id');urls:=array_append(urls,j->>'canonical_url');
  -- A canonical URL is the stable identity if an ATS changes a source ID.
  update jb_jobs set source_id=j->>'source_id' where company_id=p_company and canonical_url=j->>'canonical_url' and source_id<>j->>'source_id' and not exists(select 1 from jb_jobs existing where existing.company_id=p_company and existing.source_id=j->>'source_id');
  insert into jb_jobs(company_id,source_id,canonical_url,title,location,workplace,remote_eligibility,role_function,description,excerpt,salary,published_at)
  values(p_company,j->>'source_id',j->>'canonical_url',j->>'title',coalesce(j->>'location',''),coalesce(j->>'workplace','Unknown'),coalesce(j->>'remote_eligibility',''),coalesce(j->>'role_function','Other'),left(coalesce(j->>'description',''),50000),left(coalesce(j->>'excerpt',''),500),j->'salary',nullif(j->>'published_at','')::timestamptz)
  on conflict(company_id,source_id) do update set canonical_url=excluded.canonical_url,title=excluded.title,location=excluded.location,workplace=excluded.workplace,remote_eligibility=excluded.remote_eligibility,role_function=excluded.role_function,description=excluded.description,excerpt=excluded.excerpt,salary=excluded.salary,published_at=coalesce(jb_jobs.published_at,excluded.published_at),last_verified_at=now(),missing_successes=0,closed=false;
  counted:=counted+1;
 end loop;
 update jb_jobs set missing_successes=missing_successes+1,closed=(missing_successes+1>=2) where company_id=p_company and not(source_id=any(ids)) and not closed;
 update jb_companies set source_status='healthy',last_verified_at=now(),lease_id=null,leased_until=null where id=p_company;
 insert into jb_runs(company_id,finished_at,outcome,job_count) values(p_company,now(),'success',counted);
 return counted;
end $$;
create or replace function public.jb_fail_source(p_company uuid,p_lease uuid,p_blocked boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update jb_companies set source_status=case when p_blocked then 'blocked' else 'stale' end,lease_id=null,leased_until=null where id=p_company and lease_id=p_lease;
 if found then insert into jb_runs(company_id,finished_at,outcome,message) values(p_company,now(),'failed','Source unavailable or incomplete; prior jobs retained.');end if;
end $$;
create or replace function public.jb_claim_publication() returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update jb_settings set publication_lease_until=now()+interval '5 minutes' where id and enabled and (publication_lease_until is null or publication_lease_until<now()) and not exists(select 1 from jb_companies where approved and enabled and adapter<>'manual' and (next_refresh_at<=now() or leased_until>now()));
 return found;
end $$;
create or replace function public.jb_cleanup() returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 delete from jb_runs where started_at<now()-interval '30 days';
 delete from jb_budgets where expires_at<now();
 delete from jb_extract_cache where expires_at<now();
 delete from jb_jobs where closed and last_verified_at<now()-interval '90 days';
end $$;

alter table public.jb_settings enable row level security;
alter table public.jb_companies enable row level security;
alter table public.jb_jobs enable row level security;
alter table public.jb_runs enable row level security;
alter table public.jb_budgets enable row level security;
alter table public.jb_extract_cache enable row level security;
alter table public.jb_publications enable row level security;
-- There are intentionally no anonymous or authenticated table policies. Published snapshots are the public interface.
revoke all on public.jb_settings,public.jb_companies,public.jb_jobs,public.jb_runs,public.jb_budgets,public.jb_extract_cache,public.jb_publications from public,anon,authenticated;
grant all on public.jb_settings,public.jb_companies,public.jb_jobs,public.jb_runs,public.jb_budgets,public.jb_extract_cache,public.jb_publications to service_role;
revoke all on function public.jb_take_budget(text,integer,timestamptz),public.jb_claim_source(),public.jb_finish_source(uuid,uuid,jsonb),public.jb_fail_source(uuid,uuid,boolean),public.jb_claim_publication(),public.jb_cleanup() from public,anon,authenticated;
grant execute on function public.jb_take_budget(text,integer,timestamptz),public.jb_claim_source(),public.jb_finish_source(uuid,uuid,jsonb),public.jb_fail_source(uuid,uuid,boolean),public.jb_claim_publication(),public.jb_cleanup() to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('job-board-catalog','job-board-catalog',true,8388608,array['application/json']) on conflict(id) do nothing;
-- No client upload policies are added to storage.objects. Only service_role publishes catalogs.
commit;
