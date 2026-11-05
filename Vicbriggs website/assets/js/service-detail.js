
(async () => {
  "use strict";

  const grid = document.getElementById("service-media-grid");
  const status = document.getElementById("service-media-status");
  const lightbox = document.getElementById("service-lightbox");
  const lightboxMedia = document.getElementById("service-lightbox-media");
  const lightboxTitle = document.getElementById("service-lightbox-title");
  const closeButton = document.getElementById("service-lightbox-close");

  if (!grid || !status || !lightbox || !lightboxMedia || !lightboxTitle || !closeButton) return;

  let lastFocused = null;
  const serviceCategory = document.body.dataset.serviceCategory || "Civil";
  const serviceName = document.body.dataset.serviceName || "Civil";

  function videoPoster(item) {
    if (item.poster) return item.poster;
    if (!item.src) return "";
    try {
      const url = new URL(item.src, window.location.href);
      if (!url.hostname.endsWith(".cloudinary.com") || !url.pathname.includes("/video/upload/")) return "";
      url.pathname = url.pathname.replace("/video/upload/", "/video/upload/so_2/");
      url.pathname = url.pathname.replace(/\.[^/.]+$/, ".jpg");
      return url.toString();
    } catch (_) {
      return "";
    }
  }

  function showMedia(item) {
    lastFocused = document.activeElement;
    lightboxMedia.replaceChildren();

    let media;
    if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.src;
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
      media.preload = "metadata";
      const poster = videoPoster(item);
      if (poster) media.poster = poster;
    } else {
      media = document.createElement("img");
      media.src = item.src;
      media.alt = item.title || "Vicbriggs service media";
    }

    lightboxMedia.appendChild(media);
    lightboxTitle.textContent = item.title || "Vicbriggs";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closeMedia() {
    const video = lightboxMedia.querySelector("video");
    if (video) video.pause();
    lightbox.classList.remove("open");
    lightboxMedia.replaceChildren();
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  closeButton.addEventListener("click", closeMedia);
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeMedia();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightbox.classList.contains("open")) closeMedia();
  });

  try {
    const response = await fetch(`/api/gallery?category=${encodeURIComponent(serviceCategory)}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Gallery API returned HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error("Invalid gallery response");

    const items = data.items.filter(item =>
      item && typeof item.src === "string" && item.src.trim() &&
      ["image", "video"].includes(item.type)
    );

    if (!items.length) {
      status.textContent = `There are no published ${serviceName} media items available yet. Please check back soon.`;
      return;
    }

    status.textContent = "";
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-item";
      button.setAttribute("aria-label", `Open ${item.title || "media"}`);

      const image = document.createElement("img");
      image.loading = "lazy";
      image.alt = item.title || `Vicbriggs ${serviceName} media`;
      image.src = item.type === "video" ? videoPoster(item) : item.src;
      image.onerror = () => {
        image.onerror = null;
        image.removeAttribute("src");
        image.alt = "Preview unavailable";
      };

      const caption = document.createElement("span");
      caption.className = "gallery-caption";
      caption.textContent = item.title || "Vicbriggs project media";

      const category = document.createElement("small");
      category.textContent = item.type === "video" ? "Civil • ▶ Watch video" : "Civil";
      caption.appendChild(category);

      button.append(image, caption);
      button.addEventListener("click", () => showMedia(item));
      fragment.appendChild(button);
    }

    grid.appendChild(fragment);
  } catch (error) {
    console.error("Service media loading failed:", error);
    status.textContent = "The media gallery could not be loaded at the moment. Please try again later.";
  }
})();
