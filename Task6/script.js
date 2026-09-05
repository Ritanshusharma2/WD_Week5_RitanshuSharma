// Selecting HTML Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initializing tasks array from LocalStorage or empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Function to render tasks dynamically based on filters
function renderTasks() {
    taskList.innerHTML = '';

    // Array filtering method based on selected status
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
                <input type="checkbox" ${task.completed ? 'checked' : ''} pointer-events: none;">
                <span>${escapeHtml(task.text)}</span>
            </div>
            <button class="delete-btn" data-action="delete" data-id="${task.id}">Delete</button>
        `;

        taskList.appendChild(li);
    });
}

// Function to save tasks to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Security utility to prevent basic HTML injection
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Form Event: Add new task
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

// Event Delegation for completion toggle and item deletion
taskList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action], .delete-btn, .task-content');
    if (!target) return;

    const id = Number(target.dataset.id || target.closest('li').querySelector('[data-id]').dataset.id);

    // Handle Delete Button Click
    if (e.target.classList.contains('delete-btn')) {
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
        return;
    }

    // Handle Task Completion Toggle (Clicking anywhere on the text/row)
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveToLocalStorage();
    renderTasks();
});

// Category Filtering Feature
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Initial Render on Page Load
renderTasks();