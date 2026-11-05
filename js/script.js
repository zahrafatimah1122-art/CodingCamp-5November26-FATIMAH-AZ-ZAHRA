// ===== Storage helpers =====
const KEYS = {
  tasks: "ldb_tasks",
  links: "ldb_links",
  theme: "ldb_theme",
  name: "ldb_name",
  duration: "ldb_duration",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable */
  }
}

// ===== Greeting, clock & custom name =====
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting-text");
const nameInput = document.getElementById("name-input");
const saveNameBtn = document.getElementById("save-name");

let userName = load(KEYS.name, "");
nameInput.value = userName;

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("en-GB");
  dateEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const greeting = getGreeting(now.getHours());
  greetingEl.textContent = userName ? `${greeting}, ${userName}` : greeting;
}

saveNameBtn.addEventListener("click", () => {
  userName = nameInput.value.trim();
  save(KEYS.name, userName);
  updateClock();
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveNameBtn.click();
});

updateClock();
setInterval(updateClock, 1000);

// ===== Focus timer =====
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");
const durationInput = document.getElementById("duration-input");
const setDurationBtn = document.getElementById("set-duration");

let durationMin = load(KEYS.duration, 25);
let remaining = durationMin * 60;
let timerId = null;

durationInput.value = durationMin;

function renderTimer() {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function startTimer() {
  if (timerId !== null || remaining <= 0) return;
  timerId = setInterval(() => {
    remaining--;
    renderTimer();
    if (remaining <= 0) {
      stopTimer();
      alert("Waktu fokus selesai! Saatnya istirahat 🎉");
    }
  }, 1000);
}

function resetTimer() {
  stopTimer();
  remaining = durationMin * 60;
  renderTimer();
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);

setDurationBtn.addEventListener("click", () => {
  const value = parseInt(durationInput.value, 10);
  if (!value || value < 1 || value > 180) {
    alert("Masukkan durasi 1–180 menit.");
    durationInput.value = durationMin;
    return;
  }
  durationMin = value;
  save(KEYS.duration, durationMin);
  resetTimer();
});

renderTimer();

// ===== To-do list =====
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskEmpty = document.getElementById("task-empty");

let tasks = load(KEYS.tasks, []);
let editingId = null;

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function saveTasks() {
  save(KEYS.tasks, tasks);
}

function renderTasks() {
  taskList.innerHTML = "";
  taskEmpty.style.display = tasks.length ? "none" : "block";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });
    li.appendChild(checkbox);

    if (editingId === task.id) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "task-edit";
      editInput.value = task.text;
      editInput.maxLength = 100;
      li.appendChild(editInput);

      const commit = () => {
        const value = editInput.value.trim();
        if (value) task.text = value;
        editingId = null;
        saveTasks();
        renderTasks();
      };
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          editingId = null;
          renderTasks();
        }
      });

      const saveBtn = document.createElement("button");
      saveBtn.className = "btn edit";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", commit);
      li.appendChild(saveBtn);

      setTimeout(() => editInput.focus(), 0);
    } else {
      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;
      li.appendChild(text);

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn edit";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        editingId = task.id;
        renderTasks();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn delete";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actions.append(editBtn, delBtn);
      li.appendChild(actions);
    }

    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: newId(), text, done: false });
  saveTasks();
  taskInput.value = "";
  renderTasks();
});

renderTasks();

// ===== Quick links =====
const linkForm = document.getElementById("link-form");
const linkName = document.getElementById("link-name");
const linkUrl = document.getElementById("link-url");
const linkList = document.getElementById("link-list");

const defaultLinks = [
  { id: "d1", name: "Google", url: "https://www.google.com" },
  { id: "d2", name: "Gmail", url: "https://mail.google.com" },
  { id: "d3", name: "Calendar", url: "https://calendar.google.com" },
];

let links = load(KEYS.links, defaultLinks);

function saveLinks() {
  save(KEYS.links, links);
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
}

function renderLinks() {
  linkList.innerHTML = "";
  links.forEach((link) => {
    const wrap = document.createElement("div");
    wrap.className = "link-item";

    const a = document.createElement("a");
    a.className = "link-btn";
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.name;

    const remove = document.createElement("button");
    remove.className = "link-remove";
    remove.setAttribute("aria-label", "Hapus " + link.name);
    remove.textContent = "✕";
    remove.addEventListener("click", () => {
      links = links.filter((l) => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    wrap.append(a, remove);
    linkList.appendChild(wrap);
  });
}

linkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = linkName.value.trim();
  if (!name || !linkUrl.value.trim()) return;
  links.push({ id: newId(), name, url: normalizeUrl(linkUrl.value) });
  saveLinks();
  linkName.value = "";
  linkUrl.value = "";
  renderLinks();
});

renderLinks();

// ===== Light / dark mode =====
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

let theme = load(KEYS.theme, "light");
applyTheme(theme);

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  save(KEYS.theme, theme);
  applyTheme(theme);
});
