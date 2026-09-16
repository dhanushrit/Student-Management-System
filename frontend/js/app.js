// ---------------------------------------------------------------
// app.js
// Dashboard logic: guards the page, renders the student table,
// and wires up Create / Read / Update / Delete + search.
// ---------------------------------------------------------------

// --- Route guard: only logged-in users may view the dashboard ---
if (!localStorage.getItem('authToken')) {
  window.location.href = 'index.html';
}

document.getElementById('loggedInUser').textContent = localStorage.getItem('username') || '';

let allStudents = [];
let editingId = null;
let deletingId = null;
let searchTimer = null;

const tableBody = document.getElementById('studentsTableBody');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const deleteOverlay = document.getElementById('deleteOverlay');
const studentForm = document.getElementById('studentForm');
const YEAR_LABELS = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };

// ---------------- Toast ----------------
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---------------- Render ----------------
function renderStudents(students) {
  tableBody.innerHTML = '';

  if (!students.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge">${escapeHtml(s.roll_number)}</span></td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${YEAR_LABELS[s.year] || s.year}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.phone || '—')}</td>
      <td class="actions-cell">
        <button class="btn small" data-edit="${s.id}">Edit</button>
        <button class="btn small danger" data-delete="${s.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
  tableBody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.delete));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------------- Load ----------------
async function loadStudents(search = '') {
  try {
    allStudents = await StudentAPI.list(search);
    renderStudents(allStudents);
  } catch (err) {
    showToast('Failed to load students. Is the backend running?', 'error');
  }
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const value = e.target.value.trim();
  searchTimer = setTimeout(() => loadStudents(value), 300);
});

// ---------------- Add / Edit Modal ----------------
function clearFormErrors() {
  studentForm.querySelectorAll('small.error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function setFormError(field, message) {
  const el = document.getElementById(`${field}Error`);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Student';
  studentForm.reset();
  clearFormErrors();
  modalOverlay.classList.add('open');
}

function openEditModal(id) {
  const student = allStudents.find(s => String(s.id) === String(id));
  if (!student) return;
  editingId = student.id;
  document.getElementById('modalTitle').textContent = 'Edit Student';
  clearFormErrors();
  document.getElementById('name').value = student.name;
  document.getElementById('roll_number').value = student.roll_number;
  document.getElementById('email').value = student.email;
  document.getElementById('department').value = student.department;
  document.getElementById('year').value = student.year;
  document.getElementById('phone').value = student.phone || '';
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

document.getElementById('addStudentBtn').addEventListener('click', openAddModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// ---------------- Client-side validation ----------------
function validateStudentForm(payload) {
  let valid = true;
  if (!payload.name) { setFormError('name', 'Name is required.'); valid = false; }
  if (!payload.roll_number) { setFormError('roll_number', 'Roll number is required.'); valid = false; }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFormError('email', 'Enter a valid email address.'); valid = false;
  }
  if (!payload.department) { setFormError('department', 'Department is required.'); valid = false; }
  if (!payload.year) { setFormError('year', 'Please select a year.'); valid = false; }
  if (payload.phone && !/^\d{7,15}$/.test(payload.phone)) {
    setFormError('phone', 'Phone must be 7-15 digits, numbers only.'); valid = false;
  }
  return valid;
}

// ---------------- Create / Update submit ----------------
studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const payload = {
    name: document.getElementById('name').value.trim(),
    roll_number: document.getElementById('roll_number').value.trim(),
    email: document.getElementById('email').value.trim(),
    department: document.getElementById('department').value.trim(),
    year: Number(document.getElementById('year').value),
    phone: document.getElementById('phone').value.trim(),
  };

  if (!validateStudentForm(payload)) return;

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (editingId) {
      await StudentAPI.update(editingId, payload);
      showToast('Student updated successfully.');
    } else {
      await StudentAPI.create(payload);
      showToast('Student created successfully.');
    }
    closeModal();
    loadStudents(document.getElementById('searchInput').value.trim());
  } catch (err) {
    if (err.data && typeof err.data === 'object') {
      let shown = false;
      Object.entries(err.data).forEach(([field, messages]) => {
        setFormError(field, Array.isArray(messages) ? messages[0] : messages);
        shown = true;
      });
      if (!shown) showToast('Could not save student.', 'error');
    } else {
      showToast('Could not save student.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
});

// ---------------- Delete ----------------
function openDeleteModal(id) {
  const student = allStudents.find(s => String(s.id) === String(id));
  if (!student) return;
  deletingId = id;
  document.getElementById('deleteMessage').textContent =
    `This will permanently remove "${student.name}" (${student.roll_number}).`;
  deleteOverlay.classList.add('open');
}

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  deleteOverlay.classList.remove('open');
  deletingId = null;
});

deleteOverlay.addEventListener('click', (e) => {
  if (e.target === deleteOverlay) { deleteOverlay.classList.remove('open'); deletingId = null; }
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deletingId) return;
  try {
    await StudentAPI.remove(deletingId);
    showToast('Student deleted.');
    deleteOverlay.classList.remove('open');
    loadStudents(document.getElementById('searchInput').value.trim());
  } catch (err) {
    showToast('Could not delete student.', 'error');
  } finally {
    deletingId = null;
  }
});

// ---------------- Logout ----------------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await apiRequest('/auth/logout/', { method: 'POST' });
  } catch (_) {
    // even if the request fails, still clear local session
  }
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
});

// ---------------- Init ----------------
loadStudents();
