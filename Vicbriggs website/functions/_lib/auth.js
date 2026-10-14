import {fail} from './http.js';
const decoder=new TextDecoder();
function base64url(s){const normalized=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')),c=>c.charCodeAt(0))}
function parse(s){return JSON.parse(decoder.decode(base64url(s)))}
export async function authorized(request,env){
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ADMIN_EMAIL)return false;
 const parts=token.split('.');if(parts.length!==3)return false;
 try{
 const [head,body]=[parse(parts[0]),parse(parts[1])];
 if(head.alg!=='RS256'||!head.kid)return false;
 const domain=env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,'').replace(/\/$/,'');
 const issuer=`https://${domain}`;
 if(body.iss!==issuer||!(Array.isArray(body.aud)?body.aud.includes(env.ACCESS_AUD):body.aud===env.ACCESS_AUD)||body.exp<=Date.now()/1000||body.nbf>Date.now()/1000||String(body.email||'').toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return false;
 const keys=await fetch(`${issuer}/cdn-cgi/access/certs`,{cf:{cacheTtl:300}}).then(r=>r.json());
 const jwk=keys.keys.find(k=>k.kid===head.kid);if(!jwk)return false;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,base64url(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
 }catch(e){console.error('Access verification failed',e);return false}
}
export async function requireAdmin(context){return await authorized(context.request,context.env)?null:fail('Unauthorized. Sign in with your approved IT Admin account.',401)}
