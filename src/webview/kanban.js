(function () {
    const vscode = acquireVsCodeApi();

    const board = document.getElementById('board');
    const featureTitle = document.getElementById('feature-title');
    const featureDescription = document.getElementById('feature-description');
    const statsContainer = document.getElementById('stats-container');
    const taskCardTemplate = document.getElementById('task-card-template');
    const searchInput = document.getElementById('search-input');
    const filterCategory = document.getElementById('filter-category');
    const filterPriority = document.getElementById('filter-priority');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Modal elements
    const modal = document.getElementById('task-modal');
    const modalBody = document.getElementById('modal-body');
    const modalBodyContainer = document.querySelector('.modal-body-container');
    const closeButton = document.querySelector('.close-button');

    // Form elements
    const taskForm = document.getElementById('task-form');
    const formTitle = document.getElementById('form-title');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const taskStatus = document.getElementById('task-status');
    const taskDescription = document.getElementById('task-description');
    const stepsContainer = document.getElementById('steps-container');
    const addStepBtn = document.getElementById('add-step-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    let currentTasks = [];
    let editingTaskId = null;
    let filters = {
        search: '',
        category: '',
        priority: ''
    };

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                renderBoard(message.data);
                break;
        }
    });

    // Filter event listeners
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase();
        applyFilters();
    });

    filterCategory.addEventListener('change', (e) => {
        filters.category = e.target.value;
        applyFilters();
    });

    filterPriority.addEventListener('change', (e) => {
        filters.priority = e.target.value;
        applyFilters();
    });

    clearFiltersBtn.addEventListener('click', () => {
        filters = { search: '', category: '', priority: '' };
        searchInput.value = '';
        filterCategory.value = '';
        filterPriority.value = '';
        applyFilters();
    });

    function renderBoard(data) {
        currentTasks = data.tasks;
        featureTitle.textContent = data.feature || 'PRD';
        const renderMarkdown = typeof window.marked !== 'undefined' ? window.marked.parse : (text) => text;
        featureDescription.innerHTML = renderMarkdown(data.description || '');

        const filteredTasks = getFilteredTasks(currentTasks);
        
        // Show/hide clear filters button
        const hasActiveFilters = filters.search || filters.category || filters.priority;
        clearFiltersBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';

        if (hasActiveFilters && filteredTasks.length === 0) {
            board.classList.add('no-results');
            if (!document.getElementById('no-results-msg')) {
                const msg = document.createElement('div');
                msg.id = 'no-results-msg';
                msg.className = 'empty-state-message';
                
                let filterDesc = '';
                if (filters.search) filterDesc = ` matching "<strong>${filters.search}</strong>"`;
                else if (filters.category || filters.priority) filterDesc = ` in the selected ${filters.category && filters.priority ? 'category and priority' : filters.category ? 'category' : 'priority'}`;

                msg.innerHTML = `No tasks ${filterDesc}. <button id="reset-link">Clear filters</button>`;
                board.prepend(msg);
                document.getElementById('reset-link').onclick = () => clearFiltersBtn.click();
            }
        } else {
            board.classList.remove('no-results');
            const msg = document.getElementById('no-results-msg');
            if (msg) msg.remove();
        }

        const columns = ['pending', 'in_progress', 'completed', 'cancelled'];

        columns.forEach(status => {
            const columnEl = document.querySelector(`#${status} .task-list`);
            columnEl.innerHTML = '';

            const tasks = filteredTasks.filter(t => (t.status || 'pending') === status);
            tasks.forEach(task => {
                const card = createTaskCard(task);
                if (card) columnEl.appendChild(card);
            });

            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'add-task-btn';
            addTaskBtn.type = 'button';
            addTaskBtn.textContent = '+ Add Task';
            addTaskBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openTaskForm(null, status);
            };
            columnEl.appendChild(addTaskBtn);
        });

        renderStats(filteredTasks);
    }

    function applyFilters() {
        renderBoard({ tasks: currentTasks, feature: featureTitle.textContent, description: featureDescription.textContent });
    }

    function getFilteredTasks(tasks) {
        return tasks.filter(task => {
            const matchesSearch = !filters.search || 
                task.description.toLowerCase().includes(filters.search) ||
                (task.steps && task.steps.some(step => step.toLowerCase().includes(filters.search)));
            
            const matchesCategory = !filters.category || task.category === filters.category;
            
            const matchesPriority = !filters.priority || (task.priority || 'low') === filters.priority;
            
            return matchesSearch && matchesCategory && matchesPriority;
        });
    }

    function createTaskCard(task) {
        const clone = taskCardTemplate.content.cloneNode(true);
        const card = clone.querySelector('.task-card');

        card.querySelector('.task-category').textContent = task.category;

        const priorityEl = card.querySelector('.task-priority');
        priorityEl.textContent = task.priority || 'low';
        priorityEl.classList.add(task.priority?.toLowerCase() || 'low');

        const descEl = card.querySelector('.task-description');
        descEl.innerHTML = typeof window.marked !== 'undefined' ? window.marked.parse(task.description) : task.description;
        
        const stepsCount = task.steps?.length || 0;
        card.querySelector('.task-steps-count').textContent = `Steps: ${stepsCount}`;
        
        const depsCount = task.dependencies?.length || 0;
        card.querySelector('.task-dependencies-count').textContent = `Deps: ${depsCount}`;

        card.addEventListener('click', () => showTaskDetails(task));

        // Drag and Drop
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id || task.description);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        return card;
    }

    // Setup drop zones for columns
    document.querySelectorAll('.column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.id;
            
            const task = currentTasks.find(t => (t.id || t.description) === taskId);
            if (task && (task.status || 'pending') !== newStatus) {
                // Optimistic UI update
                task.status = newStatus;
                renderBoard({ tasks: currentTasks, feature: featureTitle.textContent, description: featureDescription.textContent });
                
                // Notify extension
                vscode.postMessage({
                    type: 'updateTaskStatus',
                    taskId: taskId,
                    newStatus: newStatus
                });
            }
        });
    });

    function renderStats(tasks) {
        const total = currentTasks.length;
        const filtered = tasks.length;
        const completed = tasks.filter(t => (t.status || 'pending') === 'completed').length;
        const percent = filtered > 0 ? Math.round((completed / filtered) * 100) : 0;

        const hasActiveFilters = filters.search || filters.category || filters.priority;

        statsContainer.innerHTML = `
            <span>${hasActiveFilters ? `Showing ${filtered} of ${total} tasks` : `Total Tasks: ${total}`}</span>
            <span>Completed: ${completed} (${percent}%)</span>
        `;
    }

    function showTaskDetails(task) {
        const taskId = task.id || task.description;
        const renderMarkdown = typeof window.marked !== 'undefined' ? window.marked.parse : (text) => text;
        modalBody.innerHTML = `
            <div class="task-detail-description">${renderMarkdown(task.description)}</div>
            <p><strong>Status:</strong> ${task.status || 'pending'}</p>
            <p><strong>Category:</strong> ${task.category}</p>
            <p><strong>Priority:</strong> ${task.priority || 'low'}</p>

            <h3>Steps</h3>
            <ul class="markdown-content">
                ${task.steps.map(step => `<li>${renderMarkdown(step)}</li>`).join('')}
            </ul>

            ${(task.dependencies && task.dependencies.length > 0) ? `
                <h3>Dependencies</h3>
                <ul class="markdown-content">
                    ${task.dependencies.map(dep => `<li>${renderMarkdown(dep)}</li>`).join('')}
                </ul>
            ` : ''}

            <div class="task-actions">
                <button id="edit-task-btn">Edit</button>
                <button id="delete-task-btn" class="delete-task-btn">Delete</button>
            </div>
        `;
        modalBody.style.display = 'block';
        taskForm.style.display = 'none';

        document.getElementById('edit-task-btn').addEventListener('click', () => {
            openTaskForm(task);
        });

        document.getElementById('delete-task-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                vscode.postMessage({ type: 'deleteTask', taskId });
                hideModal();
            }
        });

        showModal();
    }

    function showModal() {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    function openTaskForm(task = null, defaultStatus = 'pending') {
        editingTaskId = task ? (task.id || task.description) : null;

        if (modalBody) modalBody.style.display = 'none';
        if (taskForm) taskForm.style.display = 'block';

        if (task) {
            formTitle.textContent = 'Edit Task';
            if (taskCategory) taskCategory.value = task.category;
            if (taskPriority) taskPriority.value = task.priority || 'low';
            if (taskStatus) taskStatus.value = task.status || 'pending';
            if (taskDescription) taskDescription.value = task.description;
            stepsContainer.innerHTML = '';
            (task.steps || []).forEach(step => addStepInput(step));
        } else {
            formTitle.textContent = 'New Task';
            if (taskCategory) taskCategory.value = 'frontend';
            if (taskPriority) taskPriority.value = 'low';
            if (taskStatus) taskStatus.value = defaultStatus;
            if (taskDescription) taskDescription.value = '';
            stepsContainer.innerHTML = '';
            addStepInput();
        }

        showModal();
    }

    function addStepInput(value = '') {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-input';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = 'Enter step...';
        input.required = true;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-step-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => stepDiv.remove();

        stepDiv.appendChild(input);
        stepDiv.appendChild(removeBtn);
        stepsContainer.appendChild(stepDiv);
    }

    function getStepsFromForm() {
        const stepInputs = stepsContainer.querySelectorAll('.step-input input');
        const steps = [];
        stepInputs.forEach(input => {
            if (input.value.trim()) {
                steps.push(input.value.trim());
            }
        });
        return steps;
    }

    function validateForm() {
        if (!taskDescription.value.trim()) {
            vscode.postMessage({ type: 'onError', data: 'Description is required' });
            return false;
        }
        if (!taskCategory.value) {
            vscode.postMessage({ type: 'onError', data: 'Category is required' });
            return false;
        }
        return true;
    }

    closeButton.onclick = () => {
        hideModal();
    };

    cancelEditBtn.onclick = () => {
        hideModal();
    };

    addStepBtn.onclick = () => {
        addStepInput();
    };

    taskForm.onsubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const task = {
            description: taskDescription.value.trim(),
            category: taskCategory.value,
            priority: taskPriority.value,
            status: taskStatus.value,
            steps: getStepsFromForm(),
            passes: false
        };

        if (editingTaskId) {
            task.id = editingTaskId;
            vscode.postMessage({ type: 'updateTask', task });
        } else {
            vscode.postMessage({ type: 'createTask', task });
        }

        hideModal();
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            hideModal();
        }
    };
}());
