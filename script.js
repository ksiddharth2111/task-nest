const STORAGE_KEY = "kanbanTasks";
const defaultTasks = [
  {
    id: "task-1",
    title: "Gather requirements",
    description: "Collect priorities and deadlines for the next sprint.",
    status: "todo",
    priority: "high",
    dueDate: "",
    labels: ["Planning"],
  },
  {
    id: "task-2",
    title: "Design homepage",
    description: "Create wireframes and label styling rules.",
    status: "in-progress",
    priority: "medium",
    dueDate: "",
    labels: ["Design"],
  },
  {
    id: "task-3",
    title: "QA bug fixes",
    description: "Resolve client-reported issues and regression tests.",
    status: "done",
    priority: "low",
    dueDate: "",
    labels: ["Bug"],
  },
];

const addTaskButton = document.getElementById("addTaskButton");
const addTaskButtonFloat = document.getElementById("addTaskButtonFloat");
const taskModal = document.getElementById("taskModal");
const closeModalButton = document.getElementById("closeModal");
const cancelButton = document.getElementById("cancelButton");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const saveButton = document.getElementById("saveButton");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskStatus = document.getElementById("taskStatus");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");
const taskLabels = document.getElementById("taskLabels");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const board = document.getElementById("board");

let tasks = loadTasks();
let editingTaskId = null;
let draggedTaskId = null;

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to parse stored tasks", error);
  }
  return defaultTasks;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function openModal(task = null) {
  taskModal.classList.remove("hidden");
  if (task) {
    modalTitle.textContent = "Edit Task";
    saveButton.textContent = "Save Task";
    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskStatus.value = task.status;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate;
    taskLabels.value = task.labels.join(", ");
    editingTaskId = task.id;
  } else {
    modalTitle.textContent = "New Task";
    saveButton.textContent = "Add Task";
    taskForm.reset();
    editingTaskId = null;
  }
}

function closeModal() {
  taskModal.classList.add("hidden");
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <h3>${escapeHtml(task.title)}</h3>
    <p>${escapeHtml(task.description)}</p>
    <div class="meta-row">
      <span class="badge ${task.priority}">${capitalize(task.priority)}</span>
      ${task.dueDate ? `<span class="badge">Due ${task.dueDate}</span>` : ""}
    </div>
    <div class="label-list">
      ${task.labels.map((label) => `<span class="label">${escapeHtml(label)}</span>`).join("")}
    </div>
    <div class="task-actions">
      <button type="button" class="edit-button">Edit</button>
      <button type="button" class="delete delete-button">Delete</button>
    </div>
  `;

  card.addEventListener("dragstart", () => {
    draggedTaskId = task.id;
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    draggedTaskId = null;
    card.classList.remove("dragging");
  });

  card.querySelector(".edit-button").addEventListener("click", () => {
    openModal(task);
  });

  card.querySelector(".delete-button").addEventListener("click", () => {
    deleteTask(task.id);
  });

  return card;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBoard() {
  const listIds = {
    todo: "todoList",
    "in-progress": "inProgressList",
    done: "doneList",
  };

  ["todo", "in-progress", "done"].forEach((status) => {
    const list = document.getElementById(listIds[status]);
    list.innerHTML = "";
    const filtered = tasks.filter((task) => {
      const statusMatches = statusFilter.value === "all" || task.status === statusFilter.value;
      const priorityMatches = priorityFilter.value === "all" || task.priority === priorityFilter.value;
      return task.status === status && statusMatches && priorityMatches;
    });

    filtered.forEach((task) => list.appendChild(createTaskCard(task)));
  });
}

function getTaskById(id) {
  return tasks.find((task) => task.id === id);
}

function addOrUpdateTask(event) {
  event.preventDefault();
  const labels = taskLabels.value
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  const newTask = {
    id: editingTaskId || `task-${Date.now()}`,
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    status: taskStatus.value,
    priority: taskPriority.value,
    dueDate: taskDueDate.value,
    labels,
  };

  if (editingTaskId) {
    tasks = tasks.map((task) => (task.id === editingTaskId ? newTask : task));
  } else {
    tasks.push(newTask);
  }

  saveTasks();
  renderBoard();
  closeModal();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderBoard();
}

function handleDrop(event, targetStatus) {
  event.preventDefault();
  if (!draggedTaskId) return;
  tasks = tasks.map((task) =>
    task.id === draggedTaskId ? { ...task, status: targetStatus } : task
  );
  saveTasks();
  renderBoard();
}

function handleDragOver(event) {
  event.preventDefault();
}

addTaskButton.addEventListener("click", () => openModal());
addTaskButtonFloat.addEventListener("click", () => openModal());
closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);
taskModal.addEventListener("click", (event) => {
  if (event.target === taskModal) closeModal();
});
taskForm.addEventListener("submit", addOrUpdateTask);
statusFilter.addEventListener("change", renderBoard);
priorityFilter.addEventListener("change", renderBoard);

board.querySelectorAll(".column").forEach((column) => {
  column.addEventListener("dragover", handleDragOver);
  column.addEventListener("drop", (event) => handleDrop(event, column.dataset.status));
});

renderBoard();
