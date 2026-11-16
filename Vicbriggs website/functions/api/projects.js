import { db, handleError } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  try {
    const result = await db(env).prepare(
      `SELECT id, serial_number, description, client, period
       FROM projects
       WHERE status = 'published' AND deleted_at IS NULL
       ORDER BY CAST(serial_number AS INTEGER) ASC, id ASC`
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
