import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, handleError } from '../../../_lib/http.js';

export async function onRequestPatch(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  try {
    const id = Number(c.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return fail('Invalid project ID');
    const body = await c.request.json();
    const fields = [];
    const values = [];
    for (const [key, max] of Object.entries({ description: 5000, client: 250, period: 120 })) {
      if (Object.hasOwn(body, key)) {
        const value = String(body[key] ?? '').trim().slice(0, max);
        if (!value) return fail(`${key} is required`);
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (Object.hasOwn(body, 'status')) {
      if (!['draft', 'published'].includes(body.status)) return fail('Invalid status');
      fields.push('status = ?');
      values.push(body.status);
    }
    if (!fields.length) return fail('No changes supplied');
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const result = await db(c.env).prepare(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`
    ).bind(...values).run();
    return result.meta.changes ? json({ ok: true }) : fail('Project not found', 404);
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestDelete(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  try {
    const id = Number(c.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return fail('Invalid project ID');
    const result = await db(c.env).prepare(
      'UPDATE projects SET deleted_at = CURRENT_TIMESTAMP, status = \'draft\', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).run();
    return result.meta.changes ? json({ ok: true }) : fail('Project not found', 404);
  } catch (error) {
    return handleError(error);
  }
}
