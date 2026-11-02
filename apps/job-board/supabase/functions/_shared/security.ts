export const MAX_PAGE_BYTES = 2_000_000;
export function publicURL(value: unknown): URL {
  if(typeof value!=='string'||value.length>2048)throw new Error('Invalid URL');
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hash)throw new Error('Only public HTTPS URLs are supported');
  const h=u.hostname.toLowerCase();
  // Never resolve IP literals or local/private namespaces, even when accidentally allowlisted.
  if(!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(h)||/(^|\.)(localhost|local|internal|test|invalid|example|home|lan|onion)$/.test(h))throw new Error('Non-public host');
  return u;
}
export function privateIP(ip:string):boolean {
  const s=ip.toLowerCase();if(s.includes(':'))return !/^[23][0-9a-f]{0,3}:/.test(s)||s.startsWith('2001:db8:')||s.startsWith('2001:0:')||s.startsWith('2002:');
  const n=s.split('.').map(Number);if(n.length!==4||n.some(x=>!Number.isInteger(x)||x<0||x>255))return true;
  return n[0]===0||n[0]===10||n[0]===127||n[0]>=224||(n[0]===100&&n[1]>=64&&n[1]<=127)||(n[0]===169&&n[1]===254)||(n[0]===172&&n[1]>=16&&n[1]<=31)||(n[0]===192&&(n[1]===168||n[1]===0||n[1]===2))||(n[0]===198&&(n[1]===18||n[1]===19||n[1]===51))||(n[0]===203&&n[1]===0&&n[2]===113);
}
export function approvedPath(url:URL,prefixes:string[]):boolean {
 let decoded:string;try{decoded=decodeURIComponent(url.pathname);}catch{return false;}
 if(/[\\\x00-\x1f]/.test(decoded)||decoded.split('/').includes('..'))return false;
 return prefixes.some(p=>p.startsWith('/')&&p!=='/'&&(decoded===p||decoded.startsWith(p.endsWith('/')?p:p+'/')));
}
export async function assertPublicDNS(host:string){
 const answers=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);
 const addresses=answers.flatMap(a=>a.status==='fulfilled'?a.value:[]);
 if(!addresses.length||addresses.some(privateIP))throw new Error('Host does not resolve to public addresses');
}
export async function boundedFetch(value:string,expectedHost:string,limit=MAX_PAGE_BYTES):Promise<{text:string;type:string}> {
 const url=publicURL(value);if(url.hostname!==expectedHost)throw new Error('Unexpected fetch host');
 await assertPublicDNS(url.hostname);
 const response=await fetch(url.href,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json, text/html;q=0.9','User-Agent':'CareerJobBoard/1.0 (public employer job directory)'}});
 if(!response.ok)throw new Error(`Source unavailable (${response.status})`);
 if(Number(response.headers.get('content-length'))>limit)throw new Error('Source response too large');
 const reader=response.body?.getReader();if(!reader)throw new Error('Missing response');const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limit)throw new Error('Source response too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return {text:new TextDecoder().decode(bytes),type:response.headers.get('content-type')||''};
}
export function serviceAuthorized(request:Request,secret:string){return !!secret&&secret.length>=32&&request.headers.get('x-job-board-secret')===secret;}
export const corsHeaders={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export function json(data:unknown,status=200,cache='no-store'){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':cache}});}
