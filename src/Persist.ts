import type { App } from './App';
import type { UI_t } from './UI';
import type { GlobalStateKey_t, GlobalStateValue_t } from './VSCodeAPIs';

// Persist value types - what we store locally
export type PersistValue_t = string | number | boolean;

// Type for dynamically created properties on Persist instances
export type Persist_t = Record<UI_t, PersistValue_t>;

/**
 * Persist - Dynamic property persistence with VS Code global state
 *
 * Creates dynamic properties that automatically sync with VS Code's global state.
 * Properties are registered on-demand and use a three-tier lookup: in-memory cache,
 * global state, then default values. Supports transparent read/write with automatic
 * state synchronization.
 *
 * @input app - Application instance for global state access
 * @output Dynamic properties with persistent storage, default value management
 *
 * @example
 * const persist = new Persist(app);
 * persist.register('theme').setDefault('theme', 'github-light');
 * console.log(persist.theme); // 'github-light' from default
 * persist.theme = 'dark'; // Saves to VS Code global state
 */
export class Persist {
  private app: App;
  private default: Record<string, PersistValue_t> = {};
  private value: Record<string, PersistValue_t> = {};

  constructor(app: App) {
    this.app = app;
  }

  register(name: string): this {
    Object.defineProperty(this, name, {
      get: () => {
        let result: unknown = undefined;

        // Check in-memory cache first
        if (this.value[name] !== undefined) {
          result = this.value[name];
        } else {
          // Try to get from global state (may fail if not a GlobalStateKey)
          const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey_t);
          if (globalValue !== undefined) {
            this.value[name] = globalValue;
            result = globalValue;
          } else if (this.default[name] !== undefined) {
            // Fall back to default value
            const defaultValue = this.default[name];
            this.value[name] = defaultValue;
            // Try to persist default to global state
            this.app.vscodeapis.updateGlobalState(
              name as GlobalStateKey_t,
              defaultValue as GlobalStateValue_t
            );
            result = defaultValue;
          }
        }

        return result;
      },
      set: (value: PersistValue_t) => {
        if (value !== this.value[name]) {
          this.value[name] = value;
          // Skip global state update if value is empty string (non-persistent menus like 'print'/'page')
          if (value !== '') {
            this.app.vscodeapis.updateGlobalState(
              name as GlobalStateKey_t,
              value as GlobalStateValue_t
            );
          }
        }
      },
      enumerable: true,
      configurable: true,
    });
    return this;
  }

  setDefault(name: string, defaultValue: PersistValue_t): this {
    this.default[name] = defaultValue;
    return this;
  }

  getDefault(name: string): PersistValue_t | undefined {
    return this.default[name];
  }
}

// end, Persist.ts
