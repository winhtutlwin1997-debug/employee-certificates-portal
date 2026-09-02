const store = window.EMPLOYEE_PORTAL_DATA || { employees: [] };
const employees = store.employees || [];

const employeeList = document.getElementById("employee-list");
const employeeSearch = document.getElementById("employee-search");
const employeeProfile = document.getElementById("employee-profile");
const certificateList = document.getElementById("certificate-list");
const previewTitle = document.getElementById("preview-title");
const previewStage = document.getElementById("preview-stage");
const openCertificate = document.getElementById("open-certificate");
const copyLinkButton = document.getElementById("copy-link");

let selectedEmployee = null;
let selectedCertificate = null;

function readSelectedSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("employee");
}

function updateSelectedSlug(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set("employee", slug);
  window.history.replaceState({}, "", url);
}

function createPhotoMarkup(employee) {
  if (employee.photoUrl) {
    return `<img class="profile-photo" src="${employee.photoUrl}" alt="${employee.name} photo">`;
  }
  return `<div class="profile-fallback" aria-hidden="true">${employee.initials}</div>`;
}

function renderProfile(employee) {
  const totalCertificates = employee.certificates.length;
  const idText = employee.employeeId || "No employee ID";

  employeeProfile.innerHTML = `
    ${createPhotoMarkup(employee)}
    <div class="profile-meta">
      <p class="eyebrow">Employee Record</p>
      <h2 class="profile-name">${employee.name}</h2>
      <p class="muted">This page is designed for certificate verification through a QR code.</p>
      <div class="identity-grid">
        <span class="chip">ID: ${idText}</span>
        <span class="chip">${totalCertificates} certificate${totalCertificates === 1 ? "" : "s"}</span>
      </div>
    </div>
  `;
}

function certificatePreviewMarkup(certificate) {
  if (certificate.usesFolderLink) {
    return `
      <div class="empty-state">
        <p>This engineer's certificates are shared together in OneDrive.</p>
        <p>Use the button above to open the certificate folder.</p>
      </div>
    `;
  }

  const type = certificate.type.toLowerCase();
  if (type === "pdf") {
    return `<iframe title="${certificate.title}" src="${certificate.previewUrl}"></iframe>`;
  }
  if (["jpg", "jpeg", "png", "webp"].includes(type)) {
    return `<img src="${certificate.previewUrl}" alt="${certificate.title}">`;
  }
  return `
    <div class="empty-state">
      <p>This certificate cannot be previewed directly here.</p>
      <p>Use the button above to open it in OneDrive or a new browser tab.</p>
    </div>
  `;
}

function renderPreview(certificate) {
  selectedCertificate = certificate;
  previewTitle.textContent = certificate.title;
  openCertificate.href = certificate.url;
  openCertificate.textContent = certificate.usesFolderLink ? "Open certificate folder" : "Open certificate";
  previewStage.innerHTML = certificatePreviewMarkup(certificate);

  document.querySelectorAll(".certificate-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filename === certificate.filename);
  });
}

function renderCertificates(employee) {
  if (!employee.certificates.length) {
    certificateList.innerHTML = `
      <div class="empty-state">
        <p>No certificate files were found for this employee yet.</p>
      </div>
    `;
    previewTitle.textContent = "No certificates available";
    openCertificate.removeAttribute("href");
    previewStage.innerHTML = `
      <div class="empty-state">
        <p>Add PDF or image certificates to the employee folder, then run the generator again.</p>
      </div>
    `;
    return;
  }

  certificateList.innerHTML = employee.certificates.map((certificate) => `
    <button class="certificate-button" type="button" data-filename="${certificate.filename}">
      <span class="tick">✓</span>
      <span class="certificate-title">${certificate.title}</span>
      <span class="certificate-type">${certificate.type}</span>
    </button>
  `).join("");

  document.querySelectorAll(".certificate-button").forEach((button) => {
    button.addEventListener("click", () => {
      const certificate = employee.certificates.find((item) => item.filename === button.dataset.filename);
      if (certificate) {
        renderPreview(certificate);
      }
    });
  });

  renderPreview(employee.certificates[0]);
}

function renderEmployeeList(filterText = "") {
  const normalized = filterText.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    if (!normalized) {
      return true;
    }
    return (
      employee.name.toLowerCase().includes(normalized) ||
      employee.employeeId.toLowerCase().includes(normalized)
    );
  });

  employeeList.innerHTML = filteredEmployees.map((employee) => `
    <button class="employee-button ${selectedEmployee && employee.slug === selectedEmployee.slug ? "is-active" : ""}" type="button" data-slug="${employee.slug}">
      <strong>${employee.name}</strong>
      <span>${employee.employeeId || "No employee ID"}</span>
    </button>
  `).join("");

  document.querySelectorAll(".employee-button").forEach((button) => {
    button.addEventListener("click", () => {
      const employee = employees.find((item) => item.slug === button.dataset.slug);
      if (employee) {
        renderEmployee(employee);
      }
    });
  });
}

function renderEmployee(employee) {
  selectedEmployee = employee;
  updateSelectedSlug(employee.slug);
  renderEmployeeList(employeeSearch.value);
  renderProfile(employee);
  renderCertificates(employee);
}

async function copyCurrentLink() {
  if (!selectedEmployee) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("employee", selectedEmployee.slug);

  try {
    await navigator.clipboard.writeText(currentUrl.toString());
    copyLinkButton.textContent = "Copied";
    window.setTimeout(() => {
      copyLinkButton.textContent = "Copy employee page link";
    }, 1600);
  } catch {
    copyLinkButton.textContent = "Copy failed";
    window.setTimeout(() => {
      copyLinkButton.textContent = "Copy employee page link";
    }, 1600);
  }
}

function renderEmptyPortal() {
  employeeProfile.innerHTML = `
    <div class="empty-state">
      <p>No employee folders were found.</p>
    </div>
  `;
  certificateList.innerHTML = "";
  previewStage.innerHTML = `
    <div class="empty-state">
      <p>Add employee folders, then run <code>python scripts/build_portal.py</code>.</p>
    </div>
  `;
}

employeeSearch.addEventListener("input", (event) => {
  renderEmployeeList(event.target.value);
});

copyLinkButton.addEventListener("click", copyCurrentLink);

if (!employees.length) {
  renderEmptyPortal();
} else {
  const requestedSlug = readSelectedSlug();
  // QR links include an employee slug, so do not expose the employee directory.
  document.body.classList.toggle("employee-qr-page", Boolean(requestedSlug));
  const initialEmployee = employees.find((employee) => employee.slug === requestedSlug) || employees[0];
  renderEmployee(initialEmployee);
}
