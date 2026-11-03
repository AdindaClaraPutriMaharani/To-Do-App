"use strict";

/* =========================================================
   To-Do App : logika aplikasi
   Alur: data (todos) -> render() menggambar ulang daftar
   setiap kali data berubah -> save() menyimpan ke localStorage.
   ========================================================= */

const STORAGE_KEY = "todo-notebook-v1";
const SEED_EXAMPLES = true; // ganti ke false kalau tidak mau contoh to-do di kunjungan pertama

// ---------- Elemen HTML ----------
const $ = (id) => document.getElementById(id);
const listEl = $("list");
const formEl = $("form");
const inputEl = $("new-todo");
const tabsEl = $("tabs");
const clearBtn = $("clear");
const summaryEl = $("summary");

const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#${id}"></use></svg>`;

// ---------- Penyimpanan (localStorage) ----------
// Mengembalikan null kalau belum pernah ada data (kunjungan pertama).
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    /* penyimpanan diblokir (mis. mode privat): aplikasi tetap jalan tanpa menyimpan */
  }
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- State ----------
const stored = loadTodos();
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();

let todos =
  stored !== null
    ? stored
    : SEED_EXAMPLES
    ? [
        { id: newId(), text: "Contoh: selesaikan tugas minggu ini", done: false, createdAt: hoursAgo(5) },
        { id: newId(), text: "Contoh: balas pesan yang belum terjawab", done: false, createdAt: hoursAgo(2) },
        { id: newId(), text: "Contoh: buat daftar belanja", done: true, createdAt: hoursAgo(26) },
      ]
    : [];
if (stored === null) saveTodos();

let filter = "all";      // "all" | "active" | "done"
let editingId = null;    // id to-do yang sedang diedit
let justAddedId = null;  // untuk animasi item baru

// ---------- Helper ----------
function formatDate(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function visibleTodos() {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}

// ---------- Aksi ----------
function addTodo(text) {
  const todo = { id: newId(), text, done: false, createdAt: new Date().toISOString() };
  todos.unshift(todo);
  justAddedId = todo.id;
  if (filter === "done") filter = "all";
  saveTodos();
  render();
}

function toggleTodo(todo, checked) {
  todo.done = checked;
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

function commitEdit(todo, value) {
  const text = value.trim();
  if (text) todo.text = text;
  editingId = null;
  saveTodos();
  render();
}

// ---------- Tampilan ----------
function emptyRow() {
  const li = document.createElement("li");
  li.className = "empty-row";
  const message =
    filter === "done" ? "Belum ada to-do yang selesai."
    : filter === "active" ? "Semua to-do sudah selesai. Hebat!"
    : "Belum ada to-do. Tulis yang pertama di atas.";
  li.innerHTML =
    '<div class="empty"><svg class="ico-sleep" aria-hidden="true"><use href="#i-cat-sleep"></use></svg><p>' +
    message + "</p></div>";
  return li;
}

function todoRow(todo) {
  const li = document.createElement("li");
  if (todo.done) li.classList.add("done");
  if (todo.id === justAddedId) li.classList.add("new");

  // kotak centang
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "check";
  cb.checked = todo.done;
  cb.setAttribute("aria-label", "Tandai selesai: " + todo.text);
  cb.addEventListener("change", () => toggleTodo(todo, cb.checked));

  // teks + tanggal
  const body = document.createElement("div");
  body.className = "body";

  if (editingId === todo.id) {
    const ed = document.createElement("input");
    ed.type = "text";
    ed.className = "edit-field";
    ed.value = todo.text;
    ed.maxLength = 200;
    ed.setAttribute("aria-label", "Edit to-do");
    ed.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commitEdit(todo, ed.value); }
      else if (e.key === "Escape") { editingId = null; render(); }
    });
    ed.addEventListener("blur", () => {
      if (editingId === todo.id) commitEdit(todo, ed.value);
    });
    body.appendChild(ed);
    setTimeout(() => { ed.focus(); ed.select(); }, 0);
  } else {
    const text = document.createElement("div");
    text.className = "text";
    text.textContent = todo.text; // textContent: aman dari injeksi HTML
    text.title = "Klik dua kali untuk mengedit";
    text.addEventListener("dblclick", () => { editingId = todo.id; render(); });
    body.appendChild(text);
  }

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = "dibuat " + formatDate(todo.createdAt);
  body.appendChild(meta);

  // tombol edit & hapus
  const actions = document.createElement("div");
  actions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.innerHTML = icon("i-pencil");
  editBtn.setAttribute("aria-label", "Edit: " + todo.text);
  editBtn.addEventListener("click", () => { editingId = todo.id; render(); });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "icon-btn del";
  delBtn.innerHTML = icon("i-trash");
  delBtn.setAttribute("aria-label", "Hapus: " + todo.text);
  delBtn.addEventListener("click", () => deleteTodo(todo.id));

  actions.append(editBtn, delBtn);
  li.append(cb, body, actions);
  return li;
}

function render() {
  const active = todos.filter((t) => !t.done).length;
  const done = todos.length - active;

  $("n-all").textContent = todos.length;
  $("n-active").textContent = active;
  $("n-done").textContent = done;
  summaryEl.textContent = active + " to-do belum selesai";
  clearBtn.hidden = done === 0;

  tabsEl.querySelectorAll(".tab").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.filter === filter));
  });

  listEl.textContent = "";
  const items = visibleTodos();
  if (items.length === 0) listEl.appendChild(emptyRow());
  else items.forEach((t) => listEl.appendChild(todoRow(t)));

  justAddedId = null;
}

// ---------- Event ----------
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  addTodo(text);
  inputEl.value = "";
  inputEl.focus();
});

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  filter = btn.dataset.filter;
  render();
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  saveTodos();
  render();
});

// ---------- Mulai ----------
$("today").textContent = new Date().toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long",
});
render();
