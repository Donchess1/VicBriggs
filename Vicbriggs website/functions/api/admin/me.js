import {requireAdmin} from '../../_lib/auth.js';import {json} from '../../_lib/http.js';
export async function onRequestGet(c){const denied=await requireAdmin(c);return denied||json({email:c.env.ADMIN_EMAIL})}
