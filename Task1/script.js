/* ========================================
   TaskFlow — JavaScript Functionality
   ======================================== */

// ──────────────────────────────────────────
// 1. VARIABLES & STATE
// ──────────────────────────────────────────

/** @type {Array<Object>} Main tasks array stored in memory */
let tasks = [];

/** Currently active view filter: "all" | "active" | "completed" */
let currentView = "all";

/** ID of the task being edited (null when adding a new task) */
let editingId = null;

/** Callback reference for the confirmation modal */
let confirmCallback = null;

// Priority sort weight mapping (object)
const PRIORITY_WEIGHT = { high: 1, medium: 2, low: 3 };

// Category emoji mapping (object)
const CATEGORY_EMOJI = {
    work: "💼",
    personal: "🏠",
    shopping: "🛒",
    health: "💪",
    education: "📚",
};

// ──────────────────────────────────────────
// 2. SELECTING HTML ELEMENTS (DOM)
// ──────────────────────────────────────────

const taskForm        = document.getElementById("taskForm");
const taskTitleInput  = document.getElementById("taskTitle");
const taskDescInput   = document.getElementById("taskDesc");
const taskCategoryEl  = document.getElementById("taskCategory");
const taskDueDateEl   = document.getElementById("taskDueDate");
const formTitleEl     = document.getElementById("formTitle");
const submitBtn       = document.getElementById("submitBtn");
const cancelBtn       = document.getElementById("cancelBtn");
const titleError      = document.getElementById("titleError");
const categoryError   = document.getElementById("categoryError");

const searchInput     = document.getElementById("searchInput");
const filterCategory  = document.getElementById("filterCategory");
const sortByEl        = document.getElementById("sortBy");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

const taskListEl      = document.getElementById("taskList");
const emptyStateEl    = document.getElementById("emptyState");

const totalCountEl    = document.getElementById("totalCount");
const activeCountEl   = document.getElementById("activeCount");
const completedCountEl = document.getElementById("completedCount");

const confirmModal    = document.getElementById("confirmModal");
const confirmMessage  = document.getElementById("confirmMessage");
const confirmYes      = document.getElementById("confirmYes");
const confirmNo       = document.getElementById("confirmNo");

const navLinks        = document.querySelectorAll(".nav-link");

// ──────────────────────────────────────────
// 3. LOCAL STORAGE — LOAD / SAVE
// ──────────────────────────────────────────

/**
 * Load tasks from localStorage into the tasks array.
 */
function loadTasks() {
    const stored = localStorage.getItem("taskflow_tasks");
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

/**
 * Save the current tasks array to localStorage.
 */
function saveTasks() {
    localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
}

// ──────────────────────────────────────────
// 4. UTILITY / HELPER FUNCTIONS
// ──────────────────────────────────────────

/**
 * Generate a simple unique ID string.
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, options);
}

/**
 * Check if a due date is in the past.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + "T00:00:00") < today;
}

/**
 * Get selected priority radio value.
 * @returns {string}
 */
function getSelectedPriority() {
    const checked = document.querySelector('input[name="taskPriority"]:checked');
    return checked ? checked.value : "medium";
}

/**
 * Set priority radio to a given value.
 * @param {string} value
 */
function setSelectedPriority(value) {
    const radio = document.querySelector(`input[name="taskPriority"][value="${value}"]`);
    if (radio) radio.checked = true;
}

// ──────────────────────────────────────────
// 5. FORM VALIDATION (Conditional Statements)
// ──────────────────────────────────────────

/**
 * Validate the task form inputs.
 * @returns {boolean} true if valid
 */
function validateForm() {
    let isValid = true;

    // Title is required and must have at least 2 characters
    const title = taskTitleInput.value.trim();
    if (title.length === 0) {
        titleError.textContent = "Task title is required.";
        taskTitleInput.classList.add("invalid");
        isValid = false;
    } else if (title.length < 2) {
        titleError.textContent = "Title must be at least 2 characters.";
        taskTitleInput.classList.add("invalid");
        isValid = false;
    } else {
        titleError.textContent = "";
        taskTitleInput.classList.remove("invalid");
    }

    // Category is required
    if (taskCategoryEl.value === "") {
        categoryError.textContent = "Please select a category.";
        taskCategoryEl.classList.add("invalid");
        isValid = false;
    } else {
        categoryError.textContent = "";
        taskCategoryEl.classList.remove("invalid");
    }

    return isValid;
}

// ──────────────────────────────────────────
// 6. CRUD OPERATIONS (Arrays, Objects, Functions)
// ──────────────────────────────────────────

/**
 * Add a new task object to the tasks array.
 */
function addTask() {
    const task = {
        id: generateId(),
        title: taskTitleInput.value.trim(),
        description: taskDescInput.value.trim(),
        category: taskCategoryEl.value,
        priority: getSelectedPriority(),
        dueDate: taskDueDateEl.value,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    saveTasks();
}

/**
 * Update an existing task in the array.
 * @param {string} id
 */
function updateTask(id) {
    // Using Array.findIndex to locate the task
    const index = tasks.findIndex(function (t) { return t.id === id; });
    if (index === -1) return;

    tasks[index].title       = taskTitleInput.value.trim();
    tasks[index].description = taskDescInput.value.trim();
    tasks[index].category    = taskCategoryEl.value;
    tasks[index].priority    = getSelectedPriority();
    tasks[index].dueDate     = taskDueDateEl.value;
    saveTasks();
}

/**
 * Delete a task by its ID.
 * Uses Array.filter to create a new array without the deleted task.
 * @param {string} id
 */
function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
}

/**
 * Toggle the completed status of a task.
 * Uses Array.find to locate the task.
 * @param {string} id
 */
function toggleComplete(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
        task.completed = !task.completed;
        saveTasks();
    }
}

/**
 * Clear all completed tasks.
 * Uses Array.filter.
 */
function clearCompleted() {
    tasks = tasks.filter(function (t) { return !t.completed; });
    saveTasks();
}

// ──────────────────────────────────────────
// 7. FILTERING, SEARCHING & SORTING (Array Methods, Loops)
// ──────────────────────────────────────────

/**
 * Return a filtered, searched, and sorted copy of the tasks array.
 * Demonstrates: .filter(), .sort(), conditional logic, loops.
 * @returns {Array<Object>}
 */
function getProcessedTasks() {
    let result = [...tasks]; // spread to avoid mutating original

    // ---- View Filter (active / completed / all) ----
    if (currentView === "active") {
        result = result.filter(function (t) { return !t.completed; });
    } else if (currentView === "completed") {
        result = result.filter(function (t) { return t.completed; });
    }

    // ---- Category Filter ----
    const catFilter = filterCategory.value;
    if (catFilter !== "all") {
        result = result.filter(function (t) { return t.category === catFilter; });
    }

    // ---- Search Filter ----
    const query = searchInput.value.trim().toLowerCase();
    if (query.length > 0) {
        result = result.filter(function (t) {
            return (
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
            );
        });
    }

    // ---- Sorting ----
    const sortMode = sortByEl.value;
    result.sort(function (a, b) {
        if (sortMode === "newest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortMode === "oldest") {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortMode === "priority") {
            return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        } else if (sortMode === "name") {
            return a.title.localeCompare(b.title);
        } else if (sortMode === "dueDate") {
            // Tasks without a due date go to the end
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });

    return result;
}

// ──────────────────────────────────────────
// 8. RENDERING — DOM MANIPULATION
// ──────────────────────────────────────────

/**
 * Render all task cards into the DOM.
 * Demonstrates: createElement, innerHTML, appendChild, removing elements.
 */
function renderTasks() {
    const processed = getProcessedTasks();

    // Clear existing cards
    taskListEl.innerHTML = "";

    // Show / hide empty state
    if (processed.length === 0) {
        emptyStateEl.style.display = "block";
    } else {
        emptyStateEl.style.display = "none";
    }

    // Loop through processed tasks and create cards
    for (let i = 0; i < processed.length; i++) {
        const task = processed[i];
        const card = createTaskCard(task);
        taskListEl.appendChild(card);
    }

    updateCounters();
}

/**
 * Create a task card DOM element.
 * @param {Object} task
 * @returns {HTMLElement}
 */
function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");
    if (task.completed) card.classList.add("completed");
    card.dataset.id = task.id;

    // Build priority tag class
    const priorityTagClass = "tag tag-priority-" + task.priority;

    // Build due date tag
    let dateTag = "";
    if (task.dueDate) {
        const overdue = isOverdue(task.dueDate) && !task.completed;
        const dateClass = overdue ? "tag tag-overdue" : "tag tag-date";
        const prefix = overdue ? "⚠ Overdue: " : "📅 ";
        dateTag = '<span class="' + dateClass + '">' + prefix + formatDate(task.dueDate) + "</span>";
    }

    // Description
    const descHtml = task.description
        ? '<p class="task-desc">' + escapeHtml(task.description) + "</p>"
        : "";

    card.innerHTML =
        '<input type="checkbox" class="task-checkbox" ' + (task.completed ? "checked" : "") + ">" +
        '<div class="task-body">' +
            '<p class="task-title">' + escapeHtml(task.title) + "</p>" +
            descHtml +
            '<div class="task-meta">' +
                '<span class="tag tag-category">' + (CATEGORY_EMOJI[task.category] || "") + " " + capitalize(task.category) + "</span>" +
                '<span class="' + priorityTagClass + '">' + capitalize(task.priority) + "</span>" +
                dateTag +
            "</div>" +
        "</div>" +
        '<div class="task-actions">' +
            '<button class="btn btn-secondary btn-sm edit-btn">✏️ Edit</button>' +
            '<button class="btn btn-danger btn-sm delete-btn">🗑️ Delete</button>' +
        "</div>";

    // ---- EVENT LISTENERS on card elements ----

    // Checkbox toggle
    const checkbox = card.querySelector(".task-checkbox");
    checkbox.addEventListener("change", function () {
        toggleComplete(task.id);
        renderTasks();
    });

    // Edit button
    const editBtn = card.querySelector(".edit-btn");
    editBtn.addEventListener("click", function () {
        startEditing(task);
    });

    // Delete button
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
        showConfirm("Delete \"" + task.title + "\"?", function () {
            deleteTask(task.id);
            renderTasks();
        });
    });

    return card;
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ──────────────────────────────────────────
// 9. DYNAMIC COUNTERS
// ──────────────────────────────────────────

/**
 * Update the header counter badges.
 * Uses Array.reduce to count completed tasks.
 */
function updateCounters() {
    const total = tasks.length;
    const completed = tasks.reduce(function (count, t) {
        return t.completed ? count + 1 : count;
    }, 0);
    const active = total - completed;

    totalCountEl.textContent     = total;
    activeCountEl.textContent    = active;
    completedCountEl.textContent = completed;
}

// ──────────────────────────────────────────
// 10. EDIT MODE (Updating Content Dynamically)
// ──────────────────────────────────────────

/**
 * Populate the form with existing task data for editing.
 * @param {Object} task
 */
function startEditing(task) {
    editingId = task.id;
    formTitleEl.textContent  = "Edit Task";
    submitBtn.textContent    = "Update Task";
    cancelBtn.style.display  = "inline-block";

    taskTitleInput.value  = task.title;
    taskDescInput.value   = task.description;
    taskCategoryEl.value  = task.category;
    taskDueDateEl.value   = task.dueDate || "";
    setSelectedPriority(task.priority);

    // Scroll form into view
    taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Reset the form back to "Add" mode.
 */
function resetForm() {
    editingId = null;
    taskForm.reset();
    formTitleEl.textContent = "Add New Task";
    submitBtn.textContent   = "Add Task";
    cancelBtn.style.display = "none";
    titleError.textContent  = "";
    categoryError.textContent = "";
    taskTitleInput.classList.remove("invalid");
    taskCategoryEl.classList.remove("invalid");
    setSelectedPriority("medium");
}

// ──────────────────────────────────────────
// 11. CONFIRMATION MODAL
// ──────────────────────────────────────────

/**
 * Show a confirmation dialog.
 * @param {string} message
 * @param {Function} onConfirm
 */
function showConfirm(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmModal.style.display = "flex";
}

function hideConfirm() {
    confirmModal.style.display = "none";
    confirmCallback = null;
}

// ──────────────────────────────────────────
// 12. EVENT LISTENERS — USER INTERACTION
// ──────────────────────────────────────────

// ---- Form Submit (Add / Update) ----
taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingId) {
        updateTask(editingId);
    } else {
        addTask();
    }

    resetForm();
    renderTasks();
});

// ---- Cancel Edit ----
cancelBtn.addEventListener("click", function () {
    resetForm();
});

// ---- Real-time input validation (Input Event) ----
taskTitleInput.addEventListener("input", function () {
    if (taskTitleInput.value.trim().length >= 2) {
        titleError.textContent = "";
        taskTitleInput.classList.remove("invalid");
    }
});

taskCategoryEl.addEventListener("change", function () {
    if (taskCategoryEl.value !== "") {
        categoryError.textContent = "";
        taskCategoryEl.classList.remove("invalid");
    }
});

// ---- Search (Input Event — live search) ----
searchInput.addEventListener("input", function () {
    renderTasks();
});

// ---- Category Filter (Change Event) ----
filterCategory.addEventListener("change", function () {
    renderTasks();
});

// ---- Sort (Change Event) ----
sortByEl.addEventListener("change", function () {
    renderTasks();
});

// ---- Navigation Links (Click Events) ----
navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        // Remove active class from all links using loop
        for (let i = 0; i < navLinks.length; i++) {
            navLinks[i].classList.remove("active");
        }
        link.classList.add("active");
        currentView = link.dataset.view;
        renderTasks();
    });
});

// ---- Clear Completed Button ----
clearCompletedBtn.addEventListener("click", function () {
    const completedCount = tasks.filter(function (t) { return t.completed; }).length;
    if (completedCount === 0) return;

    showConfirm("Clear " + completedCount + " completed task(s)?", function () {
        clearCompleted();
        renderTasks();
    });
});

// ---- Confirmation Modal Buttons ----
confirmYes.addEventListener("click", function () {
    if (typeof confirmCallback === "function") {
        confirmCallback();
    }
    hideConfirm();
});

confirmNo.addEventListener("click", function () {
    hideConfirm();
});

// Close modal on overlay click
confirmModal.addEventListener("click", function (e) {
    if (e.target === confirmModal) {
        hideConfirm();
    }
});

// ──────────────────────────────────────────
// 13. INITIALISATION
// ──────────────────────────────────────────

/**
 * Initialise the application on page load.
 */
function init() {
    loadTasks();
    renderTasks();
}

// Run on DOM ready
init();