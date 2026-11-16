import {db,json,fail} from '../../_lib/http.js';
import {sameOrigin,checkPassword,loginAllowed,recordFailure,clearFailures,startSession} from '../../_lib/auth.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return fail('Invalid request origin',403);
 try{
  const b=await request.json();const email=String(b.email||'').trim().toLowerCase();const password=String(b.password||'');
  if(!email||email.length>254||!password||password.length>1024)return fail('Invalid credentials',401);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';const key=`${ip}:${email}`;
  if(!await loginAllowed(env,key))return fail('Too many attempts. Try again in 15 minutes.',429);
  const admin=await db(env).prepare('SELECT * FROM cms_admins WHERE email=?').bind(email).first();
  if(!admin||!await checkPassword(password,admin)){await recordFailure(env,key);return fail('Invalid credentials',401)}
  await clearFailures(env,key);const cookie=await startSession(env,admin.id);
  const response=json({ok:true,email:admin.email});response.headers.append('Set-Cookie',cookie);return response;
 }catch(e){console.error('Login error',e);return fail('Login unavailable',503)}
}
