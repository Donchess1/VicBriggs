
import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, handleError } from '../../../_lib/http.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function onRequestPatch(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    const id = Number(c.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return fail('Invalid project ID');

    const body = await c.request.json();
    const fields = [];
    const values = [];

    for (const [key, max] of Object.entries({ description: 5000, client: 250 })) {
      if (Object.hasOwn(body, key)) {
        const value = String(body[key] ?? '').trim().slice(0, max);
        if (!value) return fail(`${key} is required`);
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    const hasMonth = Object.hasOwn(body, 'month');
    const hasYear = Object.hasOwn(body, 'year');

    if (hasMonth !== hasYear) {
      return fail('Month and year must be supplied together');
    }

    if (hasMonth) {
      const month = Number(body.month);
      const year = Number(body.year);

      if (
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(year) || year < 1900 || year > 2200
      ) {
        return fail('A valid month and year are required');
      }

      fields.push('month = ?', 'year = ?', 'period = ?');
      values.push(month, year, `${MONTHS[month - 1]} ${year}`);
    }

    if (Object.hasOwn(body, 'execution_status')) {
      if (!['Completed', 'In Progress'].includes(body.execution_status)) {
        return fail('Execution status must be Completed or In Progress');
      }

      fields.push('execution_status = ?');
      values.push(body.execution_status);
    }

    // CMS publication status remains a separate Draft/Published control.
    if (Object.hasOwn(body, 'status')) {
      if (!['draft', 'published'].includes(body.status)) {
        return fail('Invalid publication status');
      }

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
      "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP, status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL"
    ).bind(id).run();

    return result.meta.changes ? json({ ok: true }) : fail('Project not found', 404);
  } catch (error) {
    return handleError(error);
  }
}
