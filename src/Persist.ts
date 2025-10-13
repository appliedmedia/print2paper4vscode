import type { App } from './App';
import type { kUI_t } from './UI';
import type { GlobalStateKey_t, GlobalStateValue_t } from './VSCodeAPIs';

// Persist value types - what we store locally
export type PersistValue_t = string | number | boolean;

// Type for dynamically created properties on Persist instances
export type Persist_t = Record<(typeof kUI_t)[number], PersistValue_t>;

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
}

// end, Persist.ts
