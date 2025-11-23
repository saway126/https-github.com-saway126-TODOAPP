import { readTodos, writeTodos } from "./fs";
import { Todo, FilterType } from "../types";

class TodoStore {
  private todos: Todo[] = [];
  private filter: FilterType = FilterType.ALL;
  private searchTerm: string = "";
  private focusedTodoId: string | null = null;
  private debounceTimeout: number | null = null;
  private listeners: (() => void)[] = [];

  // STATE READERS
  getFilteredTodos(): Todo[] {
    const today = new Date().toISOString().split("T")[0];
    return this.todos
      .filter((todo) => {
        if (this.filter === FilterType.TODAY) {
          return todo.createdAt.startsWith(today);
        }
        return true;
      })
      .filter((todo) =>
        todo.text.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
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

  // STATE MUTATORS
  async init() {
    this.todos = await readTodos();
    this.notify();
    this.updateFocus(); // Set initial focus
  }

  addTodo(text: string) {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.unshift(newTodo);
    this.save();
    this.notify();
  }

  addTodos(texts: string[]) {
    if (texts.length === 0) return;

    const newTodos: Todo[] = texts.map(text => ({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
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

  toggleTodoCompletion(id: string) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
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
}

export const todoStore = new TodoStore();
