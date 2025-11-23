import { todoStore } from "../services/todoStore";
import { Todo } from "../types";

// DOM element selectors
const elements = {
  todoList: document.getElementById("todo-list") as HTMLUListElement,
  addTodoInput: document.getElementById("add-todo-input") as HTMLInputElement,
  filterControls: document.getElementById("filter-controls")!,
  searchInput: document.getElementById("search-input") as HTMLInputElement,
  toastContainer: document.getElementById("toast-container")!,
  // Import Modal Elements
  importModal: document.getElementById("import-modal")!,
  openImportBtn: document.getElementById("open-import-btn")!,
  closeModalBtn: document.getElementById("close-modal-btn")!,
  processImportBtn: document.getElementById("process-import-btn")!,
  importTextarea: document.getElementById("import-textarea") as HTMLTextAreaElement,
};

export const getElements = () => elements;

export const toggleImportModal = (show: boolean) => {
  if (show) {
    elements.importModal.classList.remove("hidden");
    elements.importTextarea.focus();
  } else {
    elements.importModal.classList.add("hidden");
    elements.importTextarea.value = ""; // Clear on close
  }
};

/**
 * Creates the HTML string for a single todo item.
 * @param todo The todo object.
 * @param isFocused Whether the todo item is currently focused.
 * @returns The HTML string for the todo item.
 */
const createTodoItemHTML = (todo: Todo, isFocused: boolean): string => {
  const completedClass = todo.completed ? "completed" : "";
  const focusedClass = isFocused ? "focused" : "";

  return `
    <li data-id="${todo.id}" class="${focusedClass}">
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""}>
      <div class="todo-text-container">
        <span class="todo-text ${completedClass}">${todo.text}</span>
        <input type="text" class="edit-input" value="${todo.text}" style="display: none;">
      </div>
      <div class="todo-actions">
        <button class="edit-btn" aria-label="Edit todo">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
          </svg>
        </button>
        <button class="delete-btn" aria-label="Delete todo">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </li>
  `;
};

const renderTodoList = () => {
  const todosToRender = todoStore.getFilteredTodos();
  const focusedId = todoStore.getFocusedTodoId();

  if (todosToRender.length === 0) {
    elements.todoList.innerHTML = `<li class="empty-state">No todos found. Try a different filter or create a new one!</li>`;
    return;
  }

  elements.todoList.innerHTML = todosToRender
    .map(todo => createTodoItemHTML(todo, todo.id === focusedId))
    .join("");

  if (focusedId) {
    const focusedElement = elements.todoList.querySelector(`[data-id="${focusedId}"]`);
    focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
};

const renderFilters = () => {
  const currentFilter = todoStore.getFilter();
  elements.filterControls.querySelectorAll('button').forEach(button => {
    if (button.dataset.filter === currentFilter) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
};

/**
 * Renders the entire application UI based on the current state.
 */
export const render = () => {
  renderTodoList();
  renderFilters();
  elements.searchInput.value = todoStore.getSearchTerm();
};


/**
 * Shows a toast notification message.
 * @param message The message to display.
 */
export const showToast = (message: string) => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
  elements.toastContainer.appendChild(toast);

  const close = () => {
    toast.remove();
  };

  toast.querySelector('.toast-close')!.addEventListener('click', close);

  setTimeout(close, 3000);
};

export const clearAddTodoInput = () => {
  elements.addTodoInput.value = "";
};
