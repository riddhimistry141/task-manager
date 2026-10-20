const form = document.getElementById("task-form");
const taskApp = document.getElementById("task-app");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const noTask = document.getElementById("no-taskMsg");

const confirmModal = document.getElementById("confirm-modal");
const cancelDeleteButton = document.getElementById("cancel-delete");
const confirmDeleteButton = document.getElementById("confirm-delete");
let lastFocusedElement = null;

//secureat key
const STORAGE_KEY = "task-manager-tasks";

//loading task persist
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (savedTasks === null) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);

    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks;
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

//function of if task add or not
function updateNoTaskMessage() {
  if (taskList.children.length === 0) {
    noTask.style.display = "block";
  } else {
    noTask.style.display = "none";
  }
}

updateNoTaskMessage();

function updateTaskCounter() {
  const counter = document.getElementById("task-counter");

  let completedCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].completed) {
      completedCount++;
    }
  }

  const totalCount = tasks.length;
  const pendingCount = totalCount - completedCount;

  counter.textContent =
    "Total: " +
    totalCount +
    " | Completed: " +
    completedCount +
    " | Pending: " +
    pendingCount;
}

let tasks = loadTasks();

function renderTasks() {
  taskList.innerHTML = "";

  for (let i = 0; i < tasks.length; i++) {
    const taskItem = document.createElement("li");
    const taskName = document.createElement("span");

    taskName.textContent = tasks[i].text;

    if (tasks[i].completed) {
      taskName.classList.add("completed");
    }

    taskItem.dataset.completed = String(tasks[i].completed);

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    const completeButton = document.createElement("button");
    completeButton.textContent = tasks[i].completed ? "Mark pending" : "Complete";
    completeButton.setAttribute("aria-pressed", String(tasks[i].completed));

    // Edit a task
    editButton.addEventListener("click", function () {
      clearSuccessMessage();
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = tasks[i].text;

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";

      taskItem.replaceChild(editInput, taskName);
      taskItem.replaceChild(saveButton, editButton);
      taskItem.replaceChild(cancelButton, deleteButton);
      taskItem.removeChild(completeButton);

      saveButton.addEventListener("click", function () {
        const newTaskText = editInput.value.trim();

        if (newTaskText === "") {
          editInput.focus();
          return;
        }

        tasks[i].text = newTaskText;
        saveTasks();
        renderTasks();
        applyTaskFilter();
      });

      cancelButton.addEventListener("click", function () {
        renderTasks();
        applyTaskFilter();
      });

      editInput.focus();
    });

    // Delete a task
    deleteButton.addEventListener("click", function () {
      tasks.splice(i, 1);
      saveTasks();
      renderTasks();
      applyTaskFilter();
    });

    // Toggle completion
    completeButton.addEventListener("click", function () {
      clearSuccessMessage();
      tasks[i].completed = !tasks[i].completed;
      saveTasks();
      renderTasks();
      applyTaskFilter();
    });

    taskItem.appendChild(taskName);
    taskItem.appendChild(editButton);
    taskItem.appendChild(deleteButton);
    taskItem.appendChild(completeButton);

    taskList.appendChild(taskItem);
  }

  updateNoTaskMessage();
  updateTaskCounter();
}


function clearSuccessMessage() {
    const successMessage = document.getElementById("success-message");

    successMessage.textContent = "";
    successMessage.hidden = true;
}


// Function to add a new task and handle form submission

function addTask(event) {
  event.preventDefault();

  const taskText = taskInput.value.trim();

  if (taskText === "") {
    let errorMessage = document.getElementById("error-message");

    if (!errorMessage) {
      errorMessage = document.createElement("p");
      errorMessage.id = "error-message";
      errorMessage.style.color = "red";
      form.appendChild(errorMessage);
    }

    errorMessage.textContent = "Please enter a task.";
    return;
  }

  clearSuccessMessage();
  tasks.push({
    text: taskText,
    completed: false,
  });

  saveTasks();
  renderTasks();
  applyTaskFilter();

  taskInput.value = "";

  const errorMessage = document.getElementById("error-message");

  if (errorMessage) {
    errorMessage.remove();
  }
}

renderTasks();
// Adding event listener to the form submission
form.addEventListener("submit", addTask);

//fillter task all pending completed

const filterContainer = document.querySelector(".task-filters");

const allFilterButton = filterContainer.querySelector('[data-filter="all"]');
allFilterButton.classList.add("active");

let currentFilter = "all";

function applyTaskFilter() {
  const tasks = taskList.children;

  for (let i = 0; i < tasks.length; i++) {
    const isCompleted = tasks[i].dataset.completed === "true";

    if (
      currentFilter === "all" ||
      (currentFilter === "pending" && !isCompleted) ||
      (currentFilter === "completed" && isCompleted)
    ) {
      tasks[i].style.display = "";
    } else {
      tasks[i].style.display = "none";
    }
  }
}

filterContainer.addEventListener("click", function (event) {
  const clickedButton = event.target.closest("button");

  if (!clickedButton) {
    return;
  }

  currentFilter = clickedButton.dataset.filter;

  const filterButtons = filterContainer.querySelectorAll("button");

  for (let i = 0; i < filterButtons.length; i++) {
    filterButtons[i].classList.remove("active");
  }

  clickedButton.classList.add("active");

  applyTaskFilter();
});

taskInput.addEventListener("input", function () {
  const errorMessage = document.getElementById("error-message");

  if (errorMessage) {
    errorMessage.remove();
  }
});

const clearCompletedButton = document.getElementById("clear-completed");

clearCompletedButton.addEventListener("click", function () {
  const hasCompletedTasks = tasks.some(function (task) {
    return task.completed;
  });

  if (!hasCompletedTasks) {
    alert("There are no completed tasks to clear.");
    return;
  }

  lastFocusedElement = document.activeElement;
  taskApp.inert = true;
  taskApp.setAttribute("aria-hidden", "true");
  confirmModal.hidden = false;
  cancelDeleteButton.focus();
});

cancelDeleteButton.addEventListener("click", function () {
  closeConfirmModal();
});

confirmDeleteButton.addEventListener("click", function () {
  const deletedCount = tasks.filter(function (task) {
    return task.completed;
  }).length;
  tasks = tasks.filter(function (task) {
    return !task.completed;
  });

  saveTasks();
  renderTasks();
  applyTaskFilter();

  const successMessage = document.getElementById("success-message");

successMessage.hidden = true;
  successMessage.textContent =
    deletedCount +
    (deletedCount === 1
      ? " completed task deleted successfully."
      : " completed tasks deleted successfully.");

  successMessage.hidden = false;

  closeConfirmModal();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !confirmModal.hidden) {
    closeConfirmModal();
    return;
  }

  if (event.key === "Tab" && !confirmModal.hidden) {
    const modalControls = [cancelDeleteButton, confirmDeleteButton];
    const currentIndex = modalControls.indexOf(document.activeElement);

    if (event.shiftKey && currentIndex <= 0) {
      event.preventDefault();
      modalControls[modalControls.length - 1].focus();
    } else if (!event.shiftKey && currentIndex === modalControls.length - 1) {
      event.preventDefault();
      modalControls[0].focus();
    }
  }
});

confirmModal.addEventListener("click", function (event) {
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
});

function closeConfirmModal() {
  confirmModal.hidden = true;
  taskApp.inert = false;
  taskApp.removeAttribute("aria-hidden");

  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  } else {
    clearCompletedButton.focus();
  }
}
