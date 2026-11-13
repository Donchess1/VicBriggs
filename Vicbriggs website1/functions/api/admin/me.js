import {currentAdmin} from '../../_lib/auth.js';import {json,fail} from '../../_lib/http.js';
export async function onRequestGet({request,env}){try{const admin=await currentAdmin(request,env);return admin?json({email:admin.email}):fail('Authentication required',401)}catch(e){console.error(e);return fail('Authentication unavailable',503)}}
