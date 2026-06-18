const STORAGE_KEY = "agenda-mensal-v1";
const WORK_START = "07:00";
const WORK_END = "22:00";
const SLOT_MINUTES = 60;

const state = {
  events: [],
  tasks: [],
  blocks: [],
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
  taskForm: document.querySelector("#taskForm"),
  taskList: document.querySelector("#taskList"),
  taskOpenCount: document.querySelector("#taskOpenCount"),
  taskDueCount: document.querySelector("#taskDueCount"),
  taskDoneCount: document.querySelector("#taskDoneCount"),
  blockForm: document.querySelector("#blockForm"),
  blockList: document.querySelector("#blockList"),
  quickDialog: document.querySelector("#quickDialog"),
  quickEyebrow: document.querySelector("#quickEyebrow"),
  quickTitle: document.querySelector("#quickTitle"),
  quickList: document.querySelector("#quickList"),
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

const taskFields = {
  id: document.querySelector("#taskId"),
  title: document.querySelector("#taskTitle"),
  dueDate: document.querySelector("#taskDueDate"),
  priority: document.querySelector("#taskPriority"),
  notes: document.querySelector("#taskNotes"),
};

const blockFields = {
  id: document.querySelector("#blockId"),
  start: document.querySelector("#blockStart"),
  end: document.querySelector("#blockEnd"),
  reason: document.querySelector("#blockReason"),
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
document.querySelector("#clearTask").addEventListener("click", clearTaskForm);
document.querySelector("#downloadAvailabilityImage").addEventListener("click", downloadAvailabilityImage);
document.querySelector("#quickEvents").addEventListener("click", () => openEventGuide("month"));
document.querySelector("#quickTasks").addEventListener("click", () => openTaskGuide("all"));
document.querySelector("#todayMetric").addEventListener("click", () => openEventGuide("today"));
document.querySelector("#importantMetric").addEventListener("click", () => openEventGuide("important"));
document.querySelector("#pendingMetric").addEventListener("click", () => openMixedGuide("pending"));
document.querySelector("#doneMetric").addEventListener("click", () => openMixedGuide("done"));
document.querySelector("#closeQuickDialog").addEventListener("click", closeQuickDialog);
el.form.addEventListener("submit", saveEvent);
el.deleteEvent.addEventListener("click", deleteEvent);
el.taskForm.addEventListener("submit", saveTask);
el.blockForm.addEventListener("submit", saveBlock);

load();
render();

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.events = seedEvents();
    state.blocks = [];
    ensureSenacClasses();
    persist();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.events = Array.isArray(parsed.events) ? parsed.events : [];
    state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    state.blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    ensureSenacClasses();
    persist();
  } catch {
    state.events = [];
    state.tasks = [];
    state.blocks = [];
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

function ensureSenacClasses() {
  const classes = [
    {
      source: "senac-terca-2026-07-01",
      title: "Aula Senac",
      date: "2026-06-23",
      time: "19:00",
      endTime: "22:40",
    },
    {
      source: "senac-quinta-2026-07-01",
      title: "Aula Senac",
      date: "2026-06-18",
      time: "19:00",
      endTime: "22:40",
    },
    {
      source: "senac-sexta-2026-07-01",
      title: "Aula Senac",
      date: "2026-06-19",
      time: "19:00",
      endTime: "20:40",
    },
  ];

  classes.forEach((classEvent) => {
    const exists = state.events.some((event) => event.source === classEvent.source);
    if (exists) return;
    state.events.push({
      id: crypto.randomUUID(),
      title: classEvent.title,
      date: classEvent.date,
      time: classEvent.time,
      endTime: classEvent.endTime,
      category: "aula",
      repeat: "weekly",
      repeatUntil: "2026-07-01",
      status: "pending",
      important: true,
      pinned: true,
      notes: "Aula fixa cadastrada automaticamente. Encerra em 01/07/2026.",
      source: classEvent.source,
    });
  });
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: state.events, tasks: state.tasks, blocks: state.blocks }));
}

function render() {
  renderDashboard();
  renderCalendar();
  renderDay();
  renderAvailability();
  renderBlocks();
  renderTasks();
}

function renderDashboard() {
  const monthStart = startOfMonth(state.viewDate);
  const monthEnd = endOfMonth(state.viewDate);
  const todayEvents = instancesForDate(state.selectedDate);
  const monthEvents = instancesBetween(monthStart, monthEnd);
  const openTasks = state.tasks.filter((task) => !task.done);
  const doneTasks = state.tasks.filter((task) => task.done);

  el.todayCount.textContent = todayEvents.length;
  el.importantCount.textContent = monthEvents.filter((event) => event.important).length + openTasks.filter((task) => task.priority === "high").length;
  el.pendingCount.textContent = monthEvents.filter((event) => event.status === "pending").length + openTasks.length;
  el.doneCount.textContent = monthEvents.filter((event) => event.status === "done").length + doneTasks.length;
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
  const selectedTasks = tasksDueOn(state.selectedDate).filter((task) => !task.done);
  const upcoming = instancesBetween(new Date(), addDays(new Date(), 7))
    .filter((event) => event.important && event.status === "pending")
    .slice(0, 3);

  if (dayEvents.some((event) => event.important && event.status === "pending")) {
    addAlert("Este dia tem compromisso importante.");
  }

  if (selectedTasks.length) {
    addAlert(`${selectedTasks.length} tarefa(s) com prazo neste dia.`);
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

function openEventGuide(filter) {
  const monthEvents = eventsForCurrentMonth();
  const todayKey = toDateKey(new Date());
  const filtered = monthEvents.filter((event) => {
    if (filter === "today") return event.date === todayKey;
    if (filter === "important") return event.important;
    return true;
  });
  const titles = {
    month: "Compromissos do mês",
    today: "Compromissos de hoje",
    important: "Compromissos importantes",
  };

  openQuickDialog("Guia rápido", titles[filter] || titles.month);
  renderQuickItems(filtered, "event");
}

function openTaskGuide(filter) {
  const tasks = sortedTasks().filter((task) => {
    if (filter === "pending") return !task.done;
    if (filter === "done") return task.done;
    return true;
  });
  const titles = {
    all: "Tarefas",
    pending: "Tarefas a fazer",
    done: "Tarefas feitas",
  };

  openQuickDialog("Menu de tarefas", titles[filter] || titles.all);
  renderQuickItems(tasks, "task");
}

function openMixedGuide(filter) {
  const monthEvents = eventsForCurrentMonth();
  const events = monthEvents.filter((event) => filter === "done" ? event.status === "done" : event.status === "pending");
  const tasks = sortedTasks().filter((task) => filter === "done" ? task.done : !task.done);

  openQuickDialog("Guia rápido", filter === "done" ? "Feitos" : "A fazer");
  renderQuickItems(sortMixedItems([...events, ...tasks]), "mixed");
}

function openQuickDialog(eyebrow, title) {
  el.quickEyebrow.textContent = eyebrow;
  el.quickTitle.textContent = title;
  el.quickList.innerHTML = "";
  el.quickDialog.showModal();
}

function closeQuickDialog() {
  el.quickDialog.close();
}

function renderQuickItems(items, type) {
  if (!items.length) {
    el.quickList.innerHTML = '<div class="empty-state">Nada encontrado para este filtro.</div>';
    return;
  }

  items.forEach((item) => {
    const isTask = type === "task" || Boolean(item.createdAt);
    const row = document.createElement("article");
    row.className = `quick-item ${item.important ? "important" : ""} ${item.status || ""} ${item.done ? "done" : ""}`;

    if (isTask) {
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${item.dueDate ? `Prazo: ${formatShortDate(item.dueDate)}` : "Sem prazo"} · ${labelPriority(item.priority)}</small>
        </div>
        <span class="quick-pill">${item.done ? "Feita" : "A fazer"}</span>
      `;
    } else {
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${formatShortDate(item.date)} · ${item.time} - ${item.endTime}</small>
        </div>
        <span class="quick-pill">${labelCategory(item.category)}</span>
      `;
    }

    el.quickList.appendChild(row);
  });
}

function renderTasks() {
  const todayKey = toDateKey(new Date());
  const openTasks = state.tasks.filter((task) => !task.done);
  const doneTasks = state.tasks.filter((task) => task.done);
  const dueToday = openTasks.filter((task) => task.dueDate === todayKey);

  el.taskOpenCount.textContent = openTasks.length;
  el.taskDoneCount.textContent = doneTasks.length;
  el.taskDueCount.textContent = dueToday.length;
  el.taskList.innerHTML = "";

  if (!state.tasks.length) {
    el.taskList.innerHTML = '<div class="empty-state">Nenhuma tarefa cadastrada ainda.</div>';
    return;
  }

  sortedTasks().forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-item ${task.priority} ${task.done ? "done" : ""}`;
    item.innerHTML = `
      <input class="task-check" type="checkbox" aria-label="Marcar tarefa como feita" ${task.done ? "checked" : ""}>
      <div class="task-body">
        <strong>${escapeHtml(task.title)}</strong>
        ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ""}
        <div class="task-meta">
          <span>${labelPriority(task.priority)}</span>
          ${task.dueDate ? `<span>${formatShortDate(task.dueDate)}</span>` : "<span>Sem prazo</span>"}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-button" type="button" title="Editar tarefa" aria-label="Editar tarefa" data-action="edit">✎</button>
        <button class="icon-button" type="button" title="Excluir tarefa" aria-label="Excluir tarefa" data-action="delete">×</button>
      </div>
    `;

    item.querySelector(".task-check").addEventListener("change", (event) => toggleTask(task.id, event.target.checked));
    item.querySelector('[data-action="edit"]').addEventListener("click", () => editTask(task.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTask(task.id));
    el.taskList.appendChild(item);
  });
}

function renderAvailability() {
  const slots = availabilitySlotsForDate(state.selectedDate);

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

function availabilitySlotsForDate(dateKey) {
  const busy = busyRangesForDate(dateKey);

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

  return slots;
}

function busyRangesForDate(dateKey) {
  const eventRanges = instancesForDate(dateKey)
    .filter((event) => event.status !== "skipped")
    .map((event) => [toMinutes(event.time), toMinutes(event.endTime)]);
  const blockRanges = blocksForDate(dateKey).map((block) => [toMinutes(block.time), toMinutes(block.endTime)]);
  return [...eventRanges, ...blockRanges].sort((a, b) => a[0] - b[0]);
}

function renderBlocks() {
  const blocks = blocksForDate(state.selectedDate);
  el.blockList.innerHTML = "";

  if (!blocks.length) {
    el.blockList.innerHTML = '<div class="empty-state">Nenhum horário livre foi bloqueado neste dia.</div>';
    return;
  }

  blocks.forEach((block) => {
    const item = document.createElement("article");
    item.className = "block-item";
    item.innerHTML = `
      <div>
        <strong>${block.time} - ${block.endTime}</strong>
        <small>${escapeHtml(block.reason || "Bloqueio manual")}</small>
      </div>
      <button class="icon-button" type="button" title="Remover bloqueio" aria-label="Remover bloqueio">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => deleteBlock(block.id));
    el.blockList.appendChild(item);
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

function saveTask(event) {
  event.preventDefault();
  const data = {
    id: taskFields.id.value || crypto.randomUUID(),
    title: taskFields.title.value.trim(),
    dueDate: taskFields.dueDate.value,
    priority: taskFields.priority.value,
    notes: taskFields.notes.value.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  const existing = state.tasks.find((task) => task.id === data.id);
  if (existing) {
    data.done = existing.done;
    data.createdAt = existing.createdAt;
    state.tasks = state.tasks.map((task) => (task.id === data.id ? data : task));
  } else {
    state.tasks.push(data);
  }

  persist();
  clearTaskForm();
  render();
}

function editTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  taskFields.id.value = task.id;
  taskFields.title.value = task.title;
  taskFields.dueDate.value = task.dueDate || "";
  taskFields.priority.value = task.priority || "normal";
  taskFields.notes.value = task.notes || "";
  taskFields.title.focus();
}

function toggleTask(id, done) {
  state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done } : task));
  persist();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  persist();
  render();
}

function clearTaskForm() {
  el.taskForm.reset();
  taskFields.id.value = "";
}

function saveBlock(event) {
  event.preventDefault();
  if (toMinutes(blockFields.end.value) <= toMinutes(blockFields.start.value)) {
    blockFields.end.setCustomValidity("O fim precisa ser depois do início.");
    blockFields.end.reportValidity();
    return;
  }
  blockFields.end.setCustomValidity("");

  state.blocks.push({
    id: crypto.randomUUID(),
    date: state.selectedDate,
    time: blockFields.start.value,
    endTime: blockFields.end.value,
    reason: blockFields.reason.value.trim(),
  });

  el.blockForm.reset();
  blockFields.start.value = "10:00";
  blockFields.end.value = "12:00";
  persist();
  render();
}

function deleteBlock(id) {
  state.blocks = state.blocks.filter((block) => block.id !== id);
  persist();
  render();
}

function instancesForDate(dateKey) {
  return state.events
    .filter((event) => occursOn(event, dateKey))
    .map((event) => ({ ...event, date: dateKey }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function blocksForDate(dateKey) {
  return state.blocks
    .filter((block) => block.date === dateKey)
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

function eventsForCurrentMonth() {
  return instancesBetween(startOfMonth(state.viewDate), endOfMonth(state.viewDate));
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
  const blob = new Blob([JSON.stringify({ events: state.events, tasks: state.tasks, blocks: state.blocks }, null, 2)], { type: "application/json" });
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
      state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      state.blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
      persist();
      render();
    } catch {
      alert("Não consegui importar esse arquivo. Use um backup JSON exportado pela agenda.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function downloadAvailabilityImage() {
  const weekStart = startOfWeekMonday(parseDateKey(state.selectedDate));
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const slotsByDay = days.map((day) => ({
    date: toDateKey(day),
    label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(day),
    slots: availabilitySlotsForDate(toDateKey(day)),
  }));

  const width = 1400;
  const rowHeight = 48;
  const headerHeight = 150;
  const maxSlots = Math.max(1, ...slotsByDay.map((day) => day.slots.length));
  const height = headerHeight + maxSlots * rowHeight + 80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f6f7f4";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#20262a";
  ctx.font = "700 34px Segoe UI, Arial";
  ctx.fillText("Horários livres da semana", 40, 58);
  ctx.font = "600 22px Segoe UI, Arial";
  ctx.fillStyle = "#667078";
  ctx.fillText(`${formatShortDate(toDateKey(days[0]))} a ${formatShortDate(toDateKey(days[6]))}`, 40, 94);

  const gap = 14;
  const colWidth = (width - 80 - gap * 6) / 7;
  const top = 128;

  slotsByDay.forEach((day, index) => {
    const x = 40 + index * (colWidth + gap);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, top, colWidth, height - top - 40, 10);
    ctx.fill();
    ctx.strokeStyle = "#dce2df";
    ctx.stroke();

    ctx.fillStyle = "#1d6f68";
    ctx.font = "800 20px Segoe UI, Arial";
    ctx.fillText(capitalize(day.label.replace(".", "")), x + 14, top + 34);

    if (!day.slots.length) {
      ctx.fillStyle = "#667078";
      ctx.font = "700 17px Segoe UI, Arial";
      ctx.fillText("Sem livres", x + 14, top + 76);
      return;
    }

    day.slots.forEach(([start, end], slotIndex) => {
      const y = top + 56 + slotIndex * rowHeight;
      ctx.fillStyle = "#eef3f1";
      roundRect(ctx, x + 12, y, colWidth - 24, 34, 8);
      ctx.fill();
      ctx.fillStyle = "#20262a";
      ctx.font = "800 16px Segoe UI, Arial";
      ctx.fillText(`${fromMinutes(start)} - ${fromMinutes(end)}`, x + 22, y + 23);
    });
  });

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `horarios-livres-${toDateKey(days[0])}.png`;
  link.click();
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeekMonday(date) {
  const day = date.getDay() || 7;
  return addDays(date, 1 - day);
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

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function sortedTasks() {
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  return [...state.tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const dateA = a.dueDate || "9999-12-31";
    const dateB = b.dueDate || "9999-12-31";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });
}

function sortMixedItems(items) {
  return [...items].sort((a, b) => {
    const dateA = a.date || a.dueDate || "9999-12-31";
    const dateB = b.date || b.dueDate || "9999-12-31";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.time || "23:59";
    const timeB = b.time || "23:59";
    return timeA.localeCompare(timeB);
  });
}

function tasksDueOn(dateKey) {
  return state.tasks.filter((task) => task.dueDate === dateKey);
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

function labelPriority(priority) {
  return {
    high: "Alta prioridade",
    normal: "Prioridade normal",
    low: "Baixa prioridade",
  }[priority] || "Prioridade normal";
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(parseDateKey(dateKey));
}
