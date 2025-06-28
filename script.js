document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const taskPriority = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const filterAll = document.getElementById('filter-all');
    const filterActive = document.getElementById('filter-active');
    const filterCompleted = document.getElementById('filter-completed');
    const clearCompleted = document.getElementById('clear-completed');
    const clearAll = document.getElementById('clear-all');
    const sortBy = document.getElementById('sort-by');
    const sortDirection = document.getElementById('sort-direction');
    const totalTasksSpan = document.getElementById('total-tasks');
    const completedTasksSpan = document.getElementById('completed-tasks');
    const notification = document.getElementById('notification');

    // State variables
    let tasks = [];
    let currentFilter = 'all';
    let currentSort = { by: 'added', direction: 'asc' };

    // Initialize the app
    function init() {
        loadTasks();
        renderTasks();
        updateStats();
        setupEventListeners();
    }

    // Load tasks from localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStats();
    }

    // Add a new task
    function addTask(text, date, priority, completed = false, id = Date.now()) {
        if (!text.trim()) return;

        const newTask = {
            id,
            text: text.trim(),
            date,
            priority,
            completed,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        showNotification('Task added successfully!');
    }

    // Edit an existing task
    function editTask(id, newText, newDate, newPriority) {
        const task = tasks.find(task => task.id === id);
        if (task && newText.trim()) {
            task.text = newText.trim();
            task.date = newDate;
            task.priority = newPriority;
            saveTasks();
            renderTasks();
            showNotification('Task updated successfully!');
            return true;
        }
        return false;
    }

    // Toggle task completion status
    function toggleTaskCompletion(id) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            const action = task.completed ? 'completed' : 'marked as active';
            showNotification(`Task ${action}!`);
        }
    }

    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        showNotification('Task deleted!');
    }

    // Clear all completed tasks
    function clearCompletedTasks() {
        if (tasks.some(task => task.completed)) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            showNotification('Completed tasks cleared!');
        } else {
            showNotification('No completed tasks to clear!', 'warning');
        }
    }

    // Clear all tasks
    function clearAllTasks() {
        if (tasks.length > 0) {
            if (confirm('Are you sure you want to delete ALL tasks?')) {
                tasks = [];
                saveTasks();
                renderTasks();
                showNotification('All tasks cleared!');
            }
        } else {
            showNotification('No tasks to clear!', 'warning');
        }
    }

    // Filter tasks
    function filterTasks(filter) {
        currentFilter = filter;
        updateActiveFilterButton();
        renderTasks();
    }

    // Search tasks
    function searchTasks(query) {
        renderTasks();
    }

    // Sort tasks
    function sortTasks() {
        renderTasks();
    }

    // Update which filter button is active
    function updateActiveFilterButton() {
        [filterAll, filterActive, filterCompleted].forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (currentFilter === 'all') filterAll.classList.add('active');
        if (currentFilter === 'active') filterActive.classList.add('active');
        if (currentFilter === 'completed') filterCompleted.classList.add('active');
    }

    // Update task statistics
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        
        totalTasksSpan.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
        completedTasksSpan.textContent = `${completed} completed`;
    }

    // Show notification
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'notification';
        
        // Set background color based on type
        if (type === 'success') {
            notification.style.backgroundColor = 'var(--success-color)';
        } else if (type === 'warning') {
            notification.style.backgroundColor = 'var(--warning-color)';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'var(--danger-color)';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Render tasks to the DOM
    function renderTasks() {
        // Clear the task list
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'No tasks found. Add a new task above!';
            emptyMessage.className = 'empty-message';
            taskList.appendChild(emptyMessage);
            return;
        }
        
        // Filter tasks
        let filteredTasks = [...tasks];
        
        // Apply search filter
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply status filter
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Sort tasks
        filteredTasks.sort((a, b) => {
            let comparison = 0;
            
            switch (currentSort.by) {
                case 'added':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'due':
                    if (!a.date && !b.date) comparison = 0;
                    else if (!a.date) comparison = 1;
                    else if (!b.date) comparison = -1;
                    else comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                    break;
                case 'alphabetical':
                    comparison = a.text.localeCompare(b.text);
                    break;
            }
            
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority}-priority`;
            if (task.completed) taskItem.classList.add('completed');
            
            // Format due date
            let dueDateText = 'No due date';
            if (task.date) {
                const dueDate = new Date(task.date);
                dueDateText = dueDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                // Add warning if task is overdue
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(task.date) < today && !task.completed) {
                    dueDateText += ' (Overdue)';
                    taskItem.classList.add('overdue');
                }
            }
            
            taskItem.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-details">
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                    <span class="task-date">${dueDateText}</span>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            
            editBtn.addEventListener('click', () => {
                const newText = prompt('Edit task:', task.text);
                if (newText !== null) {
                    const newDate = prompt('Edit due date (YYYY-MM-DD):', task.date || '');
                    const newPriority = prompt('Edit priority (low/medium/high):', task.priority);
                    
                    if (newPriority && !['low', 'medium', 'high'].includes(newPriority.toLowerCase())) {
                        showNotification('Priority must be low, medium, or high', 'error');
                        return;
                    }
                    
                    editTask(
                        task.id, 
                        newText, 
                        newDate || null, 
                        newPriority ? newPriority.toLowerCase() : task.priority
                    );
                }
            });
            
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(task.id);
                }
            });
            
            taskList.appendChild(taskItem);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        // Form submission
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTask(taskInput.value, taskDate.value || null, taskPriority.value);
            taskInput.value = '';
            taskDate.value = '';
            taskPriority.value = 'medium';
            taskInput.focus();
        });
        
        // Filter buttons
        filterAll.addEventListener('click', () => filterTasks('all'));
        filterActive.addEventListener('click', () => filterTasks('active'));
        filterCompleted.addEventListener('click', () => filterTasks('completed'));
        
        // Clear buttons
        clearCompleted.addEventListener('click', clearCompletedTasks);
        clearAll.addEventListener('click', clearAllTasks);
        
        // Search input
        searchInput.addEventListener('input', () => searchTasks(searchInput.value));
        
        // Sort options
        sortBy.addEventListener('change', function() {
            currentSort.by = this.value;
            sortTasks();
        });
        
        sortDirection.addEventListener('change', function() {
            currentSort.direction = this.value;
            sortTasks();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Focus search on Ctrl/Cmd + F
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
            
            // Focus task input on /
            if (e.key === '/' && document.activeElement !== taskInput) {
                e.preventDefault();
                taskInput.focus();
            }
        });
    }

    // Initialize the app
    init();
});