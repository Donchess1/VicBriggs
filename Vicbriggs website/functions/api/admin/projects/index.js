import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, handleError } from '../../../_lib/http.js';

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export async function onRequestGet(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  try {
    const result = await db(c.env).prepare(
      `SELECT id, serial_number, description, client, period, status, created_at, updated_at
       FROM projects WHERE deleted_at IS NULL
       ORDER BY CAST(serial_number AS INTEGER) ASC, id ASC`
    ).all();
    return json({ items: result.results });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  try {
    const body = await c.request.json();
    const description = clean(body.description, 5000);
    const client = clean(body.client, 250);
    const period = clean(body.period, 120);
    if (!description || !client || !period) return fail('Description, client and period are required');
    const max = await db(c.env).prepare(
      'SELECT COALESCE(MAX(serial_number), 0) AS last_number FROM projects'
    ).first();
    const serial = Number(max?.last_number || 0) + 1;
    const result = await db(c.env).prepare(
      `INSERT INTO projects(serial_number, description, client, period, status)
       VALUES(?,?,?,?,?)`
    ).bind(serial, description, client, period, 'draft').run();
    return json({ id: result.meta.last_row_id, serial_number: serial }, 201);
  } catch (error) {
    return handleError(error);
  }
}
