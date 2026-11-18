
(() => {
  "use strict";

  const status = document.getElementById("projects-status");
  const tbody = document.getElementById("projects-table-body");
  const mobile = document.getElementById("projects-mobile-list");

  if (!status || !tbody || !mobile) return;

  const PROJECTS_PER_PAGE = 10;

  let allProjects = [];
  let currentPage = 1;

  // Create pagination elements if they are not already in projects.html.
  function getOrCreatePagination() {
    let pagination = document.getElementById("projects-pagination");
    let pageNumbers = document.getElementById("projects-page-numbers");
    let previousButton = document.getElementById("projects-prev");
    let nextButton = document.getElementById("projects-next");
    let pageInfo = document.getElementById("projects-page-info");

    if (!pagination) {
      pagination = document.createElement("div");
      pagination.id = "projects-pagination";
      pagination.className = "projects-pagination";
      pagination.setAttribute("aria-label", "Project pages");

      mobile.insertAdjacentElement("afterend", pagination);
    }

    if (!previousButton) {
      previousButton = document.createElement("button");
      previousButton.type = "button";
      previousButton.id = "projects-prev";
      previousButton.textContent = "Previous";
      pagination.appendChild(previousButton);
    }

    if (!pageNumbers) {
      pageNumbers = document.createElement("div");
      pageNumbers.id = "projects-page-numbers";
      pageNumbers.className = "projects-page-numbers";
      pagination.insertBefore(pageNumbers, nextButton || null);
    }

    if (!nextButton) {
      nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.id = "projects-next";
      nextButton.textContent = "Next";
      pagination.appendChild(nextButton);
    }

    if (!pageInfo) {
      pageInfo = document.createElement("p");
      pageInfo.id = "projects-page-info";
      pageInfo.className = "projects-page-info";
      pageInfo.setAttribute("aria-live", "polite");
      pagination.insertAdjacentElement("afterend", pageInfo);
    }

    return {
      pagination,
      pageNumbers,
      previousButton,
      nextButton,
      pageInfo
    };
  }

  const controls = getOrCreatePagination();

  function cell(text) {
    const td = document.createElement("td");
    td.textContent = text ?? "";
    return td;
  }

  function renderDesktopProject(item, serialNumber) {
  const tr = document.createElement("tr");

  tr.append(
    cell(serialNumber),
    cell(item.description),
    cell(item.client),
    cell(item.period)
  );

  tbody.appendChild(tr);
}

  function renderMobileProject(item, serialNumber) {
    const card = document.createElement("article");
    card.className = "project-mobile-card";

    const heading = document.createElement("h3");
    heading.textContent = `Project ${serialNumber}`;
    card.appendChild(heading);

    const fields = [
      ["Description of activities", item.description],
      ["Client", item.client],
      ["Period of execution", item.period]
    ];

    for (const [label, value] of fields) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");

      strong.textContent = label;
      p.append(strong, document.createTextNode(value || ""));

      card.appendChild(p);
    }

    mobile.appendChild(card);
  }

  function renderPageNumbers(totalPages) {
    controls.pageNumbers.replaceChildren();

    for (let page = 1; page <= totalPages; page++) {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = String(page);
      button.setAttribute("aria-label", `Go to page ${page}`);

      if (page === currentPage) {
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
      }

      button.addEventListener("click", () => {
        currentPage = page;
        renderProjects();
      });

      controls.pageNumbers.appendChild(button);
    }
  }

  function renderProjects() {
    const totalProjects = allProjects.length;
    const totalPages = Math.ceil(totalProjects / PROJECTS_PER_PAGE);

    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }

    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    const endIndex = Math.min(
      startIndex + PROJECTS_PER_PAGE,
      totalProjects
    );

    const currentProjects = allProjects.slice(startIndex, endIndex);

    tbody.replaceChildren();
    mobile.replaceChildren();

    currentProjects.forEach((item, index) => {
      const serialNumber = startIndex + index + 1;
      renderDesktopProject(item, serialNumber);
      renderMobileProject(item, serialNumber);
    });

    renderPageNumbers(totalPages);

    controls.previousButton.disabled = currentPage === 1;
    controls.nextButton.disabled = currentPage === totalPages;

    controls.previousButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderProjects();
      }
    };

    controls.nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderProjects();
      }
    };

    controls.pageInfo.textContent =
      `Showing ${startIndex + 1}–${endIndex} of ${totalProjects} projects`;
  }

  async function loadProjects() {
    status.textContent = "Loading project register…";

    tbody.replaceChildren();
    mobile.replaceChildren();

    controls.pagination.hidden = true;
    controls.pageInfo.textContent = "";

    try {
      const response = await fetch("/api/projects", {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.items)) {
        throw new Error("Invalid project register response");
      }

      allProjects = [...data.items].sort(
        (a, b) => Number(a.serial_number) - Number(b.serial_number)
      );
      currentPage = 1;

      if (!allProjects.length) {
        status.textContent =
          "Project information will be published here as records are approved.";
        return;
      }

      status.textContent = "";
      controls.pagination.hidden = false;

      renderProjects();

    } catch (error) {
      console.error("Project register failed to load:", error);

      allProjects = [];
      tbody.replaceChildren();
      mobile.replaceChildren();

      controls.pagination.hidden = true;

      status.textContent =
        "The project register could not be loaded at the moment. Please try again later.";
    }
  }

  loadProjects();
})();
