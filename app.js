const TASKS_KEY = "gestaltfans.tasks";
const CATEGORIES_KEY = "gestaltfans.taskCategories";
const NOTES_KEY = "gestaltfans.notes";

function loadTasks() {
  return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadCategories() {
  return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || "[]");
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function loadNotes() {
  return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function initializeAddNotePage() {
  const finishButton = document.querySelector("#finish-note");
  const titleInput = document.querySelector("#note-name");
  const detailsInput = document.querySelector("#note-details");
  if (!finishButton || !titleInput || !detailsInput) return;

  const noteId = new URLSearchParams(window.location.search).get("id");
  const notes = loadNotes();
  const noteToEdit = noteId ? notes.find((note) => String(note.id) === noteId) : null;
  let difficulty = noteToEdit?.difficulty || 0;
  const stars = [...document.querySelectorAll(".dstar")];

  if (noteToEdit) {
    document.title = "Edit Note";
    document.querySelector("#note-form-heading").textContent = "Edit Note";
    finishButton.textContent = "Save Changes";
    titleInput.value = noteToEdit.title || "";
    detailsInput.value = noteToEdit.details || "";
    const selectedCategories = Array.isArray(noteToEdit.categories) ? noteToEdit.categories : [];
    document.querySelectorAll("[data-note-category]").forEach((checkbox) => {
      checkbox.checked = selectedCategories.includes(checkbox.dataset.noteCategory);
    });
  }

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      difficulty = index + 1;
      stars.forEach((item, itemIndex) => item.classList.toggle("on", itemIndex < difficulty));
    });
    star.classList.toggle("on", index < difficulty);
  });

  finishButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.reportValidity();
      return;
    }

    const categories = [...document.querySelectorAll("[data-note-category]")]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.noteCategory);

    const note = {
      id: noteToEdit ? noteToEdit.id : Date.now(),
      title,
      details: detailsInput.value.trim(),
      difficulty,
      categories
    };

    const updatedNotes = noteToEdit
      ? notes.map((savedNote) => savedNote.id === noteToEdit.id ? note : savedNote)
      : [...notes, note];

    saveNotes(updatedNotes);
    window.location.href = "notes_page.html?saved=1";
  });
}

function initializeNotesPage() {
  const noteList = document.querySelector("#note-list");
  if (!noteList) return;

  const notes = loadNotes();
  noteList.replaceChildren();

  if (new URLSearchParams(window.location.search).has("saved")) {
    const confirmation = document.createElement("div");
    confirmation.className = "note-confirmation";
    confirmation.textContent = "Note saved successfully!";
    noteList.appendChild(confirmation);
  }

  if (notes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "note-empty";
    empty.textContent = "No notes have been added yet.";
    noteList.appendChild(empty);
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "saved-note-card";
    card.addEventListener("click", () => {
      window.location.href = `add-note.html?id=${encodeURIComponent(note.id)}`;
    });

    const title = document.createElement("span");
    title.className = "saved-note-title";
    title.textContent = note.title;
    card.appendChild(title);

    if (note.details) {
      const details = document.createElement("span");
      details.className = "saved-note-details";
      details.textContent = note.details;
      card.appendChild(details);
    }

    if (Array.isArray(note.categories) && note.categories.length > 0) {
      const category = document.createElement("span");
      category.className = "saved-note-category";
      category.textContent = `Category: ${note.categories.join(", ")}`;
      card.appendChild(category);
    }

    noteList.appendChild(card);
  });
}

function initializeAddTaskPage() {
  const finishButton = document.querySelector("#finish-task");
  const nameInput = document.querySelector("#task-name");
  if (!finishButton || !nameInput) return;

  let difficulty = 0;
  const stars = document.querySelectorAll("[data-difficulty]");

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      difficulty = index + 1;
      stars.forEach((item) => {
        const itemIndex = [...stars].indexOf(item);
        item.classList.toggle("on", itemIndex < difficulty);
      });
    });
  });

  finishButton.addEventListener("click", () => {
    const title = nameInput.value.trim();
    if (!title) {
      nameInput.reportValidity();
      return;
    }

    const categories = [...document.querySelectorAll("[data-task-category]")]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.taskCategory);

    const tasks = loadTasks();
    tasks.push({
      id: Date.now(),
      title,
      details: document.querySelector("#task-details").value.trim(),
      difficulty,
      categories,
      completed: false
    });

    saveTasks(tasks);
    // Return to the actual tasks page after saving the task.
    window.location.href = "tasks_page.html?added=1";
  });
}

function initializeTaskPage() {
  const taskList = document.querySelector("#task-list");
  if (!taskList) return;

  const tasks = loadTasks();
  const categories = loadCategories();
  taskList.replaceChildren();

  const categoryList = document.querySelector("#category-list");
  if (categoryList) {
    categoryList.replaceChildren();

    if (new URLSearchParams(window.location.search).has("categoryAdded")) {
      const confirmation = document.createElement("div");
      confirmation.className = "category-confirmation";
      confirmation.textContent = "Category added successfully!";

      const closeButton = document.createElement("button");
      closeButton.className = "category-confirmation-close";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "Close confirmation");
      closeButton.textContent = "×";
      closeButton.addEventListener("click", () => confirmation.remove());

      confirmation.appendChild(closeButton);
      categoryList.appendChild(confirmation);
    }

    if (categories.length === 0) {
      const emptyCategories = document.createElement("p");
      emptyCategories.className = "category-empty";
      emptyCategories.textContent = "No categories have been added yet.";
      categoryList.appendChild(emptyCategories);
    } else {
      categories.forEach((category) => {
        const categoryCard = document.createElement("div");
        categoryCard.className = "saved-category-card";
        categoryCard.textContent = category.name;
        categoryList.appendChild(categoryCard);
      });
    }
  }

  if (new URLSearchParams(window.location.search).has("added")) {
    const confirmation = document.createElement("div");
    confirmation.className = "task-confirmation";
    const confirmationText = document.createElement("span");
    confirmationText.textContent = "Task added successfully!";

    const closeButton = document.createElement("button");
    closeButton.className = "task-confirmation-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close confirmation");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => confirmation.remove());

    confirmation.append(confirmationText, closeButton);
    taskList.appendChild(confirmation);
  }

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "task-empty";
    empty.textContent = "No tasks have been added yet.";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const categories = Array.isArray(task.categories) ? task.categories : [];
    const card = document.createElement("article");
    card.className = "saved-task-card";

    const row = document.createElement("label");
    row.className = "saved-task-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;

    const title = document.createElement("span");
    title.className = "saved-task-title";
    title.textContent = task.title;
    title.classList.toggle("completed-task", task.completed);

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      title.classList.toggle("completed-task", task.completed);
      saveTasks(tasks);
    });

    row.append(checkbox, title);
    card.appendChild(row);

    if (task.details) {
      const details = document.createElement("p");
      details.className = "saved-task-details";
      details.textContent = task.details;
      card.appendChild(details);
    }

    if (categories.length > 0) {
      const category = document.createElement("p");
      category.className = "saved-task-category";
      category.textContent = `Category: ${categories.join(", ")}`;
      card.appendChild(category);
    }

    taskList.appendChild(card);
  });
}

function initializeAddCategoryPage() {
  const finishButton = document.querySelector("#finish-category");
  const nameInput = document.querySelector("#category-name");
  if (!finishButton || !nameInput) return;

  finishButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.reportValidity();
      return;
    }

    const categories = loadCategories();
    categories.push({
      id: Date.now(),
      name,
      details: document.querySelector("#category-details").value.trim()
    });

    saveCategories(categories);
    // Return to the actual tasks page after saving the category.
    window.location.href = "tasks_page.html?categoryAdded=1";
  });
}

function initializeApp() {
  initializeAddNotePage();
  initializeAddTaskPage();
  initializeAddCategoryPage();
  initializeTaskPage();
  initializeNotesPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
