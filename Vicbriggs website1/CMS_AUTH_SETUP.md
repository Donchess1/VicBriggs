# Vicbriggs CMS — Email/password authentication (Cloudflare Pages)

This version replaces Cloudflare Access authentication. Do not configure ACCESS_TEAM_DOMAIN, ACCESS_AUD or ADMIN_EMAIL; they are not used.

## Before deploying
1. Ensure `vicbriggs-cms` D1 is bound as **DB** and Cloudinary credentials are saved in the **Production** Pages environment.
2. Run `migrations/0001_media.sql` if you haven't already, then run **`migrations/0002_admin_auth.sql`** in D1 Console. Running migration 0002 before 0001 is also possible, but both must exist before testing.
3. Generate a one-time random secret **locally** in PowerShell: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))` (on older PowerShell/.NET, use Python: `python -c "import secrets;print(secrets.token_hex(32))"`). Do NOT send the secret in chat.
4. Save the result in Cloudflare Pages **Production** variables as an encrypted secret named **CMS_BOOTSTRAP_TOKEN**. Redeploy after saving bindings/secrets.
5. Deploy this ZIP's contents as the Pages source root, with `functions/` in the Pages source root (not only the static output directory). Existing Cloudinary secrets must remain configured.

## First admin setup
1. Open `https://vicbriggs.pages.dev/admin/setup.html` over HTTPS.
2. Enter your IT Admin email, a unique strong password (14+ characters), and the `CMS_BOOTSTRAP_TOKEN` value. Submit **once**.
3. If successful, **immediately delete `CMS_BOOTSTRAP_TOKEN` from Cloudflare Pages**, remove `admin/setup.html` from your repo, and redeploy. The bootstrap endpoint also refuses further users once any admin exists, but removing the secret closes it entirely.
4. Visit `/admin/`, sign in, and test `/api/admin/me` (should be 401 while logged out, 200 while logged in).
5. Upload a small JPG as draft, then publish; confirm it appears in `/gallery.html`.

## Security implementation
- PBKDF2-HMAC-SHA256 salted password hashes (310,000 iterations) stored in D1; no plaintext passwords.
- Random 256-bit session tokens; only SHA-256 hashes stored in D1; 8-hour sessions in Secure, HttpOnly, SameSite=Strict cookies.
- All admin CRUD routes verify session server-side. Mutations require matching `Origin` header as a CSRF defense.
- Failed logins throttled after five failures for each IP/email pair within 15 minutes. Consider adding Cloudflare WAF rate limits if available; this is not a complete per-IP abuse prevention system.
- `DELETE` is a soft-delete of D1 metadata; Cloudinary original remains.
- **Important**: Admin login is not MFA. Use a unique password and keep Cloudflare/Cloudinary accounts protected with MFA. For a production system, add password reset/recovery, centralized monitoring, and stronger per-IP throttling.

## Deployment note
Cloudflare Pages Git integrations deploy Functions only when `functions/` is at the configured **source root**. If your website is nested, adjust the Pages root directory accordingly. Test on a preview deployment before switching production if possible.
