
(async () => {
    "use strict";

    const grid = document.querySelector("#gallery-grid");
    const filters = document.querySelector("#gallery-filters");
    const lightbox = document.querySelector("#lightbox");
    const lightboxMedia = document.querySelector("#lightbox-media");
    const lightboxTitle = document.querySelector("#lightbox-title");
    const closeButton = document.querySelector(".lightbox-close");

    if (
        !grid ||
        !filters ||
        !lightbox ||
        !lightboxMedia ||
        !lightboxTitle ||
        !closeButton
    ) {
        console.error("Gallery: required HTML elements are missing.");
        return;
    }

    let items = [];
    let activeCategory = "All";
    let lastFocusedElement = null;

    // --------------------------------------------------
    // Cloudinary video thumbnail
    // --------------------------------------------------

    function getVideoThumbnail(item) {
        if (item.poster && item.poster.trim()) {
            return item.poster;
        }

        if (!item.src) return "";

        try {
            const url = new URL(item.src, window.location.href);

            // Only transform actual Cloudinary video URLs.
            if (
                !url.hostname.endsWith(".cloudinary.com") ||
                !url.pathname.includes("/video/upload/")
            ) {
                return "";
            }

            // Extract a frame at approximately 2 seconds.
            url.pathname = url.pathname.replace(
                "/video/upload/",
                "/video/upload/so_2/"
            );

            // Request a JPEG thumbnail instead of video.
            url.pathname = url.pathname.replace(
                /\.[^/.]+$/,
                ".jpg"
            );

            return url.toString();

        } catch (error) {
            console.warn("Could not generate video thumbnail:", error);
            return "";
        }
    }

    // --------------------------------------------------
    // Empty state and messages
    // --------------------------------------------------

    function showMessage(message) {
        grid.replaceChildren();

        const paragraph = document.createElement("p");
        paragraph.className = "gallery-empty";
        paragraph.textContent = message;

        grid.appendChild(paragraph);
    }

    // --------------------------------------------------
    // Gallery category filters
    // --------------------------------------------------

    function renderFilters() {
        const categories = [
            "All",
            ...new Set(
                items
                    .map(item => item.category)
                    .filter(Boolean)
            )
        ];

        filters.replaceChildren();

        for (const category of categories) {
            const button = document.createElement("button");

            button.type = "button";
            button.className =
                "filter" +
                (category === activeCategory ? " active" : "");

            button.dataset.filter = category;
            button.textContent = category;

            filters.appendChild(button);
        }
    }

    // --------------------------------------------------
    // Create gallery card
    // --------------------------------------------------

    function createGalleryCard(item) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-item";

        const image = document.createElement("img");

        const thumbnail = item.type === "video"
            ? getVideoThumbnail(item)
            : item.src;

        image.alt = item.title || "Vicbriggs media";
        image.loading = "lazy";

        if (thumbnail) {
            image.src = thumbnail;
        } else {
            image.alt = "Preview unavailable";
        }

        // Avoid repeatedly showing one default image.
        image.onerror = () => {
            image.onerror = null;
            image.removeAttribute("src");
            image.alt = "Preview unavailable";
        };

        const caption = document.createElement("span");
        caption.className = "gallery-caption";
        caption.textContent = item.title || "Untitled media";

        const category = document.createElement("small");

        category.textContent =
            (item.category || "General") +
            (item.type === "video"
                ? " • ▶ Watch video"
                : "");

        caption.appendChild(category);

        button.append(image, caption);

        button.addEventListener("click", () => {
            openMedia(item);
        });

        return button;
    }

    // --------------------------------------------------
    // Render gallery
    // --------------------------------------------------

    function renderGallery() {
        grid.replaceChildren();

        const visibleItems = items.filter(item => {
            return (
                activeCategory === "All" ||
                item.category === activeCategory
            );
        });

        if (visibleItems.length === 0) {
            showMessage(
                "No published media available in this category yet."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const item of visibleItems) {
            fragment.appendChild(createGalleryCard(item));
        }

        grid.appendChild(fragment);
    }

    // --------------------------------------------------
    // Category click handling
    // --------------------------------------------------

    filters.addEventListener("click", event => {
        const button = event.target.closest("[data-filter]");

        if (!button || !filters.contains(button)) return;

        activeCategory = button.dataset.filter;

        renderFilters();
        renderGallery();
    });

    // --------------------------------------------------
    // Lightbox
    // --------------------------------------------------

    function openMedia(item) {
        lastFocusedElement = document.activeElement;

        lightboxMedia.replaceChildren();

        let element;

        if (item.type === "video") {
            element = document.createElement("video");

            element.src = item.src;
            element.controls = true;
            element.autoplay = true;
            element.playsInline = true;
            element.preload = "metadata";

            const poster = getVideoThumbnail(item);

            if (poster) {
                element.poster = poster;
            }

        } else {
            element = document.createElement("img");
            element.src = item.src;
            element.alt = item.title || "Vicbriggs gallery image";
        }

        lightboxMedia.appendChild(element);

        lightboxTitle.textContent =
            item.title || "Vicbriggs Gallery";

        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";

        closeButton.focus();
    }

    function closeLightbox() {
        const video = lightboxMedia.querySelector("video");

        if (video) {
            video.pause();
        }

        lightbox.classList.remove("open");
        lightboxMedia.replaceChildren();

        document.body.style.overflow = "";

        if (lastFocusedElement?.isConnected) {
            lastFocusedElement.focus();
        }
    }

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            lightbox.classList.contains("open")
        ) {
            closeLightbox();
        }
    });

    // --------------------------------------------------
    // Fetch published media from Cloudflare D1 API
    // --------------------------------------------------

    async function loadGallery() {
        showMessage("Loading gallery...");

        try {
            const response = await fetch("/api/gallery", {
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    `Gallery API returned HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data.items)) {
                throw new Error("Invalid gallery API response");
            }

            // Cloudflare API already filters unpublished
            // and soft-deleted records.
            items = data.items.filter(item => {
                return (
                    item &&
                    typeof item.src === "string" &&
                    item.src.trim() !== "" &&
                    ["image", "video"].includes(item.type)
                );
            });

            activeCategory = "All";

            renderFilters();
            renderGallery();

        } catch (error) {
            console.error("Gallery loading failed:", error);

            filters.replaceChildren();

            showMessage(
                "Unable to load the gallery. Please try again later."
            );
        }
    }

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------

    await loadGallery();

})();
