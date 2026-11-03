import { db, json, handleError } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  try {
    const rows = await db(env).prepare(`
      SELECT id, name, designation, "group", biography, photo_url, display_order
      FROM leadership_profiles
      WHERE status = 'published' AND deleted_at IS NULL
      ORDER BY "group", display_order ASC, id ASC
      LIMIT 200
    `).all();
    return new Response(JSON.stringify({ items: rows.results || [] }), {
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
