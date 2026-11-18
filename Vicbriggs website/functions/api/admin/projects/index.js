import { requireAdmin } from '../../../_lib/auth.js';
import { db, json, fail, handleError } from '../../../_lib/http.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function validDate(month, year) {
  return Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(year) && year >= 1900 && year <= 2200;
}

export async function onRequestGet(c) {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  try {
    const result = await db(c.env).prepare(
      `SELECT id, serial_number, description, client, period, month, year,
              execution_status, status, created_at, updated_at
       FROM projects WHERE deleted_at IS NULL
       ORDER BY CASE WHEN year IS NULL OR month IS NULL THEN 1 ELSE 0 END ASC,
                year DESC, month DESC, id DESC`
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
    const month = Number(body.month);
    const year = Number(body.year);
    const executionStatus = clean(body.execution_status, 30);

    if (!description || !client) return fail('Description and client are required');
    if (!validDate(month, year)) return fail('A valid month and year are required');
    if (!['Completed', 'In Progress'].includes(executionStatus)) {
      return fail('Execution status must be Completed or In Progress');
    }

    const period = `${MONTHS[month - 1]} ${year}`;
    const max = await db(c.env).prepare(
      'SELECT COALESCE(MAX(serial_number), 0) AS last_number FROM projects'
    ).first();
    const serial = Number(max?.last_number || 0) + 1;
    const result = await db(c.env).prepare(
      `INSERT INTO projects(serial_number, description, client, period, month, year, execution_status, status)
       VALUES(?,?,?,?,?,?,?,?)`
    ).bind(serial, description, client, period, month, year, executionStatus, 'draft').run();
    return json({ id: result.meta.last_row_id, serial_number: serial }, 201);
  } catch (error) {
    return handleError(error);
  }
}
