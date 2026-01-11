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
    const closeButton = document.querySelector('.close-button');

    let currentTasks = [];

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
        featureTitle.textContent = data.feature;
        featureDescription.textContent = data.description;

        const columns = ['pending', 'in_progress', 'completed', 'cancelled'];
        
        columns.forEach(status => {
            const columnEl = document.querySelector(`#${status} .task-list`);
            columnEl.innerHTML = '';
            
            const tasks = currentTasks.filter(t => t.status === status);
            tasks.forEach(task => {
                const card = createTaskCard(task);
                columnEl.appendChild(card);
            });
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
            if (task && task.status !== newStatus) {
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
        const completed = tasks.filter(t => t.status === 'completed').length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        statsContainer.innerHTML = `
            <span>Total: ${total}</span>
            <span>Completed: ${completed} (${percent}%)</span>
        `;
    }

    function showTaskDetails(task) {
        modalBody.innerHTML = `
            <h2>${task.description}</h2>
            <p><strong>Status:</strong> ${task.status}</p>
            <p><strong>Category:</strong> ${task.category}</p>
            <p><strong>Priority:</strong> ${task.priority || 'low'}</p>
            
            <h3>Steps</h3>
            <ul>
                ${task.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>

            ${task.dependencies.length > 0 ? `
                <h3>Dependencies</h3>
                <ul>
                    ${task.dependencies.map(dep => `<li>${dep}</li>`).join('')}
                </ul>
            ` : ''}
        `;
        modal.style.display = 'block';
    }

    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}());
