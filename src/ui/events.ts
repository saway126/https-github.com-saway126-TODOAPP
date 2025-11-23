import { todoStore } from "../services/todoStore";
import { FilterType } from "../types";
import { showToast, clearAddTodoInput, getElements, toggleImportModal } from "./dom";
import { THEME_STORAGE_KEY } from "../main";
import { AIParser } from "../services/aiParser";

const addTodoForm = document.getElementById("add-todo-form") as HTMLFormElement;
const addTodoInput = document.getElementById("add-todo-input") as HTMLInputElement;
const todoList = document.getElementById("todo-list") as HTMLUListElement;
const filterControls = document.getElementById("filter-controls") as HTMLDivElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;

const handleAddTodo = (e: SubmitEvent) => {
    e.preventDefault();
    const text = addTodoInput.value;
    if (text.trim()) {
        todoStore.addTodo(text);
        showToast("Todo added successfully!");
        clearAddTodoInput();
    }
};

const handleTodoListClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const li = target.closest("li");
    if (!li) return;
    const id = li.dataset.id!;

    if (target.classList.contains("todo-checkbox")) {
        todoStore.toggleTodoCompletion(id);
    } else if (target.closest(".delete-btn")) {
        todoStore.deleteTodo(id);
        showToast("Todo deleted.");
    } else if (target.closest(".edit-btn")) {
        enterEditMode(li, id);
    }
};

const handleTodoListDoubleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const li = target.closest("li");
    if (!li || target.classList.contains("todo-checkbox") || target.closest(".todo-actions")) return;
    const id = li.dataset.id!;
    enterEditMode(li, id);
};

const handleFilterClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') {
        const filter = target.dataset.filter as FilterType;
        if (filter) {
            todoStore.setFilter(filter);
        }
    }
};

const handleSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    todoStore.setSearchTerm(target.value);
};

const handleThemeToggle = () => {
    const isDark = themeToggle.checked;
    const newTheme = isDark ? 'dark' : 'light';
    document.body.dataset.theme = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
};

const enterEditMode = (li: HTMLLIElement, id: string) => {
    const textSpan = li.querySelector(".todo-text") as HTMLSpanElement;
    const editInput = li.querySelector(".edit-input") as HTMLInputElement;
    textSpan.style.display = "none";
    editInput.style.display = "block";
    editInput.focus();
    editInput.select();

    const saveChanges = () => {
        const newText = editInput.value;
        if (newText.trim() && newText !== todoStore.getTodos().find(t => t.id === id)?.text) {
            todoStore.updateTodoText(id, newText);
            showToast("Todo updated.");
        }
        textSpan.style.display = "block";
        editInput.style.display = "none";
    }

    editInput.onkeydown = (e) => {
        if (e.key === "Enter") {
            saveChanges();
        } else if (e.key === "Escape") {
            editInput.value = textSpan.innerText;
            textSpan.style.display = "block";
            editInput.style.display = "none";
        }
    };
    editInput.onblur = saveChanges;
};

const handleGlobalKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.id !== 'search-input') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        } else {
            return;
        }
    }

    const displayedTodos = todoStore.getFilteredTodos();
    if (displayedTodos.length === 0) return;

    let focusedId = todoStore.getFocusedTodoId();
    if (!focusedId) {
        todoStore.setFocusedTodoId(displayedTodos[0].id);
        return;
    }

    const currentIndex = displayedTodos.findIndex(t => t.id === focusedId);
    if (currentIndex === -1) return;

    switch (e.key) {
        case "ArrowUp":
            e.preventDefault();
            if (currentIndex > 0) {
                todoStore.setFocusedTodoId(displayedTodos[currentIndex - 1].id);
            }
            break;
        case "ArrowDown":
            e.preventDefault();
            if (currentIndex < displayedTodos.length - 1) {
                todoStore.setFocusedTodoId(displayedTodos[currentIndex + 1].id);
            }
            break;
        case " ": // Spacebar
            e.preventDefault();
            todoStore.toggleTodoCompletion(focusedId);
            break;
        case "e":
            const li = todoList.querySelector(`li[data-id="${focusedId}"]`);
            if (li) enterEditMode(li as HTMLLIElement, focusedId);
            break;
        case "Delete":
        case "Backspace":
            todoStore.deleteTodo(focusedId);
            showToast("Todo deleted.");
            break;
    }
};

export const initEventListeners = () => {
    addTodoForm.addEventListener("submit", handleAddTodo);
    todoList.addEventListener("click", handleTodoListClick);
    todoList.addEventListener("dblclick", handleTodoListDoubleClick);
    filterControls.addEventListener('click', handleFilterClick);
    searchInput.addEventListener('input', handleSearchInput);
    themeToggle.addEventListener('change', handleThemeToggle);
    window.addEventListener("keydown", handleGlobalKeyDown);

    // Import Feature Events
    const { openImportBtn, closeModalBtn, processImportBtn, importTextarea, importModal } = getElements();

    if (openImportBtn) {
        openImportBtn.addEventListener("click", () => toggleImportModal(true));
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => toggleImportModal(false));
    }

    if (importModal) {
        // Close on click outside
        importModal.addEventListener("click", (e) => {
            if (e.target === importModal) toggleImportModal(false);
        });
    }

    if (processImportBtn) {
        processImportBtn.addEventListener("click", () => {
            const text = importTextarea.value;
            if (!text.trim()) {
                showToast("Please paste some text first.");
                return;
            }

            const tasks = AIParser.parseTasks(text);
            if (tasks.length > 0) {
                todoStore.addTodos(tasks);
                showToast(`Imported ${tasks.length} tasks!`);
                toggleImportModal(false);
            } else {
                showToast("No tasks found in the text.");
            }
        });
    }
};