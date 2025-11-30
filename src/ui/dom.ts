import { todoStore } from "../services/todoStore";
import { listStore } from "../services/listStore";
import { Todo, FilterType } from "../types";
import { t, getLanguage } from "../services/i18n";

// DOM element selectors
const elements = {
  todoList: document.getElementById("todo-list") as HTMLUListElement,
  addTodoInput: document.getElementById("add-todo-input") as HTMLInputElement,
  searchInput: document.getElementById("search-input") as HTMLInputElement,
  toastContainer: document.getElementById("toast-container")!,
  filterControls: document.getElementById("filter-controls")!,

  // Import Modal Elements
  importModal: document.getElementById("import-modal")!,
  openImportBtn: document.getElementById("open-import-btn")!,
  closeModalBtn: document.getElementById("close-modal-btn")!,
  processImportBtn: document.getElementById("process-import-btn")!,
  pasteImportBtn: document.getElementById("paste-import-btn")!,
  importTextarea: document.getElementById("import-textarea") as HTMLTextAreaElement,
  langToggleBtn: document.getElementById("lang-toggle-btn")!,
  langText: document.querySelector("#lang-toggle-btn .lang-text") as HTMLSpanElement,

  // Settings Elements
  openSettingsBtn: document.getElementById("open-settings-btn")!,
  settingsModal: document.getElementById("settings-modal")!,
  closeSettingsBtn: document.getElementById("close-settings-btn")!,
  saveSettingsBtn: document.getElementById("save-settings-btn")!,
  apiKeyInput: document.getElementById("api-key-input") as HTMLInputElement,

  // File Import Elements
  fileDropZone: document.getElementById("file-drop-zone")!,
  fileInput: document.getElementById("file-input") as HTMLInputElement,
  browseBtn: document.getElementById("browse-btn")!,
  filePreview: document.getElementById("file-preview")!,

  // Detail Modal Elements
  detailModal: document.getElementById("detail-modal")!,
  closeDetailBtn: document.getElementById("close-detail-btn")!,
  detailTitle: document.getElementById("detail-title")!,
  detailDescription: document.getElementById("detail-description")!,
  detailSourceBadge: document.getElementById("detail-source-badge")!,
  detailDate: document.getElementById("detail-date")!,
  cosmicWisdomBtn: document.getElementById("cosmic-wisdom-btn")!,
};

export const getElements = () => elements;

export const toggleImportModal = (show: boolean) => {
  if (show) {
    elements.importModal.classList.remove("hidden");
    elements.importTextarea.focus();
  } else {
    elements.importModal.classList.add("hidden");
    elements.importTextarea.value = "";
  }
};

export const updateTranslations = () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n') as any;
    if (key) {
      el.innerHTML = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as any;
    if (key) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });

  const currentLang = getLanguage();
  elements.langText.textContent = currentLang === 'en' ? 'KO' : 'EN';
  elements.langToggleBtn.setAttribute('aria-label', t('langToggleLabel'));
};

/**
 * Get priority icon and color
 */
const getPriorityDisplay = (priority: string) => {
  switch (priority) {
    case 'high':
      return { icon: '🔴', class: 'priority-high', label: 'High' };
    case 'medium':
      return { icon: '🟡', class: 'priority-medium', label: 'Medium' };
    case 'low':
      return { icon: '🟢', class: 'priority-low', label: 'Low' };
    default:
      return null;
  }
};

/**
 * Creates the HTML string for a single todo item.
 */
const createTodoItemHTML = (todo: Todo, isFocused: boolean): string => {
  const completedClass = todo.completed ? "completed" : "";
  const focusedClass = isFocused ? "focused" : "";

  // Priority badge
  const priorityDisplay = getPriorityDisplay(todo.priority);
  const priorityBadge = priorityDisplay ?
    `<span class="priority-badge ${priorityDisplay.class}" title="${priorityDisplay.label} priority">${priorityDisplay.icon}</span>` : '';

  // My Day badge
  const myDayBadge = todo.myDay ?
    `<span class="myday-badge" title="In My Day">☀️</span>` : '';

  // Due date badge
  const dueDateBadge = todo.dueDate ?
    `<span class="due-date-badge" title="Due: ${new Date(todo.dueDate).toLocaleDateString()}">📅 ${new Date(todo.dueDate).toLocaleDateString()}</span>` : '';

  // Tags
  const tagsHTML = todo.tags && todo.tags.length > 0 ?
    `<div class="tags">${todo.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

  // Steps progress
  const stepsHTML = todo.steps && todo.steps.length > 0 ?
    `<div class="steps-progress">
      <svg class="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      ${todo.steps.filter(s => s.completed).length}/${todo.steps.length}
    </div>` : '';

  // Source badge
  let sourceBadge = '';
  if (todo.sourceType && todo.sourceType !== 'text') {
    const sourceIcon = todo.sourceType === 'image' ? '🖼️' : '📄';
    sourceBadge = `<span class="source-badge source-${todo.sourceType}">${sourceIcon}</span>`;
  }

  // Detail button
  const detailButton = todo.description ? `
    <button class="icon-btn detail-view-btn" aria-label="View details" title="View details">
      <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  ` : '';

  // AI Breakdown button
  const breakdownButton = !todo.completed ? `
    <button class="icon-btn ai-breakdown-btn" aria-label="AI Breakdown" title="Break down task">
      <span class="icon">✨</span>
    </button>
  ` : '';

  return `
    <li data-id="${todo.id}" class="${focusedClass}">
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""}>
      <div class="todo-text-container">
        <span class="todo-text ${completedClass}">${todo.text}</span>
        ${priorityBadge}
        ${myDayBadge}
        ${dueDateBadge}
        ${sourceBadge}
        ${stepsHTML}
        ${tagsHTML}
        <input type="text" class="edit-input" value="${todo.text}" style="display: none;">
      </div>
      <div class="todo-actions">
        ${breakdownButton}
        ${detailButton}
        <button class="edit-btn" aria-label="Edit todo">
          <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
          </svg>
        </button>
        <button class="delete-btn" aria-label="Delete todo">
          <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    elements.todoList.innerHTML = `<li class="empty-state">${t('emptyState')}</li>`;
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
  updateTranslations();
  renderTodoList();
  renderFilters();
  elements.searchInput.value = todoStore.getSearchTerm();
};

/**
 * Shows a toast notification message.
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

/**
 * Initializes the 71 Stars and Turtle visuals.
 */
export const initVisuals = () => {
  // 1. Create Stars Container
  const starsContainer = document.createElement('div');
  starsContainer.id = 'stars-container';
  document.body.prepend(starsContainer);

  // 2. Create 71 Stars
  for (let i = 0; i < 71; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // Random size
    const size = Math.random() * 2 + 1; // 1px to 3px

    // Random animation duration
    const duration = Math.random() * 3 + 2; // 2s to 5s

    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty('--duration', `${duration}s`);

    starsContainer.appendChild(star);
  }

  // 3. Create Turtle Container
  const turtleContainer = document.createElement('div');
  turtleContainer.id = 'turtle-container';
  turtleContainer.innerHTML = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#00d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Shell -->
      <path d="M20 50 Q 50 10, 80 50 Q 50 90, 20 50 Z" fill="rgba(0, 210, 255, 0.1)" />
      <!-- Hexagon pattern on shell -->
      <path d="M35 50 L 45 35 L 55 35 L 65 50 L 55 65 L 45 65 Z" />
      <path d="M45 35 L 50 20" />
      <path d="M55 35 L 50 20" />
      <path d="M65 50 L 80 50" />
      <path d="M55 65 L 50 80" />
      <path d="M45 65 L 50 80" />
      <path d="M35 50 L 20 50" />
      <!-- Head -->
      <circle cx="90" cy="50" r="8" fill="rgba(0, 210, 255, 0.2)" />
      <!-- Eye -->
      <circle cx="92" cy="48" r="1" fill="#fff" stroke="none" />
      <!-- Legs -->
      <path d="M30 35 Q 20 20, 40 20" />
      <path d="M70 35 Q 80 20, 60 20" />
      <path d="M30 65 Q 20 80, 40 80" />
      <path d="M70 65 Q 80 80, 60 80" />
      <!-- Tail -->
      <path d="M20 50 L 10 50" />
    </svg>
  `;
  document.body.prepend(turtleContainer);
};
