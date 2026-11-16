(() => {
  "use strict";
  const status = document.getElementById("projects-status");
  const tbody = document.getElementById("projects-table-body");
  const mobile = document.getElementById("projects-mobile-list");
  if (!status || !tbody || !mobile) return;

  function cell(text) {
    const td = document.createElement("td");
    td.textContent = text ?? "";
    return td;
  }

  async function loadProjects() {
    status.textContent = "Loading project register…";
    tbody.replaceChildren();
    mobile.replaceChildren();
    try {
      const response = await fetch("/api/projects", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Invalid project register response");
      if (!data.items.length) {
        status.textContent = "Project information will be published here as records are approved.";
        return;
      }
      status.textContent = "";
      for (const item of data.items) {
        const tr = document.createElement("tr");
        tr.append(cell(item.serial_number), cell(item.description), cell(item.client), cell(item.period));
        tbody.appendChild(tr);

        const card = document.createElement("article");
        card.className = "project-mobile-card";
        const heading = document.createElement("h3");
        heading.textContent = `Project ${item.serial_number}`;
        card.appendChild(heading);
        for (const [label, value] of [
          ["Description of activities", item.description],
          ["Client", item.client],
          ["Period of execution", item.period]
        ]) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = label;
          p.append(strong, document.createTextNode(value || ""));
          card.appendChild(p);
        }
        mobile.appendChild(card);
      }
    } catch (error) {
      console.error("Project register failed to load:", error);
      status.textContent = "The project register could not be loaded at the moment. Please try again later.";
    }
  }
  loadProjects();
})();
