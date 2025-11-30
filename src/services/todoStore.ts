import { readTodos, writeTodos } from "./fs";
import { Todo, FilterType, SortOption, Step } from "../types";
import { listStore } from "./listStore";

class TodoStore {
  private todos: Todo[] = [];
  private filter: FilterType = FilterType.ALL;
  private searchTerm: string = "";
  private focusedTodoId: string | null = null;
  private debounceTimeout: number | null = null;
  private listeners: (() => void)[] = [];
  private sortOption: SortOption = 'createdAt';

  // STATE READERS
  getFilteredTodos(): Todo[] {
    const today = new Date().toISOString().split("T")[0];
    const selectedListId = listStore.getSelectedListId();

    return this.todos
      .filter((todo) => {
        // Filter by list
        if (todo.listId !== selectedListId) return false;

        // Filter by type
        if (this.filter === FilterType.TODAY) {
          return todo.createdAt.startsWith(today);
        } else if (this.filter === FilterType.MYDAY) {
          return todo.myDay;
        } else if (this.filter === FilterType.IMPORTANT) {
          return todo.priority === 'high' || todo.priority === 'medium';
        } else if (this.filter === FilterType.PLANNED) {
          return !!todo.dueDate;
        }
        return true;
      })
      .filter((todo) =>
        todo.text.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
      .sort((a, b) => this.sortTodos(a, b));
  }

  private sortTodos(a: Todo, b: Todo): number {
    switch (this.sortOption) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'alphabetical':
        return a.text.localeCompare(b.text);
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }

  getTodos(): Todo[] {
    return this.todos;
  }

  getFilter(): FilterType {
    return this.filter;
  }

  getSearchTerm(): string {
    return this.searchTerm;
  }

  getFocusedTodoId(): string | null {
    return this.focusedTodoId;
  }

  getTodoById(id: string): Todo | undefined {
    return this.todos.find(t => t.id === id);
  }

  getSortOption(): SortOption {
    return this.sortOption;
  }

  // STATE MUTATORS
  async init() {
    const rawTodos = await readTodos();
    // Migrate old todos to new format
    this.todos = rawTodos.map(todo => this.migrateTodo(todo));
    this.notify();
    this.updateFocus(); // Set initial focus
  }

  private migrateTodo(todo: any): Todo {
    // Ensure all new fields have default values
    return {
      ...todo,
      listId: todo.listId || 'default',
      myDay: todo.myDay || false,
      priority: todo.priority || 'none',
      tags: todo.tags || [],
      steps: todo.steps || [],
      attachments: todo.attachments || [],
      notes: todo.notes || undefined,
    };
  }

  addTodo(text: string, description?: string, sourceType: 'text' | 'image' | 'pdf' = 'text', sourceData?: string) {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      listId: listStore.getSelectedListId(),
      myDay: false,
      priority: 'none',
      tags: [],
      steps: [],
      attachments: [],
      description,
      sourceType,
      sourceData
    };
    this.todos.unshift(newTodo);
    this.save();
    this.notify();
  }

  addTodos(items: { text: string, description?: string, sourceData?: string }[], sourceType: 'text' | 'image' | 'pdf' = 'text') {
    if (items.length === 0) return;

    const newTodos: Todo[] = items.map(item => ({
      id: crypto.randomUUID(),
      text: item.text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      listId: listStore.getSelectedListId(),
      myDay: false,
      priority: 'none',
      tags: [],
      steps: [],
      attachments: [],
      description: item.description,
      sourceType,
      sourceData: item.sourceData
    }));

    this.todos.unshift(...newTodos);
    this.save();
    this.notify();
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.save();
    this.notify();
    this.updateFocus();
  }

  updateTodoText(id: string, text: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, text: text.trim() } : todo
    );
    this.save();
    this.notify();
  }

  updateTodo(id: string, updates: Partial<Todo>) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, ...updates } : todo
    );
    this.save();
    this.notify();
  }

  toggleTodoCompletion(id: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.save();
    this.notify();
  }

  toggleMyDay(id: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, myDay: !todo.myDay } : todo
    );
    this.save();
    this.notify();
  }

  setPriority(id: string, priority: 'none' | 'low' | 'medium' | 'high') {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, priority } : todo
    );
    this.save();
    this.notify();
  }

  addTag(id: string, tag: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id && !todo.tags.includes(tag)
        ? { ...todo, tags: [...todo.tags, tag] }
        : todo
    );
    this.save();
    this.notify();
  }

  removeTag(id: string, tag: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id
        ? { ...todo, tags: todo.tags.filter(t => t !== tag) }
        : todo
    );
    this.save();
    this.notify();
  }

  addStep(id: string, stepText: string) {
    const newStep: Step = {
      id: crypto.randomUUID(),
      text: stepText.trim(),
      completed: false
    };
    this.todos = this.todos.map((todo) =>
      todo.id === id
        ? { ...todo, steps: [...todo.steps, newStep] }
        : todo
    );
    this.save();
    this.notify();
  }

  toggleStepCompletion(todoId: string, stepId: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === todoId
        ? {
          ...todo,
          steps: todo.steps.map(step =>
            step.id === stepId ? { ...step, completed: !step.completed } : step
          )
        }
        : todo
    );
    this.save();
    this.notify();
  }

  deleteStep(todoId: string, stepId: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === todoId
        ? { ...todo, steps: todo.steps.filter(step => step.id !== stepId) }
        : todo
    );
    this.save();
    this.notify();
  }

  setDueDate(id: string, dueDate: string | undefined) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, dueDate } : todo
    );
    this.save();
    this.notify();
  }

  setReminder(id: string, reminder: string | undefined) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, reminder } : todo
    );
    this.save();
    this.notify();
  }

  moveTodoToList(id: string, listId: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, listId } : todo
    );
    this.save();
    this.notify();
  }

  setFilter(filter: FilterType) {
    this.filter = filter;
    this.notify();
    this.updateFocus();
  }

  setSearchTerm(term: string) {
    this.searchTerm = term;
    this.notify();
    this.updateFocus();
  }

  setSortOption(option: SortOption) {
    this.sortOption = option;
    this.notify();
  }

  setFocusedTodoId(id: string | null) {
    this.focusedTodoId = id;
    this.notify();
  }

  updateFocus() {
    const displayedTodos = this.getFilteredTodos();
    if (displayedTodos.length > 0 && !displayedTodos.find(t => t.id === this.focusedTodoId)) {
      this.setFocusedTodoId(displayedTodos[0].id);
    } else if (displayedTodos.length === 0) {
      this.setFocusedTodoId(null);
    } else {
      // If focus is already valid, still notify to re-render
      this.notify();
    }
  }

  // PERSISTENCE
  private save() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = window.setTimeout(() => {
      writeTodos(this.todos);
    }, 200);
  }

  // OBSERVER PATTERN
  onChange(listener: () => void) {
    this.listeners.push(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  addDemoData() {
    const demoTodos: Todo[] = [
      {
        id: crypto.randomUUID(),
        text: "Check out the swimming turtle 🐢",
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'high',
        myDay: true,
        listId: 'default-tasks',
        tags: ['fun', 'visuals'],
        steps: [],
        attachments: []
      },
      {
        id: crypto.randomUUID(),
        text: "Count the stars (There are 71) ✨",
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        myDay: false,
        listId: 'default-tasks',
        tags: ['stars'],
        steps: [],
        attachments: []
      },
      {
        id: crypto.randomUUID(),
        text: "Try dragging an image to import tasks 🖼️",
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'low',
        myDay: false,
        listId: 'default-tasks',
        sourceType: 'image',
        description: "You can drag and drop any image with text to extract tasks using OpenAI Vision.",
        steps: [],
        attachments: [],
        tags: []
      },
      {
        id: crypto.randomUUID(),
        text: "Paste a ChatGPT log to extract todos 🤖",
        completed: false,
        createdAt: new Date().toISOString(),
        listId: 'default-tasks',
        myDay: false,
        sourceType: 'text',
        description: "Click the import button and paste your conversation.",
        priority: 'medium',
        steps: [],
        attachments: [],
        tags: []
      }
    ];

    this.todos = [...this.todos, ...demoTodos];
    this.save();
    this.notify();
  }
}

export const todoStore = new TodoStore();
