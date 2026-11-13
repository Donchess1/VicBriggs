import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, verifyAsset, handleError } from '../../../_lib/http.js';

function parseId(context) {
  const id = Number(context.params.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function onRequestPatch(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const id = parseId(context);
  if (!id) return fail('Invalid profile ID');
  try {
    const body = await context.request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request body');
    const fields = [], values = [];
    for (const [field, max] of [['name', 150], ['designation', 150], ['biography', 3000]]) {
      if (Object.hasOwn(body, field)) {
        if (typeof body[field] !== 'string' || body[field].length > max ||
            (field !== 'biography' && !body[field].trim())) return fail('Invalid ' + field);
        fields.push(`${field} = ?`);
        values.push(body[field].trim());
      }
    }
    if (Object.hasOwn(body, 'group')) {
      if (!['board', 'management'].includes(body.group)) return fail('Invalid leadership group');
      fields.push('"group" = ?'); values.push(body.group);
    }
    if (Object.hasOwn(body, 'status')) {
      if (!['draft', 'published'].includes(body.status)) return fail('Invalid status');
      fields.push('status = ?'); values.push(body.status);
    }
    if (Object.hasOwn(body, 'display_order')) {
      const order = Number(body.display_order);
      if (!Number.isSafeInteger(order) || Math.abs(order) > 100000) return fail('Invalid display order');
      fields.push('display_order = ?'); values.push(order);
    }
    if (Object.hasOwn(body, 'photo_public_id')) {
      if (typeof body.photo_public_id !== 'string' ||
          !/^vicbriggs\/leadership\/[A-Za-z0-9_\/-]{1,220}$/.test(body.photo_public_id))
        return fail('Invalid photo identifier');
      const asset = await verifyAsset(context.env, body.photo_public_id, 'image');
      fields.push('photo_public_id = ?', 'photo_url = ?');
      values.push(body.photo_public_id, asset.secure_url);
    }
    if (!fields.length) return fail('No changes supplied');
    values.push(id);
    const result = await db(context.env).prepare(`
      UPDATE leadership_profiles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).bind(...values).run();
    return result.meta.changes ? json({ ok: true }) : fail('Profile not found', 404);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return fail('Photograph is already assigned', 409);
    return handleError(error);
  }
}

export async function onRequestDelete(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const id = parseId(context);
  if (!id) return fail('Invalid profile ID');
  try {
    const result = await db(context.env).prepare(`
      UPDATE leadership_profiles SET deleted_at = CURRENT_TIMESTAMP,
        status = 'draft', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).run();
    return result.meta.changes ? json({ ok: true }) : fail('Profile not found', 404);
  } catch (error) { return handleError(error); }
}
