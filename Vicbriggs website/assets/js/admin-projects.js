(() => {
  "use strict";
  const form = document.getElementById("project-form");
  const list = document.getElementById("projects-admin-list");
  const status = document.getElementById("project-status");
  if (!form || !list || !status) return;

  const fields = ["description", "client"];
  const input = name => form.elements.namedItem(name);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  function periodFor(item) {
    if (item.month && item.year) return `${monthNames[Number(item.month) - 1]} ${item.year}`;
    return item.period || "Date not supplied";
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
        const heading = document.createElement("h3");
        heading.textContent = `S/N ${index + 1} — ${item.client}`;
        const detail = document.createElement("p");
        detail.textContent = `${item.description} | ${periodFor(item)} | ${item.execution_status || "Execution status not supplied"}`;
        const state = document.createElement("span");
        state.className = "pill";
        state.textContent = `Publication: ${item.status}`;
        const actions = document.createElement("div");
        actions.className = "actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
          input("id").value = item.id;
          input("description").value = item.description || "";
          input("client").value = item.client || "";
          input("month").value = item.month || "";
          input("year").value = item.year || "";
          input("execution_status").value = item.execution_status || "";
          form.querySelector("#project-save").textContent = "Update project";
          form.querySelector("#project-cancel").hidden = false;
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        });

        const publish = document.createElement("button");
        publish.type = "button";
        publish.textContent = item.status === "published" ? "Unpublish" : "Publish";
        publish.addEventListener("click", async () => {
          publish.disabled = true;
          try {
            await request(`/api/admin/projects/${item.id}`, {
              method: "PATCH",
              body: JSON.stringify({ status: item.status === "published" ? "draft" : "published" })
            });
            await load();
          } catch (error) {
            alert(error.message);
          } finally {
            publish.disabled = false;
          }
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "danger";
        remove.textContent = "Remove";
        remove.addEventListener("click", async () => {
          if (!confirm(`Remove project ${index + 1}?`)) return;
          remove.disabled = true;
          try {
            await request(`/api/admin/projects/${item.id}`, { method: "DELETE" });
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
    // Blank structured fields on an older record mean "leave the historical value unknown".
    // New records are still validated by the API and must supply all three fields.
    if (input("month").value && input("year").value) {
      payload.month = input("month").value;
      payload.year = input("year").value;
    }
    if (input("execution_status").value) {
      payload.execution_status = input("execution_status").value;
    }
    button.disabled = true;
    status.textContent = id ? "Updating project…" : "Saving project…";
    try {
      await request(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      status.textContent = id ? "Project updated." : "Project saved as draft.";
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
