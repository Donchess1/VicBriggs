VICBRIGGS - LEADERSHIP NAVIGATION UPDATE

This patch is based on the uploaded Vicbriggs website(4).zip.

Copy the 9 HTML files and assets/css/style.css into the SAME relative locations in your existing Vicbriggs website directory.
Do NOT replace the project root with an admin page. No admin or backend files are changed.

Changes:
- About Us expandable menu with Our Company and Board & Management links on all public pages.
- Mobile navigation works with the existing menu-toggle/main.js; no JavaScript changes.
- Active About Us state on About and Leadership pages.
- Removed duplicate Board & Management footer link on leadership.html.

Deploy from Git repository root:
 git add "Vicbriggs website/*.html" "Vicbriggs website/assets/css/style.css"
 git commit -m "feat: add leadership to About Us navigation"
 git push origin main

Verify /, /about, /leadership on desktop and mobile. Open About Us to reveal the links.
