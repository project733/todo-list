"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const layoutLabel = document.getElementById('label');
  const switchBtn = document.getElementById('switch');
  const boardLayout = document.getElementById('board');
  const taskInput = document.getElementById("task-input");
  const addBtn = document.getElementById("add-task-btn");
  const colID = document.querySelectorAll(".column");
  const totalTasks = document.querySelector('#task-total');

  // Initialize the Kanban board columns
  const columns = [];

  for (let i = 0; i < colID.length; i++) {
    columns.push(colID[i].id);
  }

  columns.forEach((column) => {
    const columnElement = document.getElementById(column);
    columnElement.classList.add(column);

    // Enable drop event for columns
    columnElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const bottomTask = insertAboveTask(columnElement, e.clientY);
      const curTask = document.querySelector(".is-dragging");
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = columnElement.querySelector("ul");

      // Check if UL exists
      if (hasUL === null) {
        columnElement.appendChild(createUL).appendChild(curTask);
      } else if (hasUL.childNodes.length === 0) {
        hasUL.remove();
        columnElement.appendChild(createUL).appendChild(curTask);
      } else if (hasUL) {
        // Check position of task in vertical order
        if (!bottomTask) {
          hasUL.appendChild(curTask);
        } else {
          hasUL.insertBefore(curTask, bottomTask);
        }
      }
    });

    // Logic to track position of dragged task closest to the bottom of the mouse
    const insertAboveTask = (zone, mouseY) => {
      const elements = zone.querySelectorAll(".task:not(.is-dragging)");

      let closestTask = null;
      let closestOffset = Number.NEGATIVE_INFINITY;

      elements.forEach((task) => {
        const { top } = task.getBoundingClientRect();
        const offset = mouseY - top;

        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closestTask = task;
        }
      });

      return closestTask;
    };

    // Handle the drop event for columns
    columnElement.addEventListener("drop", (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      const task = document.getElementById(taskId);
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = columnElement.querySelector("ul");
      const bottomTask = insertAboveTask(columnElement, e.clientY);
      const curTask = document.querySelector(".is-dragging");
      let totalLI = hasUL.childNodes.length;

      // Check if UL exists
      if (hasUL === null) {
        columnElement.appendChild(createUL).appendChild(task);
      } else if (totalLI === 0) {
        hasUL.remove();
        columnElement.appendChild(createUL).appendChild(task);
      } else if (hasUL) {
        // Check position of task in vertical order
        if (!bottomTask) {
          hasUL.appendChild(curTask);
        } else {
          hasUL.insertBefore(curTask, bottomTask);
        }
      }

      columnElement.querySelector('#task-total').textContent = totalLI;
      saveState();
    });

    // Track if UL exists and how many number of tasks exist from previous exited column
    columnElement.addEventListener("dragleave", (e) => {
      e.preventDefault();

      // Delay to track correct previous state
      setTimeout(() => {
        let hasUL = columnElement.querySelector("ul");
        if (hasUL && hasUL.childNodes.length === 0) {
          hasUL.previousElementSibling.querySelector('#task-total').textContent = 0;
          hasUL.remove();
        } else if (hasUL && hasUL.childNodes.length > 0) {
          hasUL.previousElementSibling.querySelector('#task-total').textContent = hasUL.childNodes.length;
        }
        
      }, 700);

      saveState();
    });
  });

  // Initialize the Kanban board tasks
  const tasks = JSON.parse(localStorage.getItem("taskList")) || [];
  if (tasks === "taskList") {
    tasks.forEach((task) => {
      const taskElement = createTask(task);
      document.getElementById(task.status).appendChild(taskElement);
    });
  }

  // Create a new task
  const createTask = (taskData) => {
    const task = document.createElement("li");
    task.id = taskData.id;
    task.className = "task";
    task.setAttribute("tabindex", "0");
    task.setAttribute("role", "listitem");
    task.setAttribute("aria-grabbed", "false");
    task.draggable = true;
    task.textContent = taskData.text;

    // Enable the drag event for tasks
    task.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", task.id);
      task.classList.add("is-dragging");
      task.setAttribute("aria-grabbed", "true");
    });

    task.addEventListener("dragend", (e) => {
      e.preventDefault();
      task.classList.remove("is-dragging");
      task.setAttribute("aria-grabbed", "false");
    });

    return task;
  };

  // Save the board state to local storage
  const saveState = () => {
    const savedTasks = columns.reduce((acc, column) => {
      const tasksInColumn = Array.from(
        document.getElementById(column).getElementsByClassName("task")
      );
      return acc.concat(
        tasksInColumn.map((task) => ({
          id: task.id,
          text: task.textContent.replace("Delete task", ""),
          status: column,
        }))
      );
    }, []);
    localStorage.setItem("taskList", JSON.stringify(savedTasks));
  };

  // Add a new task when clicking on the board
  const addTaskHandler = () => {
    const text = taskInput.value;
    // Error checking
    if (text === "") {
      alert("Please enter a task");
      return;
    }

    if (text) {
      const id = new Date().getTime().toString();
      const taskData = { id, text, status: "todo" };
      const taskElement = createTask(taskData);
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = document.querySelector("#todo ul");

      const taskDelete = document.createElement("button");
      taskDelete.className = "delete";
      taskDelete.textContent = "Delete task";

      if (hasUL === null) {
        document
          .getElementById("todo")
          .appendChild(createUL)
          .appendChild(taskElement);
      } else if (hasUL) {
        hasUL.appendChild(taskElement);
      }

      let totalLI = taskElement.parentNode.parentNode.querySelectorAll('li').length;
      totalTasks.textContent = totalLI;

      saveState();
      taskInput.value = "";

      document.getElementById(taskData.id).appendChild(taskDelete);

      // Delete task
      taskDelete.addEventListener("click", () => {
        const check = confirm("Would you like to delete the task?");

        if (check) {
          let liCount =
            taskDelete.parentNode.parentNode.querySelectorAll("li").length;
          taskDelete.parentNode.parentNode.previousElementSibling.querySelector('#task-total').textContent = liCount - 1;
          
          if (liCount > 1) {
            taskDelete.parentNode.remove();
          } else if (liCount === 1) {
            taskDelete.parentNode.parentNode.remove();
          }

          saveState();
        }
      });
    }
  };

  addBtn.addEventListener("click", addTaskHandler);
  // taskInput.addEventListener("keydown", (e) => {
  //   if (e.code === "Enter") {
  //     addTaskHandler();
  //   }
  // });

  switchBtn.addEventListener('click', () => {
    if (switchBtn.checked == true) {
      layoutLabel.textContent = 'Portrait View';
      boardLayout.classList.add('vertical');
    } else if (switchBtn.checked == false) {
      layoutLabel.textContent = 'Landscape View';
      boardLayout.classList.remove('vertical');
    }
  });
});
