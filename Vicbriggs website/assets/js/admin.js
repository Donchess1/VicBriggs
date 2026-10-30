"use strict";

const library = document.querySelector("#library");
const who = document.querySelector("#who");
const form = document.querySelector("#upload-form");
const status = document.querySelector("#upload-status");
const fileInput = document.querySelector("#files");
const fileCount = document.querySelector("#file-count");
const progress = document.querySelector("#upload-progress");
const uploadResults = document.querySelector("#upload-results");
const uploadButton = document.querySelector("#upload-button");
const selectAll = document.querySelector("#select-all-media");
const selectionCount = document.querySelector("#selection-count");
const publishSelected = document.querySelector("#publish-selected");
const unpublishSelected = document.querySelector("#unpublish-selected");
const bulkStatus = document.querySelector("#bulk-status");
const selectedIds = new Set();
let mediaItems = [];
let busy = false;

const allowedTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"
]);

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...options.headers
    }
  });
  let data;
  try { data = await response.json(); }
  catch { data = { error: "Invalid server response" }; }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function init() {
  try {
    const me = await api("/api/admin/me");
    who.textContent = `Signed in: ${me.email}`;
    document.querySelector("#login-panel").hidden = true;
    document.querySelector("#editor").hidden = false;
    try { await load(); }
    catch (error) { bulkStatus.textContent = `Could not load media library: ${error.message}`; }
  } catch {
    document.querySelector("#login-panel").hidden = false;
    document.querySelector("#editor").hidden = true;
  }
}

function updateSelection() {
  const valid = new Set(mediaItems.map(item => String(item.id)));
  for (const id of selectedIds) if (!valid.has(id)) selectedIds.delete(id);
  const count = selectedIds.size;
  selectionCount.textContent = `${count} selected`;
  publishSelected.disabled = busy || count === 0;
  unpublishSelected.disabled = busy || count === 0;
  selectAll.disabled = busy || mediaItems.length === 0;
  selectAll.checked = mediaItems.length > 0 && mediaItems.every(x => selectedIds.has(String(x.id)));
  selectAll.indeterminate = count > 0 && !selectAll.checked;
}

async function load() {
  const data = await api("/api/admin/media");
  mediaItems = Array.isArray(data.items) ? data.items : [];
  library.replaceChildren();
  if (!mediaItems.length) {
    library.textContent = "No uploaded media yet.";
    updateSelection();
    return;
  }
  for (const item of mediaItems) {
    const card = document.createElement("article");
    card.className = "media";
    const image = document.createElement("img");
    image.src = item.poster_url || item.asset_url;
    image.alt = item.title;
    image.loading = "lazy";
    const body = document.createElement("div");
    body.className = "body";

    const selectionLabel = document.createElement("label");
    selectionLabel.className = "checkline";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedIds.has(String(item.id));
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedIds.add(String(item.id));
      else selectedIds.delete(String(item.id));
      updateSelection();
    });
    selectionLabel.append(checkbox, document.createTextNode(" Select for bulk action"));

    const title = document.createElement("input");
    title.value = item.title;
    title.maxLength = 150;
    const category = document.createElement("input");
    category.value = item.category;
    category.maxLength = 80;
    const description = document.createElement("textarea");
    description.value = item.description || "";
    description.maxLength = 1000;
    description.rows = 2;
    const state = document.createElement("span");
    state.className = "pill";
    state.textContent = item.status;
    const actions = document.createElement("div");
    actions.className = "actions";
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Save edits";
    const publish = document.createElement("button");
    publish.type = "button";
    publish.textContent = item.status === "published" ? "Unpublish" : "Publish";
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Remove";
    del.className = "danger";

    save.onclick = async () => {
      save.disabled = true;
      try {
        await api(`/api/admin/media/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: title.value, category: category.value, description: description.value })
        });
        await load();
      } catch (error) { alert(error.message); }
      finally { save.disabled = false; }
    };
    publish.onclick = async () => {
      publish.disabled = true;
      try {
        await api(`/api/admin/media/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: item.status === "published" ? "draft" : "published" })
        });
        await load();
      } catch (error) { alert(error.message); }
      finally { publish.disabled = false; }
    };
    del.onclick = async () => {
      if (!confirm("Remove this item from the gallery? The Cloudinary original is retained.")) return;
      del.disabled = true;
      try {
        await api(`/api/admin/media/${item.id}`, { method: "DELETE" });
        selectedIds.delete(String(item.id));
        await load();
      } catch (error) { alert(error.message); }
      finally { del.disabled = false; }
    };
    actions.append(save, publish, del);
    for (const [name, element] of [["Title", title], ["Category", category], ["Description", description]]) {
      const label = document.createElement("label");
      label.textContent = name;
      label.append(element);
      body.append(label);
    }
    body.prepend(selectionLabel);
    body.append(state, actions);
    card.append(image, body);
    library.append(card);
  }
  updateSelection();
}

function titleFromFile(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150) || "Untitled media";
}

fileInput.addEventListener("change", () => {
  const n = fileInput.files.length;
  fileCount.textContent = n ? `${n} file${n === 1 ? "" : "s"} selected` : "No files selected.";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;
  const files = Array.from(fileInput.files);
  if (!files.length) { status.textContent = "Select at least one file."; return; }
  const formData = new FormData(form);
  const category = String(formData.get("category") || "Projects");
  const description = String(formData.get("description") || "");
  const singleTitle = String(formData.get("title") || "").trim();
  let success = 0, failed = 0;
  busy = true;
  uploadButton.disabled = true;
  fileInput.disabled = true;
  updateSelection();
  uploadResults.replaceChildren();
  progress.hidden = false;
  progress.max = files.length;
  progress.value = 0;
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      status.textContent = `Uploading ${i + 1} of ${files.length}: ${file.name}`;
      const result = document.createElement("p");
      try {
        if (!allowedTypes.has(file.type)) throw new Error("Unsupported file type");
        const type = file.type.startsWith("video/") ? "video" : "image";
        const signature = await api("/api/admin/signature", {
          method: "POST", body: JSON.stringify({ resource_type: type })
        });
        const payload = new FormData();
        payload.append("file", file);
        payload.append("api_key", signature.api_key);
        payload.append("timestamp", String(signature.timestamp));
        payload.append("folder", signature.folder);
        payload.append("signature", signature.signature);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloud_name)}/${type}/upload`,
          { method: "POST", body: payload }
        );
        let asset;
        try { asset = await response.json(); }
        catch { throw new Error(`Cloudinary returned HTTP ${response.status}`); }
        if (!response.ok) throw new Error(asset.error?.message || "Cloudinary upload failed");
        const title = files.length === 1 && singleTitle ? singleTitle.slice(0, 150) : titleFromFile(file.name);
        await api("/api/admin/media", {
          method: "POST",
          body: JSON.stringify({ title, description, category, public_id: asset.public_id, media_type: type })
        });
        success++;
        result.textContent = `✓ ${file.name} — saved as draft`;
        result.className = "upload-success";
      } catch (error) {
        failed++;
        result.textContent = `✗ ${file.name} — ${error.message}`;
        result.className = "upload-failure";
        console.error("Upload failed:", file.name, error);
      }
      uploadResults.append(result);
      progress.value = i + 1;
    }
    status.textContent = `Finished: ${success} saved, ${failed} failed.`;
    if (failed === 0) {
      form.reset();
      fileCount.textContent = "No files selected.";
    }
    try { await load(); }
    catch (error) { status.textContent += ` Media list refresh failed: ${error.message}`; }
  } finally {
    busy = false;
    uploadButton.disabled = false;
    fileInput.disabled = false;
    updateSelection();
  }
});

selectAll.addEventListener("change", () => {
  if (selectAll.checked) mediaItems.forEach(x => selectedIds.add(String(x.id)));
  else selectedIds.clear();
  library.querySelectorAll('.checkline input[type="checkbox"]').forEach(checkbox => { checkbox.checked = selectAll.checked; });
  updateSelection();
});

async function changeSelectedStatus(nextStatus) {
  if (busy || !selectedIds.size) return;
  const targets = mediaItems.filter(x => selectedIds.has(String(x.id)) && x.status !== nextStatus);
  if (!targets.length) { bulkStatus.textContent = `Selected media already ${nextStatus}.`; return; }
  if (!confirm(`${nextStatus === "published" ? "Publish" : "Unpublish"} ${targets.length} selected media item(s)?`)) return;
  busy = true;
  updateSelection();
  let success = 0, failed = 0;
  try {
    for (const [index, item] of targets.entries()) {
      bulkStatus.textContent = `Updating ${index + 1} of ${targets.length}...`;
      try {
        await api(`/api/admin/media/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
        success++;
      } catch (error) {
        failed++;
        console.error("Bulk status update failed:", item.id, error);
      }
    }
    bulkStatus.textContent = `${success} updated, ${failed} failed.`;
    selectedIds.clear();
    try { await load(); }
    catch (error) { bulkStatus.textContent += ` Refresh failed: ${error.message}`; }
  } finally {
    busy = false;
    updateSelection();
  }
}

publishSelected.addEventListener("click", () => changeSelectedStatus("published"));
unpublishSelected.addEventListener("click", () => changeSelectedStatus("draft"));
document.querySelector("#refresh").addEventListener("click", () => load().catch(error => alert(error.message)));

document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const loginForm = event.currentTarget;
  const button = loginForm.querySelector("button");
  const message = document.querySelector("#login-status");
  button.disabled = true;
  message.textContent = "Signing in…";
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginForm.elements.namedItem("email").value,
        password: loginForm.elements.namedItem("password").value
      })
    });
    loginForm.reset();
    message.textContent = "";
    await init();
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});

document.querySelector("#logout").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST", body: "{}" }); }
  finally { location.reload(); }
});

init();
