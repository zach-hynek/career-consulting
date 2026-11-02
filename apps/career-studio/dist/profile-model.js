import {normalizeDocument} from './resume-editor.js';
export const blankJob=()=>({title:'',company:'',dates:'',context:'',bullets:''});
export const blankEducation=()=>({school:'',degree:'',dates:'',details:''});
export const blankProfile=()=>({name:'',headline:'',email:'',phone:'',location:'',website:'',linkedin:'',summary:'',targetRole:'',organization:'',recipient:'',motivation:'',jobDescription:'',proof:'',skills:'',extras:'',jobs:[blankJob()],education:[blankEducation()]});
export const freshState=()=>({schemaVersion:1,profile:blankProfile(),layout:'classic',accent:'#345b49',step:0,sample:false,document:normalizeDocument(),drafts:{letter:'',outreach:'',letterBasis:'',outreachBasis:''}});
export function normalizeState(data){
 if(!data||data.schemaVersion!==1||!data.profile||typeof data.profile!=='object')throw Error('Choose a version 1 Career Studio profile.');
 const clean=freshState();
 for(const key of Object.keys(clean.profile)){if(['jobs','education'].includes(key))continue;if(data.profile[key]!==undefined&&typeof data.profile[key]!=='string')throw Error('A profile field has an unsupported value.');clean.profile[key]=(data.profile[key]||'').slice(0,15000);}
 for(const [key,factory] of [['jobs',blankJob],['education',blankEducation]]){if(!Array.isArray(data.profile[key])||data.profile[key].length>40)throw Error('Use no more than 40 experience or education entries.');clean.profile[key]=data.profile[key].map(item=>{if(!item||typeof item!=='object')throw Error('Invalid profile entry.');const r=factory();for(const field of Object.keys(r)){if(item[field]!==undefined&&typeof item[field]!=='string')throw Error('Invalid entry value.');r[field]=(item[field]||'').slice(0,15000);}return r;});}
 clean.layout=['classic','sidebar','leadership'].includes(data.layout)?data.layout:'classic';clean.accent=/^#[0-9a-f]{6}$/i.test(data.accent||'')?data.accent:clean.accent;clean.step=Number.isInteger(data.step)?Math.max(0,Math.min(5,data.step)):0;clean.sample=data.sample===true;clean.document=normalizeDocument(data.document);for(const key of Object.keys(clean.drafts))clean.drafts[key]=typeof data.drafts?.[key]==='string'?data.drafts[key].slice(0,100000):'';return clean;
}
