import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, verifyAsset, handleError } from '../../../_lib/http.js';

function validText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}

export async function onRequestGet(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  try {
    const result = await db(context.env).prepare(`
      SELECT * FROM leadership_profiles WHERE deleted_at IS NULL
      ORDER BY "group", display_order ASC, id ASC LIMIT 500
    `).all();
    return json({ items: result.results || [] });
  } catch (error) { return handleError(error); }
}

export async function onRequestPost(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  try {
    const body = await context.request.json();
    if (!validText(body.name, 150) || !validText(body.designation, 150))
      return fail('Name and designation are required (maximum 150 characters)');
    if (!['board', 'management'].includes(body.group)) return fail('Invalid leadership group');
    if (body.biography !== undefined && (typeof body.biography !== 'string' || body.biography.length > 3000))
      return fail('Biography must be 3000 characters or fewer');
    if (typeof body.photo_public_id !== 'string' ||
        !/^vicbriggs\/leadership\/[A-Za-z0-9_\/-]{1,220}$/.test(body.photo_public_id))
      return fail('Invalid leadership photo identifier');
    const order = body.display_order === undefined ? 0 : Number(body.display_order);
    if (!Number.isSafeInteger(order) || Math.abs(order) > 100000) return fail('Invalid display order');
    const asset = await verifyAsset(context.env, body.photo_public_id, 'image');
    const result = await db(context.env).prepare(`
      INSERT INTO leadership_profiles
      (name, designation, "group", biography, photo_public_id, photo_url, status, display_order)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
    `).bind(body.name.trim(), body.designation.trim(), body.group,
      (body.biography || '').trim(), body.photo_public_id, asset.secure_url, order).run();
    return json({ id: result.meta.last_row_id, status: 'draft' }, 201);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return fail('This photograph already belongs to a profile', 409);
    return handleError(error);
  }
}
