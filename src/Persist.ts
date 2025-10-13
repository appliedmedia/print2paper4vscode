import type { App } from './App';
import type {
  GlobalStateKey_t,
  GlobalStateKeyToValueType_t,
  GlobalStateValue_t,
} from './types/globalState_t';

// Type for dynamically created properties on Persist instances
export type Persist_t = {
  [K in GlobalStateKey_t]?: GlobalStateKeyToValueType_t[K];
};

export class Persist {
  private app: App;
  private default: Record<string, GlobalStateValue_t> = {};
  private value: Record<string, GlobalStateValue_t> = {};

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
      set: (value: GlobalStateValue_t) => {
        if (value !== this.value[name]) {
          this.value[name] = value;
          this.app.vscodeapis.updateGlobalState(name as GlobalStateKey_t, value);
        }
      },
      enumerable: true,
      configurable: true,
    });
    return this;
  }

  setDefault(name: string, defaultValue: GlobalStateValue_t): this {
    this.default[name] = defaultValue;
    return this;
  }
}
