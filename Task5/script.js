// --- 1. Variables & State Management ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// --- 2. Functions & Array Methods ---
function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; 
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">No tasks found.</p>`;
        return;
    }

    filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
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

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// --- 3. Event Handling & Logic ---
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();

    if (taskText === '') return;

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false
    };

    tasks.push(newTask);
    saveToLocalStorage();
    renderTasks();

    taskInput.value = '';
});

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

    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveToLocalStorage();
    renderTasks();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

renderTasks();