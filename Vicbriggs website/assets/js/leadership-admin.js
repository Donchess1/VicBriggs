"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("profile-form"), portrait = $("portrait"), preview = $("portrait-preview");
  const formStatus = $("form-status"), listStatus = $("list-status"), list = $("profile-list");
  let editing = null;
  let busy = false;
  let profiles = [];
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const MAX_SIZE = 10 * 1024 * 1024;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) }
    });
    let result;
    try { result = await response.json(); } catch { result = {}; }
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }
  function report(node, message, error = false) { node.textContent = message; node.classList.toggle("error", error); }
  function setBusy(value) {
    busy = value;
    $("save-profile").disabled = value;
    $("refresh-profiles").disabled = value;
    $("cancel-edit").disabled = value;
    for (const b of list.querySelectorAll("button")) b.disabled = value;
  }
  function resetEditor() {
    editing = null;
    form.reset();
    preview.hidden = true;
    preview.removeAttribute("src");
    $("form-heading").textContent = "Add leadership profile";
    $("save-profile").textContent = "Save as draft";
    $("cancel-edit").hidden = true;
    $("photo-hint").textContent = "A photograph is required for new profiles. JPG, PNG, WebP or GIF, maximum 10 MB.";
    report(formStatus, "");
  }
  portrait.addEventListener("change", () => {
    preview.hidden = true;
    preview.removeAttribute("src");
    const file = portrait.files[0];
    if (file && allowed.has(file.type)) {
      const url = URL.createObjectURL(file);
      preview.onload = () => URL.revokeObjectURL(url);
      preview.onerror = () => URL.revokeObjectURL(url);
      preview.src = url;
      preview.hidden = false;
    }
  });
  async function uploadPhoto(file) {
    if (!allowed.has(file.type)) throw new Error("Choose a JPG, PNG, WebP or GIF photograph.");
    if (file.size > MAX_SIZE) throw new Error("Photograph exceeds 10 MB.");
    const sig = await api("/api/admin/leadership-signature", { method: "POST", body: "{}" });
    const body = new FormData();
    body.append("file", file);
    for (const key of ["api_key", "timestamp", "folder", "signature"]) body.append(key, String(sig[key]));
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloud_name)}/image/upload`, { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message || "Cloudinary upload failed");
    if (!result.public_id) throw new Error("Cloudinary did not return a photo ID");
    return result.public_id;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(form);
    const file = portrait.files[0];
    if (!editing && !file) { report(formStatus, "Please select a portrait photograph.", true); return; }
    const payload = {
      name: String(data.get("name") || "").trim(),
      designation: String(data.get("designation") || "").trim(),
      group: String(data.get("group") || "management"),
      biography: String(data.get("biography") || "").trim(),
      display_order: Number(data.get("display_order"))
    };
    setBusy(true);
    try {
      if (file) {
        report(formStatus, "Uploading photograph to Cloudinary…");
        payload.photo_public_id = await uploadPhoto(file);
      }
      report(formStatus, editing ? "Saving profile changes…" : "Creating draft profile…");
      await api(editing ? `/api/admin/leadership/${editing.id}` : "/api/admin/leadership", {
        method: editing ? "PATCH" : "POST", body: JSON.stringify(payload)
      });
      const wasEditing = Boolean(editing);
      resetEditor();
      await loadProfiles();
      report(formStatus, wasEditing ? "Profile updated." : "Profile saved as draft. Publish it below when ready.");
    } catch (error) { report(formStatus, error.message, true); }
    finally { setBusy(false); }
  });
  $("cancel-edit").addEventListener("click", resetEditor);
  $("refresh-profiles").addEventListener("click", () => loadProfiles().catch(e => report(listStatus, e.message, true)));

  function editProfile(item) {
    editing = item;
    for (const key of ["name", "designation", "group", "biography", "display_order"]) form.elements.namedItem(key).value = item[key] ?? "";
    portrait.value = "";
    preview.src = item.photo_url;
    preview.hidden = false;
    $("form-heading").textContent = `Edit: ${item.name}`;
    $("save-profile").textContent = "Save changes";
    $("cancel-edit").hidden = false;
    $("photo-hint").textContent = "Leave the photograph empty to keep the existing portrait.";
    report(formStatus, "");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function act(item, method, payload) {
    if (busy) return;
    setBusy(true);
    try {
      await api(`/api/admin/leadership/${item.id}`, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      await loadProfiles();
      report(listStatus, method === "DELETE" ? "Profile removed from the website." : "Profile status updated.");
    } catch (error) { report(listStatus, error.message, true); }
    finally { setBusy(false); }
  }
  function button(text, className, onClick) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = text;
    if (className) b.className = className;
    b.addEventListener("click", onClick); return b;
  }
  function render() {
    list.replaceChildren();
    if (!profiles.length) { list.textContent = "No leadership profiles yet. Add the first one above."; return; }
    for (const item of profiles) {
      const card = document.createElement("article"); card.className = "profile-card";
      const img = document.createElement("img"); img.src = item.photo_url; img.alt = `Portrait of ${item.name}`; img.loading = "lazy";
      const details = document.createElement("div"); details.className = "details";
      const name = document.createElement("h3"); name.textContent = item.name;
      const role = document.createElement("p"); role.textContent = item.designation;
      const meta = document.createElement("p"); meta.className = "meta";
      meta.textContent = `${item.group === "board" ? "Board of Directors" : "Management Team"} · ${item.status} · Order ${item.display_order}`;
      const actions = document.createElement("div"); actions.className = "actions";
      actions.append(
        button("Edit", "secondary", () => editProfile(item)),
        button(item.status === "published" ? "Unpublish" : "Publish", "", () => act(item, "PATCH", { status: item.status === "published" ? "draft" : "published" })),
        button("Remove", "danger", () => {
          if (confirm(`Remove ${item.name} from the leadership directory?`)) act(item, "DELETE");
        })
      );
      details.append(name, role, meta, actions); card.append(img, details); list.append(card);
    }
  }
  async function loadProfiles() {
    const data = await api("/api/admin/leadership");
    profiles = Array.isArray(data.items) ? data.items : [];
    render();
    report(listStatus, `${profiles.length} profile${profiles.length === 1 ? "" : "s"} in the directory.`);
  }
  async function init() {
    try {
      const me = await api("/api/admin/me");
      $("account-status").textContent = `Signed in: ${me.email}`;
      $("manager").hidden = false;
      $("auth-panel").hidden = true;
      try { await loadProfiles(); } catch (error) { report(listStatus, error.message, true); }
    } catch {
      $("manager").hidden = true;
      $("auth-panel").hidden = false;
    }
  }
  init();
})();
