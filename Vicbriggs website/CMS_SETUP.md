# Vicbriggs Site Editor — Cloudflare Pages + D1 + Cloudinary

## What this package does
- Retains all existing pages, gallery, photos and videos.
- Adds `/admin/` dashboard to upload images/videos directly to Cloudinary, then create draft records in D1.
- Adds publish/unpublish, metadata edit and soft-delete. Cloudinary originals are retained on deletion.
- Public gallery combines published D1 media with the legacy static gallery. Existing static items are **not** editable from the dashboard until migrated.

## 1. Deploy location
Upload/deploy **the contents of this ZIP as the Cloudflare Pages project root**, or set your Git build output directory to the folder containing `index.html`, `functions/`, and `assets/`.
**Important:** Cloudflare Pages Functions are deployed from the `functions/` directory in the project **source root**, not merely from an arbitrary static build output folder. If your Git repository has nested site files, put `functions/` at the configured Pages **root directory**, and configure the output directory to point to the static site. Easiest: move the website files and `functions/` together to the repository root, use build command `exit 0` and output directory `.`. For dashboard build settings, do not use Workers static-assets-only deployment.

## 2. D1 schema
Run `migrations/0001_media.sql` in Cloudflare Dashboard → D1 → vicbriggs-cms → Console, or via Wrangler `npx wrangler d1 execute vicbriggs-cms --remote --file=migrations/0001_media.sql`.
Bind the D1 database to Cloudflare Pages project `vicbriggs` under Settings → Bindings with variable name **DB**. Redeploy after adding bindings.

## 3. Cloudinary credentials
Under Cloudflare Pages → Settings → Variables and Secrets, configure:
- `CLOUDINARY_CLOUD_NAME` = Cloudinary cloud name (not secret)
- `CLOUDINARY_API_KEY` = Cloudinary API key (server-side)
- `CLOUDINARY_API_SECRET` = Cloudinary API secret (**encrypted secret**)
Never put the secret in HTML or frontend JavaScript. No unsigned upload preset is needed.

## 4. Email/password authentication (no Cloudflare Access)
See **CMS_AUTH_SETUP.md** for the new migration, bootstrap secret, and first login instructions. Cloudflare Access is no longer used.

## 5. Cloudinary allowed origins
Cloudinary's signed upload endpoint is called directly by the browser. Ensure the account's upload settings allow browser-origin uploads from your deployed domain. Check upload size limits and account quotas, especially for videos. This sample uses normal single-request uploads, not chunked upload; large videos may need a future chunked-upload implementation.

## 6. Smoke tests
1. Visit `/api/gallery` — expect `{ "items": [] }` initially.
2. Visit `/admin/` as an unauthorized user — the login form appears; `/api/admin/me` returns HTTP 401 without a session.
3. Log in as the IT Admin; `/api/admin/me` should show the approved email.
4. Upload one small JPG. It appears as **draft** in the dashboard, not on the public gallery.
5. Publish it; reload `/gallery.html` and verify it appears.
6. Edit the title, unpublish, and remove to test CRUD.

## Notes
- Public gallery intentionally retains existing static entries as a fallback. Two missing image references in the original static data (`leadership.jpg`, `facility.jpg`) are replaced with a local fallback image in the viewer.
- For a complete migration to CMS-only gallery, first upload the original static files to Cloudinary and publish them, then remove the `gallery-data.js` include.
- Deletion is soft-delete in D1, not permanent Cloudinary deletion.
- For operational use, add upload rate limits, Cloudinary quota monitoring, audit logs, and a more comprehensive upload policy.
- The project uses only native browser APIs and Cloudflare Pages Functions; no npm dependencies required.
