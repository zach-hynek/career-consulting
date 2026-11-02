import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
export function admin(){const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)throw new Error('Backend configuration missing');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export function checked<T extends {error:unknown;data:unknown}>(result:T){if(result.error)throw new Error('Database operation failed');return result.data as any;}
