document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const taskNameInput = document.getElementById('taskNameInput');
    const taskDescriptionInput = document.getElementById('taskDescriptionInput');
    const taskDueDateInput = document.getElementById('taskDueDateInput');
    const taskEstimatedTimeInput = document.getElementById('taskEstimatedTimeInput');
    const taskLinkInput = document.getElementById('taskLinkInput'); // Get the new link input
    const taskTagsInput = document.getElementById('taskTagsInput');
    const taskSubtasksInput = document.getElementById('taskSubtasksInput');
    const taskUrgentInput = document.getElementById('taskUrgentInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    

    // Filter Elements
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterUrgency = document.getElementById('filterUrgency');
    const sortDueDate = document.getElementById('sortDueDate');

    // Display Elements
    const taskList = document.getElementById('taskList');
    const totalEstTimeDisplay = document.getElementById('totalEstTime');
    const completionPieChartCanvas = document.getElementById('completionPieChart').getContext('2d');
    let completionPieChart; // To store the chart instance

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        let filteredTasks = [...tasks];

        // 1. Search Filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }

        // 2. Status Filter
        const statusValue = filterStatus.value;
        if (statusValue === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (statusValue === 'not_completed') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        // 3. Urgency Filter
        const urgencyValue = filterUrgency.value;
        if (urgencyValue === 'urgent') {
            filteredTasks = filteredTasks.filter(task => task.isUrgent);
        } else if (urgencyValue === 'not_urgent') {
            filteredTasks = filteredTasks.filter(task => !task.isUrgent);
        }
        
        // 4. Due Date Sorting
        const sortOrder = sortDueDate.value;
        if (sortOrder !== 'none') {
            filteredTasks.sort((a, b) => {
                if (!a.dueDate) return 1; // Tasks without due dates go to the end
                if (!b.dueDate) return -1;
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                return sortOrder === 'upcoming' ? dateA - dateB : dateB - dateA;
            });
        }


        taskList.innerHTML = ''; // Clear current tasks

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li>No tasks match your criteria or no tasks added yet.</li>';
        } else {
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.setAttribute('data-id', task.id);
                if (task.completed) li.classList.add('completed');
                if (task.isUrgent) li.classList.add('urgent');

                // Task Header (Name, Meta)
                const taskHeader = document.createElement('div');
                taskHeader.className = 'task-header';

                const taskMainInfo = document.createElement('div');
                taskMainInfo.className = 'task-main-info';
                
                const taskNameEl = document.createElement('span');
                taskNameEl.textContent = task.name;
                taskMainInfo.appendChild(taskNameEl);

                const taskMeta = document.createElement('div');
                taskMeta.className = 'task-meta';
                if (task.isUrgent) {
                    const urgentIndicator = document.createElement('span');
                    urgentIndicator.className = 'urgent-indicator';
                    urgentIndicator.textContent = '🔥 Urgent';
                    taskMeta.appendChild(urgentIndicator);
                }
                if (task.dueDate) {
                    const dueDateEl = document.createElement('span');
                    dueDateEl.textContent = `Due: ${new Date(task.dueDate).toLocaleDateString()}`;
                    taskMeta.appendChild(dueDateEl);
                }
                if (task.estimatedTime > 0) {
                    const estTimeEl = document.createElement('span');
                    estTimeEl.textContent = `Est: ${task.estimatedTime}h`;
                    taskMeta.appendChild(estTimeEl);
                }
                 if (task.tags && task.tags.length > 0) {
                    const tagsEl = document.createElement('span');
                    tagsEl.textContent = `Tags: ${task.tags.join(', ')}`;
                    taskMeta.appendChild(tagsEl);
                }

                // Display the link
                if (task.link) {
                    const linkAnchor = document.createElement('a');
                    let url = task.link;
                    // Ensure the URL has a protocol for correct linking
                    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'http://' + url;
                    }
                    linkAnchor.href = url;
                    linkAnchor.textContent = '🔗 View Link'; // Or use task.link or a shortened version
                    linkAnchor.target = '_blank'; // Open in a new tab
                    linkAnchor.rel = 'noopener noreferrer'; // Security best practice
                    
                    // Wrap in a span if you want it to be part of the taskMeta flow like other items
                    const linkWrapper = document.createElement('span');
                    linkWrapper.appendChild(linkAnchor);
                    taskMeta.appendChild(linkWrapper);
                }

                taskMainInfo.appendChild(taskMeta);
                taskHeader.appendChild(taskMainInfo);
                li.appendChild(taskHeader);

                // Task Description
                if (task.description) {
                    const descEl = document.createElement('p');
                    descEl.className = 'task-description';
                    descEl.textContent = task.description;
                    li.appendChild(descEl);
                }

                // Subtasks
                if (task.subtasks && task.subtasks.length > 0) {
                    const subtasksContainer = document.createElement('div');
                    subtasksContainer.className = 'subtasks-container';
                    
                    let completedSubtasks = task.subtasks.filter(st => st.completed).length;
                    const subtasksHeader = document.createElement('h4');
                    subtasksHeader.textContent = `Subtasks (${completedSubtasks}/${task.subtasks.length} Done)`;
                    subtasksContainer.appendChild(subtasksHeader);

                    const subtasksUl = document.createElement('ul');
                    task.subtasks.forEach((subtask, index) => {
                        const subLi = document.createElement('li');
                        if (subtask.completed) subLi.classList.add('completed');
                        
                        const subCheckbox = document.createElement('input');
                        subCheckbox.type = 'checkbox';
                        subCheckbox.checked = subtask.completed;
                        subCheckbox.addEventListener('change', () => toggleSubtaskComplete(task.id, index));
                        subLi.appendChild(subCheckbox);

                        const subText = document.createElement('span');
                        subText.textContent = subtask.text;
                        subLi.appendChild(subText);
                        subtasksUl.appendChild(subLi);
                    });
                    subtasksContainer.appendChild(subtasksUl);
                    li.appendChild(subtasksContainer);
                }


                // Task Actions (Buttons)
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'task-actions';

                const completeBtn = document.createElement('button');
                completeBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
                completeBtn.classList.add('complete-btn');
                completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
                actionsDiv.appendChild(completeBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.classList.add('delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
                actionsDiv.appendChild(deleteBtn);
                li.appendChild(actionsDiv);

                taskList.appendChild(li);
            });
        }
        updateTotalEstimatedTime(filteredTasks);
        updateCompletionPieChart(); // Update chart based on all tasks
    }

    function addTask() {
        const taskName = taskNameInput.value.trim();
        if (taskName === '') {
            alert('Task name is required!');
            return;
        }
        const subtasksArray = taskSubtasksInput.value.trim()
            ? taskSubtasksInput.value.split(',').map(st => ({ text: st.trim(), completed: false }))
            : [];

        const newTask = {
            id: Date.now(),
            name: taskName,
            description: taskDescriptionInput.value.trim(),
            dueDate: taskDueDateInput.value,
            estimatedTime: parseFloat(taskEstimatedTimeInput.value) || 0,
            link: taskLinkInput.value.trim(), // Add the link to the task object
            tags: taskTagsInput.value.trim() ? taskTagsInput.value.split(',').map(tag => tag.trim()) : [],
            isUrgent: taskUrgentInput.checked,
            subtasks: subtasksArray,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        clearInputFields();
    }
    
    function clearInputFields() {
        taskNameInput.value = '';
        taskDescriptionInput.value = '';
        taskDueDateInput.value = '';
        taskEstimatedTimeInput.value = '';
        taskLinkInput.value = ''; // Clear the link input field
        taskTagsInput.value = '';
        taskSubtasksInput.value = '';
        taskUrgentInput.checked = false;
    }


    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }

    function toggleTaskComplete(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
    }

    function toggleSubtaskComplete(mainTaskId, subtaskIndex) {
        tasks = tasks.map(task => {
            if (task.id === mainTaskId) {
                const updatedSubtasks = task.subtasks.map((subtask, index) => {
                    if (index === subtaskIndex) {
                        return { ...subtask, completed: !subtask.completed };
                    }
                    return subtask;
                });
                // Optional: Auto-complete main task if all subtasks are done
                // const allSubtasksDone = updatedSubtasks.every(st => st.completed);
                // return { ...task, subtasks: updatedSubtasks, completed: allSubtasksDone };
                return { ...task, subtasks: updatedSubtasks };
            }
            return task;
        });
        saveTasks();
        renderTasks();
    }
    
    function updateTotalEstimatedTime(visibleTasks) {
        const total = visibleTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
        totalEstTimeDisplay.textContent = total.toFixed(1); // One decimal place
    }

    function updateCompletionPieChart() {
        const completedCount = tasks.filter(task => task.completed).length;
        const incompleteCount = tasks.length - completedCount;

        if (completionPieChart) {
            completionPieChart.destroy(); // Destroy previous chart instance
        }

        completionPieChart = new Chart(completionPieChartCanvas, {
            type: 'pie',
            data: {
                labels: ['Completed Tasks', 'Incomplete Tasks'],
                datasets: [{
                    label: 'Task Status',
                    data: [completedCount, incompleteCount],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)', // Greenish
                        'rgba(255, 99, 132, 0.7)'  // Reddish
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Task Completion Overview'
                    }
                }
            }
        });
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    searchInput.addEventListener('input', renderTasks);
    filterStatus.addEventListener('change', renderTasks);
    filterUrgency.addEventListener('change', renderTasks);
    sortDueDate.addEventListener('change', renderTasks);

    // Initial Render
    renderTasks();
});