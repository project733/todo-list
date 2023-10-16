"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("task-input");
  const addBtn = document.getElementById("add-task");
  const colID = document.querySelectorAll(".column");

  // Initialize the Kanban board columns
  const columns = [];

  for (let i = 0; i < colID.length; i++) {
    columns.push(colID[i].id);
  }

  columns.forEach((column) => {
    const columnElement = document.getElementById(column);

    // Enable drop event for columns
    columnElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const bottomTask = insertAboveTask(columnElement, e.clientY);
      const curCard = document.querySelector('.is-dragging');
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = columnElement.querySelector('ul');

      // Check if UL exists
      if (hasUL === null) {
        columnElement.appendChild(createUL).appendChild(curCard);
      } else if (hasUL.childNodes.length === 0) {
        hasUL.remove();
        columnElement.appendChild(createUL).appendChild(curCard);
      } else if (hasUL) {
        // Check position of task in vertical order
        if (!bottomTask) {
          hasUL.appendChild(curCard);
        } else {
          hasUL.insertBefore(curCard, bottomTask);
        }
      }
    });

    const insertAboveTask = (zone, mouseY) => {
      const elements = zone.querySelectorAll('.card:not(.is-dragging)');

      let closestTask = null;
      let closestOffset = Number.NEGATIVE_INFINITY;

      elements.forEach((card) => {
        const { top } = card.getBoundingClientRect();
        const offset = mouseY - top;

        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closestTask = card;
        }
      });

      return closestTask;
    };

    // Handle the drop event for columns
    columnElement.addEventListener("drop", (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData("text/plain");
      const card = document.getElementById(cardId);
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = columnElement.querySelector("ul");
      const bottomTask = insertAboveTask(columnElement, e.clientY);
      const curCard = document.querySelector('.is-dragging');

      // Check if UL exists
      if (hasUL === null) {
        columnElement.appendChild(createUL).appendChild(card);
      } else if (hasUL.childNodes.length === 0) {
        hasUL.remove();
        columnElement.appendChild(createUL).appendChild(card);
      } else if (hasUL) {
        // Check position of task in vertical order
        if (!bottomTask) {
          hasUL.appendChild(curCard);
        } else {
          hasUL.insertBefore(curCard, bottomTask);
        }
      }

      saveState();
    });

    columnElement.addEventListener("dragleave", (e) => {
      e.preventDefault();
      let hasUL = columnElement.querySelector("ul");

      setTimeout(() => {
        if (hasUL && hasUL.childNodes.length === 0) {
          hasUL.remove();
        }
      }, 700);

      saveState();
    });
  });

  // Initialize the Kanban board cards
  const cards = JSON.parse(localStorage.getItem("taskList")) || [];
  if (cards === "taskList") {
    cards.forEach((card) => {
      const cardElement = createCard(card);
      document.getElementById(card.status).appendChild(cardElement);
    });
  }

  // Create a new card
  const createCard = (cardData) => {
    const card = document.createElement("li");
    card.id = cardData.id;
    card.className = "card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-grabbed", "false");
    card.draggable = true;
    card.textContent = cardData.text;

    // Enable the drag event for cards
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.id);
      card.classList.add('is-dragging');
      card.setAttribute("aria-grabbed", "true");
    });

    card.addEventListener("dragend", (e) => {
      e.preventDefault();
      card.classList.remove('is-dragging');
      card.setAttribute("aria-grabbed", "false");
    });

    return card;
  };

  // Save the board state to local storage
  const saveState = () => {
    const savedCards = columns.reduce((acc, column) => {
      const cardsInColumn = Array.from(
        document.getElementById(column).getElementsByClassName("card")
      );
      return acc.concat(
        cardsInColumn.map((card) => ({
          id: card.id,
          text: card.textContent.replace("Delete task", ""),
          status: column,
        }))
      );
    }, []);
    localStorage.setItem("taskList", JSON.stringify(savedCards));
  };

  // Add a new card when clicking on the board
  const addTaskHandler = () => {
    const text = taskInput.value;
    // Error checking
    if (text === "") {
      alert("Please enter a task");
      return;
    }

    if (text) {
      const id = new Date().getTime().toString();
      const cardData = { id, text, status: "todo" };
      const cardElement = createCard(cardData);
      const createUL = document.createElement("ul");
      createUL.setAttribute("role", "list");
      createUL.setAttribute("aria-dropeffect", "move");
      const hasUL = document.querySelector("#todo ul");

      const cardDelete = document.createElement("button");
      cardDelete.className = "delete";
      cardDelete.textContent = "Delete task";

      if (hasUL === null) {
        document
          .getElementById("todo")
          .appendChild(createUL)
          .appendChild(cardElement);
      } else if (hasUL) {
        hasUL.appendChild(cardElement);
      }

      saveState();
      taskInput.value = "";

      document.getElementById(cardData.id).appendChild(cardDelete);

      // Delete functionality
      cardDelete.addEventListener("click", () => {
        let liCount =
          cardDelete.parentNode.parentNode.querySelectorAll("li").length;
        if (liCount > 1) {
          cardDelete.parentNode.remove();
        } else if (liCount === 1) {
          cardDelete.parentNode.parentNode.remove();
        }

        saveState();
      });
    }
  };

  addBtn.addEventListener("click", addTaskHandler);
  taskInput.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      addTaskHandler();
    }
  });
});
