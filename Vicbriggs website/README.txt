VICBRIGGS NIGERIA LIMITED — COMPLETE STATIC WEBSITE
===================================================

START
1. Extract this ZIP.
2. Open the Vicbriggs_Website_Complete folder in VS Code.
3. Open index.html with the Live Server extension (right-click > Open with Live Server), or double-click index.html.
4. Edit content in the corresponding HTML pages. CSS is assets/css/style.css.

PAGES
index.html, about.html, services.html, projects.html, equipment.html, hse.html, gallery.html, contact.html

ADD A NEW GALLERY PHOTO
1. Copy your JPG/PNG into assets/images/ (example: new-project.jpg).
2. Open assets/js/gallery-data.js.
3. Add a new item INSIDE the array before the final closing bracket, separated by a comma:
   {"src":"assets/images/new-project.jpg","title":"New project title","category":"Civil","type":"image"}
4. Refresh gallery.html. Existing categories are automatically detected; you may invent a new one.

ADD A NEW GALLERY VIDEO
1. Copy an MP4 into assets/videos/ (example: new-video.mp4).
2. Copy a thumbnail into assets/images/ (example: new-video-cover.jpg).
3. Add to assets/js/gallery-data.js:
   {"src":"assets/videos/new-video.mp4","poster":"assets/images/new-video-cover.jpg","title":"Project video","category":"Video","type":"video"}
4. Refresh gallery.html.

CONTACT FORM
The form currently uses mailto: and requires a configured email client. It is not a backend form and does not store submissions. For production, connect it to a secure form endpoint or service.

BEFORE GOING LIVE
- Confirm exact corporate name, approved claims, certifications, contact numbers and office address.
- Replace or approve the supplied logo and photo selections.
- Obtain authorization to publish client logos or identifiable project/client information.
- Check video file size; consider compression for web performance.
- Deploy all files together to any static web host.

The gallery photos and video are real media supplied during the conversation. Images may be cropped/resized for web delivery. Fonts load from Google Fonts, with system fallbacks.
