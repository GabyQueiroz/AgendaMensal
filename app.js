const STORAGE_KEY = "agenda-mensal-v1";
const WORK_START = "07:00";
const WORK_END = "22:00";
const SLOT_MINUTES = 60;

const state = {
  events: [],
  viewDate: startOfMonth(new Date()),
  selectedDate: toDateKey(new Date()),
};

const el = {
  monthTitle: document.querySelector("#monthTitle"),
  monthSubtitle: document.querySelector("#monthSubtitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  selectedDayTitle: document.querySelector("#selectedDayTitle"),
  eventList: document.querySelector("#eventList"),
  availabilityList: document.querySelector("#availabilityList"),
  alertsBox: document.querySelector("#alertsBox"),
  todayCount: document.querySelector("#todayCount"),
  importantCount: document.querySelector("#importantCount"),
  pendingCount: document.querySelector("#pendingCount"),
  doneCount: document.querySelector("#doneCount"),
  dialog: document.querySelector("#eventDialog"),
  form: document.querySelector("#eventForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  deleteEvent: document.querySelector("#deleteEvent"),
};

const fields = {
  id: document.querySelector("#eventId"),
  title: document.querySelector("#title"),
  date: document.querySelector("#date"),
  time: document.querySelector("#time"),
  endTime: document.querySelector("#endTime"),
  category: document.querySelector("#category"),
  repeat: document.querySelector("#repeat"),
  status: document.querySelector("#status"),
  repeatUntil: document.querySelector("#repeatUntil"),
  important: document.querySelector("#important"),
  pinned: document.querySelector("#pinned"),
  notes: document.querySelector("#notes"),
};

document.querySelector("#previousMonth").addEventListener("click", () => moveMonth(-1));
document.querySelector("#nextMonth").addEventListener("click", () => moveMonth(1));
document.querySelector("#todayButton").addEventListener("click", selectToday);
document.querySelector("#newEvent").addEventListener("click", () => openEventDialog({ date: state.selectedDate }));
document.querySelector("#addForDay").addEventListener("click", () => openEventDialog({ date: state.selectedDate }));
document.querySelector("#refreshAvailability").addEventListener("click", renderAvailability);
document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#cancelDialog").addEventListener("click", closeDialog);
document.querySelector("#exportData").addEventListener("click", exportData);
document.querySelector("#importData").addEventListener("change", importData);
el.form.addEventListener("submit", saveEvent);
el.deleteEvent.addEventListener("click", deleteEvent);

load();
render();

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.events = seedEvents();
    persist();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.events = Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    state.events = [];
  }
}

function seedEvents() {
  const today = new Date();
  const monday = addDays(today, (8 - today.getDay()) % 7 || 1);
  return [
    {
      id: crypto.randomUUID(),
      title: "Exemplo: aula fixa",
      date: toDateKey(monday),
      time: "19:00",
      endTime: "20:00",
      category: "aula",
      repeat: "weekly",
      repeatUntil: "",
      status: "pending",
      important: false,
      pinned: true,
      notes: "Edite ou exclua este exemplo.",
    },
    {
      id: crypto.randomUUID(),
      title: "Exemplo: compromisso importante",
      date: toDateKey(addDays(today, 2)),
      time: "10:00",
      endTime: "11:00",
      category: "pessoal",
      repeat: "none",
      repeatUntil: "",
      status: "pending",
      important: true,
      pinned: false,
      notes: "Marque como feito quando concluir.",
    },
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: state.events }));
}

function render() {
  renderDashboard();
  renderCalendar();
  renderDay();
  renderAvailability();
}

function renderDashboard() {
  const monthStart = startOfMonth(state.viewDate);
  const monthEnd = endOfMonth(state.viewDate);
  const todayEvents = instancesForDate(state.selectedDate);
  const monthEvents = instancesBetween(monthStart, monthEnd);

  el.todayCount.textContent = todayEvents.length;
  el.importantCount.textContent = monthEvents.filter((event) => event.important).length;
  el.pendingCount.textContent = monthEvents.filter((event) => event.status === "pending").length;
  el.doneCount.textContent = monthEvents.filter((event) => event.status === "done").length;
}

function renderCalendar() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  el.monthTitle.textContent = capitalize(formatter.format(state.viewDate));
  el.monthSubtitle.textContent = "Clique em um dia para ver detalhes e horários livres";
  el.calendarGrid.innerHTML = "";

  const firstVisible = addDays(startOfMonth(state.viewDate), -startOfMonth(state.viewDate).getDay());
  const todayKey = toDateKey(new Date());

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(firstVisible, index);
    const key = toDateKey(date);
    const dayEvents = instancesForDate(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "day-cell",
      date.getMonth() !== state.viewDate.getMonth() ? "is-other-month" : "",
      key === todayKey ? "is-today" : "",
      key === state.selectedDate ? "is-selected" : "",
    ].filter(Boolean).join(" ");
    button.innerHTML = `
      <span class="day-number">
        <span>${date.getDate()}</span>
        ${dayEvents.length ? `<span class="day-count">${dayEvents.length}</span>` : ""}
      </span>
      <span class="mini-events"></span>
    `;

    const mini = button.querySelector(".mini-events");
    dayEvents.slice(0, 3).forEach((event) => {
      const item = document.createElement("span");
      item.className = `mini-event ${event.important ? "important" : ""} ${event.status}`;
      item.textContent = `${event.time} ${event.title}`;
      mini.appendChild(item);
    });
    if (dayEvents.length > 3) {
      const more = document.createElement("span");
      more.className = "mini-event";
      more.textContent = `+${dayEvents.length - 3} mais`;
      mini.appendChild(more);
    }

    button.addEventListener("click", () => {
      state.selectedDate = key;
      if (date.getMonth() !== state.viewDate.getMonth()) {
        state.viewDate = startOfMonth(date);
      }
      render();
    });
    el.calendarGrid.appendChild(button);
  }
}

function renderDay() {
  const dayEvents = instancesForDate(state.selectedDate);
  const date = parseDateKey(state.selectedDate);
  el.selectedDayTitle.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);

  renderAlerts(dayEvents);
  el.eventList.innerHTML = "";

  if (!dayEvents.length) {
    el.eventList.innerHTML = '<div class="empty-state">Nenhum compromisso neste dia.</div>';
    return;
  }

  dayEvents.forEach((event) => {
    const item = document.createElement("article");
    item.className = `event-chip ${event.important ? "important" : ""} ${event.status}`;
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(event.title)}</strong>
        <small>${event.time} - ${event.endTime} · ${labelCategory(event.category)}${event.pinned ? " · fixo" : ""}</small>
        ${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ""}
      </div>
      <div class="event-actions">
        <button class="icon-button" type="button" title="Marcar feito" aria-label="Marcar feito" data-action="done">✓</button>
        <button class="icon-button" type="button" title="Editar" aria-label="Editar" data-action="edit">✎</button>
      </div>
    `;
    item.querySelector('[data-action="done"]').addEventListener("click", () => setStatus(event.id, "done"));
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openEventDialog(event));
    el.eventList.appendChild(item);
  });
}

function renderAlerts(dayEvents) {
  el.alertsBox.innerHTML = "";
  const upcoming = instancesBetween(new Date(), addDays(new Date(), 7))
    .filter((event) => event.important && event.status === "pending")
    .slice(0, 3);

  if (dayEvents.some((event) => event.important && event.status === "pending")) {
    addAlert("Este dia tem compromisso importante.");
  }

  upcoming.forEach((event) => {
    if (event.date !== state.selectedDate) {
      const label = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(parseDateKey(event.date));
      addAlert(`${label} · ${event.time} · ${event.title}`);
    }
  });
}

function addAlert(text) {
  const alert = document.createElement("div");
  alert.className = "alert";
  alert.textContent = text;
  el.alertsBox.appendChild(alert);
}

function renderAvailability() {
  const busy = instancesForDate(state.selectedDate)
    .filter((event) => event.status !== "skipped")
    .map((event) => [toMinutes(event.time), toMinutes(event.endTime)])
    .sort((a, b) => a[0] - b[0]);

  const slots = [];
  let cursor = toMinutes(WORK_START);
  const dayEnd = toMinutes(WORK_END);

  busy.forEach(([start, end]) => {
    while (cursor + SLOT_MINUTES <= Math.min(start, dayEnd)) {
      slots.push([cursor, cursor + SLOT_MINUTES]);
      cursor += SLOT_MINUTES;
    }
    cursor = Math.max(cursor, end);
  });

  while (cursor + SLOT_MINUTES <= dayEnd) {
    slots.push([cursor, cursor + SLOT_MINUTES]);
    cursor += SLOT_MINUTES;
  }

  el.availabilityList.innerHTML = "";
  if (!slots.length) {
    el.availabilityList.innerHTML = '<div class="empty-state">Sem blocos livres de 1 hora entre 07:00 e 22:00.</div>';
    return;
  }

  slots.slice(0, 8).forEach(([start, end]) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = `${fromMinutes(start)} - ${fromMinutes(end)}`;
    el.availabilityList.appendChild(slot);
  });
}

function openEventDialog(event = {}) {
  const original = state.events.find((item) => item.id === event.id) || event;
  fields.id.value = original.id || "";
  fields.title.value = original.title || "";
  fields.date.value = original.date || state.selectedDate;
  fields.time.value = original.time || "09:00";
  fields.endTime.value = original.endTime || "10:00";
  fields.category.value = original.category || "pessoal";
  fields.repeat.value = original.repeat || "none";
  fields.status.value = original.status || "pending";
  fields.repeatUntil.value = original.repeatUntil || "";
  fields.important.checked = Boolean(original.important);
  fields.pinned.checked = Boolean(original.pinned);
  fields.notes.value = original.notes || "";
  el.dialogTitle.textContent = original.id ? "Editar compromisso" : "Novo compromisso";
  el.deleteEvent.hidden = !original.id;
  el.dialog.showModal();
}

function closeDialog() {
  el.dialog.close();
}

function saveEvent(event) {
  event.preventDefault();
  if (toMinutes(fields.endTime.value) <= toMinutes(fields.time.value)) {
    fields.endTime.setCustomValidity("O fim precisa ser depois do início.");
    fields.endTime.reportValidity();
    return;
  }
  fields.endTime.setCustomValidity("");

  const data = {
    id: fields.id.value || crypto.randomUUID(),
    title: fields.title.value.trim(),
    date: fields.date.value,
    time: fields.time.value,
    endTime: fields.endTime.value,
    category: fields.category.value,
    repeat: fields.repeat.value,
    status: fields.status.value,
    repeatUntil: fields.repeatUntil.value,
    important: fields.important.checked,
    pinned: fields.pinned.checked,
    notes: fields.notes.value.trim(),
  };

  const index = state.events.findIndex((item) => item.id === data.id);
  if (index >= 0) {
    state.events[index] = data;
  } else {
    state.events.push(data);
  }

  state.selectedDate = data.date;
  state.viewDate = startOfMonth(parseDateKey(data.date));
  persist();
  closeDialog();
  render();
}

function deleteEvent() {
  const id = fields.id.value;
  state.events = state.events.filter((event) => event.id !== id);
  persist();
  closeDialog();
  render();
}

function setStatus(id, status) {
  const event = state.events.find((item) => item.id === id);
  if (event) {
    event.status = status;
    persist();
    render();
  }
}

function instancesForDate(dateKey) {
  return state.events
    .filter((event) => occursOn(event, dateKey))
    .map((event) => ({ ...event, date: dateKey }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function instancesBetween(startDate, endDate) {
  const items = [];
  let date = parseDateKey(toDateKey(startDate));
  const end = parseDateKey(toDateKey(endDate));
  while (date <= end) {
    items.push(...instancesForDate(toDateKey(date)));
    date = addDays(date, 1);
  }
  return items;
}

function occursOn(event, dateKey) {
  const date = parseDateKey(dateKey);
  const start = parseDateKey(event.date);
  const until = event.repeatUntil ? parseDateKey(event.repeatUntil) : addYears(start, 3);

  if (date < start || date > until) return false;
  if (event.repeat === "none") return event.date === dateKey;
  if (event.repeat === "daily") return true;
  if (event.repeat === "weekly") return date.getDay() === start.getDay();
  if (event.repeat === "monthly") return date.getDate() === start.getDate();
  return false;
}

function moveMonth(direction) {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + direction, 1);
  render();
}

function selectToday() {
  const today = new Date();
  state.selectedDate = toDateKey(today);
  state.viewDate = startOfMonth(today);
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify({ events: state.events }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agenda-backup-${toDateKey(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.events)) throw new Error("Formato inválido");
      state.events = parsed.events;
      persist();
      render();
    } catch {
      alert("Não consegui importar esse arquivo. Use um backup JSON exportado pela agenda.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function toDateKey(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return local.toISOString().slice(0, 10);
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function labelCategory(category) {
  return {
    aula: "Aula",
    saude: "Saúde",
    trabalho: "Trabalho",
    pessoal: "Pessoal",
    outro: "Outro",
  }[category] || "Outro";
}
