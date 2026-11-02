import {normalizeWorkflow} from './workflow-model.mjs';
export const STAGES = ['Not Started', 'Networking / Following', 'Mutual Connections', 'Applied w/ Referral Link', 'Applied w/o Referral Link', 'Interviewing', 'Offer', 'Accepted', 'Rejected', 'Not Interested'];
export const INDUSTRIES = [{id:'nuclear-energy',label:'Nuclear & energy',icon:'↗',description:'Build what powers the future.'},{id:'climate-deep-tech',label:'Climate & deep tech',icon:'◎',description:'Work on problems that matter.'},{id:'ai-startups',label:'AI & startups',icon:'✳',description:'Help shape what comes next.'}];
export const FUNCTIONS = ['Sales', 'Business development', 'Finance', 'Operations', 'Product', 'Engineering', 'Marketing', 'People', 'Other'];
export const FIELD_NAMES = ['company','title','industry','function','location','hqLocation','workplace','remoteEligibility','priority','stage','url','recruiter','hiringManagers','connections','ceo','cro','svp','contactDetails','appliedDate','nextAction','followUpDate','description','notes','source','sourceId','publishedAt','firstSeenAt','lastVerifiedAt'];
export const blankPreferences = () => ({search:'',industry:'',function:'',location:'',workplace:'',salary:'',freshness:'',keywords:'',view:'board',group:'stage',company:'',shortlistOnly:false});
export const freshState = () => ({schemaVersion:1,records:[],shortlist:[],preferences:blankPreferences(),cache:null});
export const escapeHTML = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value) {try {const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function canonicalURL(value) {const safe=safeURL(value);if(!safe)return '';const u=new URL(safe);u.hash='';for(const key of [...u.searchParams.keys()])if(/^(utm_|trk|tracking|source$|ref$)/i.test(key))u.searchParams.delete(key);u.searchParams.sort();u.pathname=u.pathname.replace(/\/$/,'')||'/';return u.href;}
export function plainText(value){return String(value??'').slice(0,100000);}
export const industryLabel = id => INDUSTRIES.find(i=>i.id===id)?.label||id||'Uncategorized';
export function normalizeRecord(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('A saved record is invalid.');
  const result={};
  for(const key of FIELD_NAMES){if(input[key]!=null&&typeof input[key]!=='string')throw new Error(`Invalid ${key} field.`);result[key]=String(input[key]||'').slice(0,['notes','description'].includes(key)?50000:1500);}
  if(!result.company.trim())throw new Error('Enter a company name.');
  result.id=typeof input.id==='string'&&/^[a-zA-Z0-9:_-]{1,160}$/.test(input.id)?input.id:crypto.randomUUID();
  result.kind=input.kind==='company'?'company':'job'; result.stage=STAGES.includes(result.stage)?result.stage:STAGES[0];
  if(result.url&&!safeURL(result.url))throw new Error('Use a full HTTP or HTTPS URL without a username or password.');
  result.url=canonicalURL(result.url);result.priority=['Tier 1','Tier 2','Tier 3'].includes(result.priority)?result.priority:'Tier 2';
  for(const key of ['appliedDate','followUpDate'])if(result[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(result[key]))throw new Error('Use a valid date.');
  result.createdAt=validTimestamp(input.createdAt)||new Date().toISOString();result.updatedAt=validTimestamp(input.updatedAt)||result.createdAt;
  result.sample=input.sample===true;result.closed=input.closed===true;
  result.salary=normalizeSalary(input.salary);
  return result;
}
export function normalizeSalary(s){if(!s||typeof s!=='object')return null;return {min:Number.isFinite(s.min)?s.min:null,max:Number.isFinite(s.max)?s.max:null,currency:typeof s.currency==='string'?s.currency.slice(0,8):'',interval:typeof s.interval==='string'?s.interval.slice(0,30):''};}
function validTimestamp(v){return typeof v==='string'&&v.length<50&&Number.isFinite(Date.parse(v))?v:'';}
export function validateBackup(data, trusted=false){
  if(!data||data.schemaVersion!==1||!Array.isArray(data.records)||data.records.length>5000)throw new Error('Choose a version 1 Job Board backup (up to 5,000 records).');
  const records=data.records.map(normalizeRecord),ids=new Set();for(const r of records){if(ids.has(r.id))throw new Error('The backup has duplicate record IDs.');ids.add(r.id);}
  const preferences=blankPreferences();if(data.preferences&&typeof data.preferences==='object')for(const k of Object.keys(preferences))if(typeof data.preferences[k]===typeof preferences[k])preferences[k]=typeof preferences[k]==='string'?data.preferences[k].slice(0,1000):data.preferences[k];
  const shortlist=Array.isArray(data.shortlist)?[...new Set(data.shortlist.filter(x=>typeof x==='string'&&x.length<160))].slice(0,5000):[];
  return {schemaVersion:1,records,shortlist,preferences,workflow:normalizeWorkflow(data.workflow,trusted)};
}
export function recordKey(r){return r.kind==='company'?`company:${r.company.trim().toLowerCase()}`:r.url?`url:${canonicalURL(r.url)}`:`role:${r.company.toLowerCase()}:${r.title.toLowerCase()}`;}
export function mergeBackup(state,incoming){const keys=new Set(state.records.map(recordKey)),ids=new Set(state.records.map(r=>r.id));const added=[];for(const r of incoming.records){if(keys.has(recordKey(r))||ids.has(r.id))continue;added.push(r);keys.add(recordKey(r));ids.add(r.id);}const workflow=normalizeWorkflow(state.workflow,true);if(!state.records.length&&incoming.workflow){workflow.masterResume=incoming.workflow.masterResume;workflow.masterPageBudget=incoming.workflow.masterPageBudget;workflow.facts=incoming.workflow.facts;workflow.brief=incoming.workflow.brief;workflow.playbook=incoming.workflow.playbook;workflow.selected=incoming.workflow.selected;workflow.passed=incoming.workflow.passed;}for(const f of incoming.workflow?.facts||[])if(!workflow.facts.some(x=>x.id===f.id)&&workflow.facts.length<500)workflow.facts.push(f);for(const r of added)if(incoming.workflow?.applications[r.id])workflow.applications[r.id]=incoming.workflow.applications[r.id];return {...state,workflow,records:[...state.records,...added],shortlist:[...new Set([...state.shortlist,...incoming.shortlist])]};}
export function salaryLabel(s){if(!s||(s.min==null&&s.max==null))return 'Salary undisclosed';const format=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);return `${s.currency||''} ${s.min!=null?format(s.min):'?'}${s.max!=null?` – ${format(s.max)}`:'+'}${s.interval?` / ${s.interval}`:''}`.trim();}
export function dateLabel(v){return v&&Number.isFinite(Date.parse(v))?new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(v)):'Unknown';}
export function matchJobs(jobs,prefs){
 const keywords=prefs.keywords.toLowerCase().split(/[,\n]+/).map(v=>v.trim()).filter(Boolean);
 return jobs.map(job=>{const hay=[job.title,job.company,job.function,job.location,job.excerpt].join(' ').toLowerCase();const reasons=keywords.filter(k=>hay.includes(k)).map(k=>`Matches ${k}`);let score=reasons.length*10;
 if(prefs.function&&job.function===prefs.function){reasons.push(`Matches ${prefs.function.toLowerCase()}`);score+=5;}
 const matches=(!prefs.search||prefs.search.toLowerCase().split(/\s+/).every(k=>hay.includes(k)))&&(!prefs.company||job.companyId===prefs.company)&&(!prefs.industry||job.industry===prefs.industry)&&(!prefs.function||job.function===prefs.function)&&(!prefs.location||[job.location,job.remoteEligibility].join(' ').toLowerCase().includes(prefs.location.toLowerCase()))&&(!prefs.workplace||job.workplace===prefs.workplace)&&(!prefs.salary||(job.salary?.currency==='USD'&&job.salary?.interval==='year'&&Number(job.salary.max??job.salary.min)>=Number(prefs.salary)))&&(!prefs.freshness||(job.publishedAt&&Date.parse(job.publishedAt)>=Date.now()-Number(prefs.freshness)*86400000));
 return {...job,reasons,score,matches};}).filter(j=>j.matches).sort((a,b)=>b.score-a.score||(Date.parse(b.publishedAt||b.firstSeenAt)||0)-(Date.parse(a.publishedAt||a.firstSeenAt)||0));
}
export function csv(records){const fields=['kind',...FIELD_NAMES];const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';return '\uFEFF'+[fields.map(cell).join(','),...records.map(r=>fields.map(f=>cell(r[f])).join(','))].join('\r\n');}
export function fictionalRecords(){return [
 {company:'Helios Works',title:'Director of Operations',industry:'nuclear-energy',function:'Operations',location:'Chicago, IL',workplace:'Hybrid',stage:'Mutual Connections',priority:'Tier 1',connections:'Jordan — former colleague',nextAction:'Ask Jordan about the operations team',followUpDate:new Date().toISOString().slice(0,10),notes:'Fictional example. Use a warm introduction before applying.'},
 {company:'Moss & Matter',title:'Commercial Strategy Lead',industry:'climate-deep-tech',function:'Business development',location:'Remote',stage:'Networking / Following',priority:'Tier 1',nextAction:'Read the team’s latest project update'},
 {company:'Northstar Systems',kind:'company',title:'',industry:'ai-startups',function:'Product',stage:'Not Started',priority:'Tier 2',nextAction:'Explore the company and meet the team'},
 {company:'Helios Works',title:'Finance Manager',industry:'nuclear-energy',function:'Finance',stage:'Applied w/ Referral Link',priority:'Tier 2',recruiter:'Alex — fictional recruiter',appliedDate:new Date().toISOString().slice(0,10)}
 ].map(r=>normalizeRecord({...r,id:crypto.randomUUID(),sample:true}));}
