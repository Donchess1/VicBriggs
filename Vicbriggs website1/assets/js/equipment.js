(() => {
  "use strict";

  const grid = document.getElementById("equipment-grid");
  const status = document.getElementById("equipment-status");
  const lightbox = document.getElementById("equipment-lightbox");
  const lightboxMedia = document.getElementById("equipment-lightbox-media");
  const lightboxTitle = document.getElementById("equipment-lightbox-title");
  const lightboxDescription = document.getElementById("equipment-lightbox-description");
  const closeButton = document.getElementById("equipment-lightbox-close");

  if (!grid || !status || !lightbox || !lightboxMedia ||
      !lightboxTitle || !lightboxDescription || !closeButton) {
    console.error("Equipment gallery: required page elements are missing.");
    return;
  }

  let lastFocusedElement = null;

  function showMessage(message) {
    grid.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "equipment-empty";
    paragraph.textContent = message;
    grid.appendChild(paragraph);
  }

  function openImage(item) {
    lastFocusedElement = document.activeElement;
    lightboxMedia.replaceChildren();

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title || "Vicbriggs equipment";
    lightboxMedia.appendChild(image);

    lightboxTitle.textContent = item.title || "Vicbriggs equipment";
    lightboxDescription.textContent = item.description || "";
    lightboxDescription.hidden = !item.description;

    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closeImage() {
    lightbox.classList.remove("open");
    lightboxMedia.replaceChildren();
    document.body.style.overflow = "";

    if (lastFocusedElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    }
  }

  function createEquipmentCard(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "equipment-card";
    button.setAttribute("aria-label", `View ${item.title || "equipment photograph"}`);

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title || "Vicbriggs equipment";
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      button.remove();
    };

    const caption = document.createElement("span");
    caption.className = "equipment-card-caption";

    const title = document.createElement("strong");
    title.textContent = item.title || "Vicbriggs equipment";
    caption.appendChild(title);

    if (item.description) {
      const description = document.createElement("span");
      description.textContent = item.description;
      caption.appendChild(description);
    }

    button.append(image, caption);
    button.addEventListener("click", () => openImage(item));
    return button;
  }

  closeButton.addEventListener("click", closeImage);

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeImage();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightbox.classList.contains("open")) {
      closeImage();
    }
  });

  async function loadEquipment() {
    status.textContent = "Loading equipment photographs…";
    grid.replaceChildren();

    try {
      const response = await fetch("/api/gallery?category=Equipment", {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Equipment gallery returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.items)) {
        throw new Error("Invalid equipment gallery response");
      }

      // Equipment page is intentionally image-only.
      const equipment = data.items.filter(item =>
        item &&
        item.category === "Equipment" &&
        item.type === "image" &&
        typeof item.src === "string" &&
        item.src.trim() !== ""
      );

      if (!equipment.length) {
        status.textContent = "";
        showMessage("Equipment photographs will appear here as they are uploaded and published.");
        return;
      }

      status.textContent = "";
      const fragment = document.createDocumentFragment();

      for (const item of equipment) {
        fragment.appendChild(createEquipmentCard(item));
      }

      grid.appendChild(fragment);

    } catch (error) {
      console.error("Equipment gallery failed to load:", error);
      status.textContent = "";
      showMessage("Equipment photographs could not be loaded at the moment. Please try again later.");
    }
  }

  loadEquipment();
})();
