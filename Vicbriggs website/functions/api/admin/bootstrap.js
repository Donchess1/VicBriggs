import {db,json,fail} from '../../_lib/http.js';import {sameOrigin,makePassword} from '../../_lib/auth.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return fail('Invalid request origin',403);
 if(!env.CMS_BOOTSTRAP_TOKEN||env.CMS_BOOTSTRAP_TOKEN.length<32)return fail('Bootstrap is disabled',403);
 try{
  const b=await request.json();const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<14||password.length>1024)return fail('Use a valid email and password of at least 14 characters');
  const token=String(b.setup_token||'');if(token!==env.CMS_BOOTSTRAP_TOKEN)return fail('Invalid setup token',403);
  const existing=await db(env).prepare('SELECT id FROM cms_admins LIMIT 1').first();if(existing)return fail('Administrator already exists. Bootstrap is permanently closed.',409);
  const h=await makePassword(password);await db(env).prepare('INSERT INTO cms_admins(email,password_hash,password_salt,iterations) VALUES(?,?,?,?)').bind(email,h.password_hash,h.password_salt,h.iterations).run();
  return json({ok:true,message:'Administrator created. Remove CMS_BOOTSTRAP_TOKEN from Cloudflare immediately.'},201);
 }catch(e){console.error('Bootstrap error',e);return fail('Could not create administrator',503)}
}
