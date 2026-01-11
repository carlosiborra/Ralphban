(function () {
    const vscode = acquireVsCodeApi();

    const board = document.getElementById('board');
    const featureTitle = document.getElementById('feature-title');
    const featureDescription = document.getElementById('feature-description');
    const statsContainer = document.getElementById('stats-container');
    const taskCardTemplate = document.getElementById('task-card-template');

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

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                renderBoard(message.data);
                break;
        }
    });

    function renderBoard(data) {
        currentTasks = data.tasks;
        featureTitle.textContent = data.feature || 'PRD';
        featureDescription.textContent = data.description || '';

        const columns = ['pending', 'in_progress', 'completed', 'cancelled'];

        columns.forEach(status => {
            const columnEl = document.querySelector(`#${status} .task-list`);
            columnEl.innerHTML = '';

            const tasks = currentTasks.filter(t => (t.status || 'pending') === status);
            tasks.forEach(task => {
                const card = createTaskCard(task);
                columnEl.appendChild(card);
            });

            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'add-task-btn';
            addTaskBtn.textContent = '+ Add Task';
            addTaskBtn.onclick = () => openTaskForm(null, status);
            columnEl.appendChild(addTaskBtn);
        });

        renderStats(currentTasks);
    }

    function createTaskCard(task) {
        const clone = taskCardTemplate.content.cloneNode(true);
        const card = clone.querySelector('.task-card');
        
        card.querySelector('.task-category').textContent = task.category;
        
        const priorityEl = card.querySelector('.task-priority');
        priorityEl.textContent = task.priority || 'low';
        priorityEl.classList.add(task.priority?.toLowerCase() || 'low');

        card.querySelector('.task-description').textContent = task.description;
        
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
        const total = tasks.length;
        const completed = tasks.filter(t => (t.status || 'pending') === 'completed').length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        statsContainer.innerHTML = `
            <span>Total: ${total}</span>
            <span>Completed: ${completed} (${percent}%)</span>
        `;
    }

    function showTaskDetails(task) {
        modalBody.innerHTML = `
            <h2>${task.description}</h2>
            <p><strong>Status:</strong> ${task.status || 'pending'}</p>
            <p><strong>Category:</strong> ${task.category}</p>
            <p><strong>Priority:</strong> ${task.priority || 'low'}</p>

            <h3>Steps</h3>
            <ul>
                ${task.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>

            ${(task.dependencies && task.dependencies.length > 0) ? `
                <h3>Dependencies</h3>
                <ul>
                    ${task.dependencies.map(dep => `<li>${dep}</li>`).join('')}
                </ul>
            ` : ''}

            <div class="task-actions">
                <button id="edit-task-btn">Edit</button>
            </div>
        `;
        modalBody.style.display = 'block';
        taskForm.style.display = 'none';

        document.getElementById('edit-task-btn').addEventListener('click', () => {
            openTaskForm(task);
        });

        modal.style.display = 'block';
    }

    function openTaskForm(task = null, defaultStatus = 'pending') {
        editingTaskId = task ? (task.id || task.description) : null;

        modalBody.style.display = 'none';
        taskForm.style.display = 'block';

        if (task) {
            formTitle.textContent = 'Edit Task';
            taskCategory.value = task.category;
            taskPriority.value = task.priority || 'low';
            taskStatus.value = task.status || 'pending';
            taskDescription.value = task.description;
            stepsContainer.innerHTML = '';
            (task.steps || []).forEach(step => addStepInput(step));
        } else {
            formTitle.textContent = 'New Task';
            taskCategory.value = 'frontend';
            taskPriority.value = 'low';
            taskStatus.value = defaultStatus;
            taskDescription.value = '';
            stepsContainer.innerHTML = '';
            addStepInput();
        }

        modal.style.display = 'block';
    }

    function addStepInput(value = '') {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-input';
        stepDiv.innerHTML = `
            <input type="text" value="${value}" placeholder="Enter step..." required>
            <button type="button" class="remove-step-btn">&times;</button>
        `;
        stepDiv.querySelector('.remove-step-btn').addEventListener('click', () => {
            stepDiv.remove();
        });
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
        modal.style.display = 'none';
    };

    cancelEditBtn.onclick = () => {
        modal.style.display = 'none';
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

        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}());
