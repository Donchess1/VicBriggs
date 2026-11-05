import { db, handleError } from '../_lib/http.js';

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const category = (url.searchParams.get('category') || '').trim();

        let query = db(env).prepare(
            `SELECT id, title, description, category, media_type, asset_url, poster_url
             FROM media
             WHERE status = 'published'
               AND deleted_at IS NULL
             ORDER BY display_order DESC, id DESC
             LIMIT 500`
        );

        if (category) {
            query = db(env).prepare(
                `SELECT id, title, description, category, media_type, asset_url, poster_url
                 FROM media
                 WHERE status = 'published'
                   AND deleted_at IS NULL
                   AND category = ?
                 ORDER BY display_order DESC, id DESC
                 LIMIT 500`
            ).bind(category);
        }

        const rows = await query.all();

        return new Response(
            JSON.stringify({
                items: rows.results.map(item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    type: item.media_type,
                    src: item.asset_url,
                    poster: item.poster_url
                }))
            }),
            {
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'public, max-age=60',
                    'x-content-type-options': 'nosniff'
                }
            }
        );
    } catch (error) {
        return handleError(error);
    }
}
