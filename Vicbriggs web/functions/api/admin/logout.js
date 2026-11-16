import {json,fail} from '../../_lib/http.js';import {sameOrigin,endSession,sessionCookie} from '../../_lib/auth.js';
export async function onRequestPost({request,env}){if(!sameOrigin(request))return fail('Invalid request origin',403);await endSession(request,env);const r=json({ok:true});r.headers.append('Set-Cookie',sessionCookie('',0));return r}
