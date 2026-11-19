//keys used to identify each type of data in browser's localStorage
const TASKS_KEY = "gestaltfans.tasks";
const CATEGORIES_KEY = "gestaltfans.taskCategories";
const NOTES_KEY = "gestaltfans.notes";

//limit note's detail shown on Notes page (detail is shown when note is clicked on)
const NOTE_PREVIEW_LIMIT = 120;

//read saved tasks from localStorage, uses empty array when no tasks saved
function loadTasks() {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
}

//converts tasks array to JSON and save to localStorage
function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

//read saved task categories from localStorage
function loadCategories() {
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || "[]");
}

//save current task categories in localStorage
function saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

//return id from an edit URL, or null when form is creating a new item
function getEditId() {
    return new URLSearchParams(window.location.search).get("id");
}

//confirmation query parameters are one time messages so remove them beforere-rendering page after an item is removed
function clearTaskPageConfirmationParams() {
    const url = new URL(window.location.href);
    ["added", "updated", "categoryAdded", "categoryUpdated"].forEach((parameter) => {
        url.searchParams.delete(parameter);
    });
    window.history.replaceState({}, "", url);
}

//read saved notes from localStorage
function loadNotes() {
  return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
}

//save current notes array in localStorage
function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

//set up form used for creating new note and editing existing note
function initializeAddNotePage() {
    //find controls that are only present on add-note.html
    const finishButton = document.querySelector("#finish-note");
    const titleInput = document.querySelector("#note-name");
    const detailsInput = document.querySelector("#note-details");
    if (!finishButton || !titleInput || !detailsInput) return;

    //id in the URL is for user clicking existing note to view/edit, no id = new note
    const noteId = new URLSearchParams(window.location.search).get("id");
    const notes = loadNotes();
    const noteToEdit = noteId ? notes.find((note) => String(note.id) === noteId) : null;
    let difficulty = noteToEdit?.difficulty || 0;
    const stars = [...document.querySelectorAll(".dstar")];

    if (noteToEdit) {
        //fill form with selected note's existing values
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
        //clicking star sets the difficulty to star's position
        star.addEventListener("click", () => {

            difficulty = index + 1;
            stars.forEach((item, itemIndex) => item.classList.toggle("on", itemIndex < difficulty));
        });

        star.classList.toggle("on", index < difficulty);
    });

    finishButton.addEventListener("click", () => {

        //title requirement for note (no title = do not save)
        const title = titleInput.value.trim();
        if (!title) {

            titleInput.reportValidity();
            return;
        }

        //collects names of all selected categories
        const categories = [...document.querySelectorAll("[data-note-category]")].filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.dataset.noteCategory);

        //create object to be stored for this note, reuse existing id when editing note
        const note = {
            id: noteToEdit ? noteToEdit.id : Date.now(),
            title,
            details: detailsInput.value.trim(),
            difficulty,
            categories
        };

        //replace matching note when editing, otherwise append new note
        const updatedNotes = noteToEdit
        ? notes.map((savedNote) => savedNote.id === noteToEdit.id ? note : savedNote)
        : [...notes, note];

        saveNotes(updatedNotes);
        //return to Notes page after saving
        window.location.href = "notes_page.html?saved=1";
    });
}

//render all saved notes on the Notes page
function initializeNotesPage() {
    const noteList = document.querySelector("#note-list");
    if (!noteList) return;

    const notes = loadNotes();
    //remove placeholder notes from HTML before adding saved notes
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
        //each note gets button to be clicked for editing
        const card = document.createElement("button");
        card.type = "button";
        card.className = "saved-note-card";
        card.addEventListener("click", () => {
            //pass note id in the IRL so the edit form knows which note to load
            window.location.href = `add-note.html?id=${encodeURIComponent(note.id)}`;
        });

        const title = document.createElement("span");
        title.className = "saved-note-title";
        title.textContent = note.title;
        card.appendChild(title);

        if (note.details) {
            const details = document.createElement("span");
            details.className = "saved-note-details";
            //keep full details in localStorage, but only show preview on Notes page
            details.textContent = note.details.length > NOTE_PREVIEW_LIMIT
            ? `${note.details.slice(0, NOTE_PREVIEW_LIMIT).trimEnd()}…`
            : note.details;
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
    //elements exist only on add-task.html
    const finishButton = document.querySelector("#finish-task");
    const nameInput = document.querySelector("#task-name");
    if (!finishButton || !nameInput) return;

    const taskId = getEditId();
    const tasks = loadTasks();
    const taskToEdit = taskId ? tasks.find((task) => String(task.id) === taskId) : null;

    //keep track of difficulty stars the user selected
    let difficulty = taskToEdit?.difficulty || 0;

    if (taskToEdit) {
        document.title = "Edit Task";
        nameInput.value = taskToEdit.title || "";
        document.querySelector("#task-details").value = taskToEdit.details || "";
        document.querySelector("#task-date").value = taskToEdit.dueDate || "";
        finishButton.textContent = "Save Task Changes";
    }

    //build category options from saved categories so edits use current data
    const categoryList = document.querySelector(".dropdown--lg ul");
    const savedCategories = loadCategories();
    const existingTaskCategories = Array.isArray(taskToEdit?.categories) ? taskToEdit.categories : [];
    const categoryNames = [...new Set([
        ...savedCategories.map((category) => category.name),
        ...existingTaskCategories,
        ...(savedCategories.length === 0 && existingTaskCategories.length === 0
            ? ["Category 1", "Category 2", "Category 3"]
            : [])
    ])];
    if (categoryList) {
        categoryList.replaceChildren();

        categoryNames.forEach((categoryName) => {
            const item = document.createElement("li");
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.dataset.taskCategory = categoryName;
            checkbox.checked = existingTaskCategories.includes(categoryName);
            label.append(checkbox, document.createTextNode(` ${categoryName}`));
            item.appendChild(label);
            categoryList.appendChild(item);
        });

        if (categoryNames.length === 0) {
            const empty = document.createElement("li");
            empty.textContent = "No categories available yet.";
            categoryList.appendChild(empty);
        }
    }

    //find the five difficulty stars on the task form
    const stars = document.querySelectorAll(".dstar");

    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            difficulty = index + 1;
            stars.forEach((item) => {
                const itemIndex = [...stars].indexOf(item);
            item.classList.toggle("on", itemIndex < difficulty);
            });
        });

        star.classList.toggle("on", index < difficulty);
    });

    finishButton.addEventListener("click", () => {
        const title = nameInput.value.trim();
        if (!title) {
            nameInput.reportValidity();
            return;
        }

        //collect every checked task category
        const categories = [...document.querySelectorAll("[data-task-category]")].filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.dataset.taskCategory);

        //reuse existing id and completion state during an edit
        const task = {
            id: taskToEdit ? taskToEdit.id : Date.now(),
            title,
            details: document.querySelector("#task-details").value.trim(),
            difficulty,
            dueDate: document.querySelector("#task-date").value,
            categories,
            completed: taskToEdit ? Boolean(taskToEdit.completed) : false
        };

        const updatedTasks = taskToEdit
            ? tasks.map((savedTask) => savedTask.id === taskToEdit.id ? task : savedTask)
            : [...tasks, task];

        saveTasks(updatedTasks);
        //return to actual tasks page after saving task
        window.location.href = `tasks_page.html?${taskToEdit ? "updated=1" : "added=1"}`;
    });
}

function initializeTaskPage() {
    //task list only present on tasks_page.html (for now*)
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

        if (new URLSearchParams(window.location.search).has("categoryUpdated")) {
            const confirmation = document.createElement("div");
            confirmation.className = "category-confirmation";
            confirmation.textContent = "Category updated successfully!";

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
        }

        else {
            categories.forEach((category) => {
            const categoryCard = document.createElement("div");
            categoryCard.className = "saved-category-card";

            const categoryName = document.createElement("span");
            categoryName.className = "saved-category-name";
            categoryName.textContent = category.name;

            const categoryActions = document.createElement("div");
            categoryActions.className = "saved-item-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "item-action item-action--edit";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                window.location.href = `add-category-task.html?id=${encodeURIComponent(category.id)}`;
            });

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "item-action item-action--remove";
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => {
                if (!window.confirm(`Remove the category “${category.name}”?`)) return;

                const remainingCategories = loadCategories().filter(
                    (savedCategory) => savedCategory.id !== category.id
                );
                saveCategories(remainingCategories);

                //detach removed category from every task that used it
                const updatedTasks = loadTasks().map((task) => ({
                    ...task,
                    categories: Array.isArray(task.categories)
                        ? task.categories.filter((name) => name !== category.name)
                        : []
                }));
                saveTasks(updatedTasks);
                clearTaskPageConfirmationParams();
                initializeTaskPage();
            });

            categoryActions.append(editButton, removeButton);
            categoryCard.append(categoryName, categoryActions);
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

    if (new URLSearchParams(window.location.search).has("updated")) {
        const confirmation = document.createElement("div");
        confirmation.className = "task-confirmation";
        const confirmationText = document.createElement("span");
        confirmationText.textContent = "Task updated successfully!";

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

    //builds task card for each saved task
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

        const difficulty = document.createElement("div");
        difficulty.className = "saved-task-difficulty";
        difficulty.setAttribute("aria-label", `Difficulty: ${task.difficulty || 0} out of 5`);

        for (let index = 0; index < 5; index++) {
            const star = document.createElement("span");
            star.textContent = "★";
            star.className = index < (task.difficulty || 0) ? "filled" : "";
            difficulty.appendChild(star);
        }

        checkbox.addEventListener("change", () => {
            //save new completion state when checkbox changes
            task.completed = checkbox.checked;
            title.classList.toggle("completed-task", task.completed);
            saveTasks(tasks);
        });

        row.append(checkbox, title);
        card.appendChild(row);
        card.appendChild(difficulty);

        const taskActions = document.createElement("div");
        taskActions.className = "saved-item-actions saved-task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "item-action item-action--edit";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            window.location.href = `add-task.html?id=${encodeURIComponent(task.id)}`;
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "item-action item-action--remove";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            if (!window.confirm(`Remove the task “${task.title}”?`)) return;
            saveTasks(loadTasks().filter((savedTask) => savedTask.id !== task.id));
            clearTaskPageConfirmationParams();
            initializeTaskPage();
        });

        taskActions.append(editButton, removeButton);
        card.appendChild(taskActions);

        if (task.details) {
            const details = document.createElement("p");
            details.className = "saved-task-details";
            details.textContent = task.details;
            card.appendChild(details);
        }

        if (task.dueDate) {
            const date = document.createElement("p");
            date.className = "saved-task-date";
            const [year, month, day] = task.dueDate.split("-");
            const formattedDate = new Date(Number(year), Number(month) - 1, Number(day))
                .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });

            date.textContent = `Due: ${formattedDate}`;
            card.appendChild(date);
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
    //elements exist only on add-category-task.html
    const finishButton = document.querySelector("#finish-category");
    const nameInput = document.querySelector("#category-name");
    if (!finishButton || !nameInput) return;

    const categoryId = getEditId();
    const categories = loadCategories();
    const categoryToEdit = categoryId
        ? categories.find((category) => String(category.id) === categoryId)
        : null;

    if (categoryToEdit) {
        document.title = "Edit Category";
        document.querySelector("h2").textContent = "Edit Category";
        nameInput.value = categoryToEdit.name || "";
        document.querySelector("#category-details").value = categoryToEdit.details || "";
        finishButton.textContent = "Save Category Changes";
    }

    finishButton.addEventListener("click", () => {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.reportValidity();
            return;
        }

        const category = {
            //reuse existing id during an edit
            id: categoryToEdit ? categoryToEdit.id : Date.now(),
            name,
            details: document.querySelector("#category-details").value.trim()
        };

        const updatedCategories = categoryToEdit
            ? categories.map((savedCategory) => savedCategory.id === categoryToEdit.id ? category : savedCategory)
            : [...categories, category];

        saveCategories(updatedCategories);

        //if category was renamed, update task references to new name
        if (categoryToEdit && categoryToEdit.name !== category.name) {
            const updatedTasks = loadTasks().map((task) => ({
                ...task,
                categories: Array.isArray(task.categories)
                    ? task.categories.map((taskCategory) =>
                        taskCategory === categoryToEdit.name ? category.name : taskCategory
                    )
                    : []
            }));
            saveTasks(updatedTasks);
        }

        //return to actual tasks page after saving the category
        window.location.href = `tasks_page.html?${categoryToEdit ? "categoryUpdated=1" : "categoryAdded=1"}`;
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
}

else {
    initializeApp();
}
