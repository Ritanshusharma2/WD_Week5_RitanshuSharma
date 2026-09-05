// --- 1. Variables & State Management ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initializing tasks array from LocalStorage or empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// --- 2. Functions & Array Methods ---
function renderTasks() {
    taskList.innerHTML = '';

    // Array Method (.filter) combined with Conditional Statements
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; // 'all' case
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">No tasks found.</p>`;
        return;
    }

    // Iteration method (.forEach) acting as a loop over objects
    filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        // --- 3. Objects & Dynamic HTML Generation ---
        li.innerHTML = `
            <div class="task-content" data-action="toggle" data-id="${task.id}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} style="pointer-events: none;">
                <span>${escapeHtml(task.text)}</span>
            </div>
            <button class="delete-btn" data-action="delete" data-id="${task.id}">Delete</button>
        `;

        taskList.appendChild(li);
    });
}

// Function to sync with browser storage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Security utility function
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// --- 4. Event Handling & Conditional Logic ---
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();

    // Conditional statement for input validation
    if (taskText === '') return;

    // Object creation for a new task item
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false
    };

    // Array method (.push) to append data
    tasks.push(newTask);
    saveToLocalStorage();
    renderTasks();

    taskInput.value = '';
});

// Event Delegation handling state mutations via array .map() and .filter()
taskList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action], .delete-btn, .task-content');
    if (!target) return;

    const id = Number(target.dataset.id || target.closest('li').querySelector('[data-id]').dataset.id);

    if (e.target.classList.contains('delete-btn')) {
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
        return;
    }

    // Map method updating specific object properties conditionally
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveToLocalStorage();
    renderTasks();
});

// Filter controls loop assignment
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

renderTasks();