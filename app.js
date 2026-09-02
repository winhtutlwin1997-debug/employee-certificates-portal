const store = window.EMPLOYEE_PORTAL_DATA || { employees: [] };
const employees = store.employees || [];

const employeeList = document.getElementById("employee-list");
const employeeSearch = document.getElementById("employee-search");
const employeeProfile = document.getElementById("employee-profile");

let selectedEmployee = null;

function readSelectedSlug() {
  return new URLSearchParams(window.location.search).get("employee");
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
  const folderAction = employee.folderUrl
    ? `<a class="primary-button profile-action" href="${employee.folderUrl}" target="_blank" rel="noopener">See Certificates</a>`
    : `<p class="muted">Certificate folder link is not available yet.</p>`;

  employeeProfile.innerHTML = `
    ${createPhotoMarkup(employee)}
    <div class="profile-meta">
      <p class="eyebrow">Employee Name</p>
      <h2 class="profile-name">${employee.name}</h2>
      <div class="identity-grid">
        <span class="chip">ID: ${idText}</span>
        <span class="chip">${totalCertificates} certificate${totalCertificates === 1 ? "" : "s"}</span>
      </div>
      ${folderAction}
      <div class="company-contact">
        <strong>Brilliant Performance Co., Ltd.</strong>
        <span>Tel: +66-2-453-0786, +66-2-453-0787 &nbsp; Fax: +66-2-453-0788</span>
        <span>E-mail: sales@bpgroup-marine.com, sales@bpmail.net</span>
      </div>
    </div>
  `;
}

function renderEmployeeList(filterText = "") {
  const normalized = filterText.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => (
    !normalized ||
    employee.name.toLowerCase().includes(normalized) ||
    employee.employeeId.toLowerCase().includes(normalized)
  ));

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
}

function renderEmptyPortal() {
  employeeProfile.innerHTML = `
    <div class="empty-state">
      <p>No employee folders were found.</p>
    </div>
  `;
}

employeeSearch.addEventListener("input", (event) => {
  renderEmployeeList(event.target.value);
});

if (!employees.length) {
  renderEmptyPortal();
} else {
  const requestedSlug = readSelectedSlug();
  // QR links include an employee slug, so do not expose the employee directory.
  document.body.classList.toggle("employee-qr-page", Boolean(requestedSlug));
  const initialEmployee = employees.find((employee) => employee.slug === requestedSlug) || employees[0];
  renderEmployee(initialEmployee);
}
