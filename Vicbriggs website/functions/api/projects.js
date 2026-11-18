import { db, handleError } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  try {
    const result = await db(env).prepare(
      `SELECT id, serial_number, description, client, period, month, year, execution_status
       FROM projects
       WHERE status = 'published' AND deleted_at IS NULL
       ORDER BY CASE WHEN year IS NULL OR month IS NULL THEN 1 ELSE 0 END ASC,
                year DESC, month DESC, id DESC`
    ).all();
    return new Response(JSON.stringify({ items: result.results }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=60',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
