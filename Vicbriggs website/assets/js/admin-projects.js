(() => {
  "use strict";
  const form = document.getElementById("project-form");
  const list = document.getElementById("projects-admin-list");
  const status = document.getElementById("project-status");
  if (!form || !list || !status) return;

  const fields = ["description", "client", "period"];
  const input = name => form.elements.namedItem(name);

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function resetForm() {
    form.reset();
    input("id").value = "";
    form.querySelector("#project-save").textContent = "Save project";
    form.querySelector("#project-cancel").hidden = true;
  }

  
async function load() {
  list.textContent = "Loading saved projects…";

  try {
    const data = await request("/api/admin/projects");

    list.replaceChildren();

    if (!data.items?.length) {
      list.textContent = "No project records have been entered yet.";
      return;
    }

    data.items.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = "media";

      const body = document.createElement("div");
      body.className = "body";

      // Automatically generated display serial number
      const serialNumber = index + 1;

      const heading = document.createElement("h3");
      heading.textContent = `S/N ${serialNumber} — ${item.client}`;

      const detail = document.createElement("p");
      detail.textContent = `${item.description} | ${item.period}`;

      const state = document.createElement("span");
      state.className = "pill";
      state.textContent = item.status;

      const actions = document.createElement("div");
      actions.className = "actions";

      // Edit project
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";

      edit.addEventListener("click", () => {
        input("id").value = item.id;

        for (const field of fields) {
          input(field).value = item[field] || "";
        }

        form.querySelector("#project-save").textContent = "Update project";
        form.querySelector("#project-cancel").hidden = false;

        form.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });

      // Publish / Unpublish project
      const publish = document.createElement("button");
      publish.type = "button";
      publish.textContent =
        item.status === "published" ? "Unpublish" : "Publish";

      publish.addEventListener("click", async () => {
        publish.disabled = true;

        try {
          await request(`/api/admin/projects/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              status: item.status === "published" ? "draft" : "published"
            })
          });

          await load();

        } catch (error) {
          alert(error.message);

        } finally {
          publish.disabled = false;
        }
      });

      // Remove project
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Remove";

      remove.addEventListener("click", async () => {
        if (!confirm(`Remove project ${serialNumber}?`)) {
          return;
        }

        remove.disabled = true;

        try {
          await request(`/api/admin/projects/${item.id}`, {
            method: "DELETE"
          });

          await load();

        } catch (error) {
          alert(error.message);

        } finally {
          remove.disabled = false;
        }
      });

      actions.append(edit, publish, remove);

      body.append(heading, detail, state, actions);
      article.appendChild(body);
      list.appendChild(article);
    });

  } catch (error) {
    list.textContent = `Could not load projects: ${error.message}`;
  }
}


  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("#project-save");
    const id = input("id").value;
    const payload = Object.fromEntries(fields.map(field => [field, input(field).value.trim()]));
    button.disabled = true;
    status.textContent = id ? "Updating project…" : "Saving project…";
    try {
      await request(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      status.textContent = id ? "Project updated.": "Project saved as draft.";
      resetForm();
      await load();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  form.querySelector("#project-cancel").addEventListener("click", resetForm);
  document.getElementById("projects-refresh").addEventListener("click", load);
  document.addEventListener("admin-ready", load);
})();
