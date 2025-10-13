import type { App } from './App';
import type { GlobalStateKey_t, GlobalStateKeyToValueType_t } from './types/globalState_t';

// Type for dynamically created properties on Persist instances
export type Persist_t = {
  [K in GlobalStateKey_t]?: GlobalStateKeyToValueType_t[K];
};

export class Persist {
  private app: App;
  private default: Record<string, any> = {};
  private value: Record<string, any> = {};

  constructor(app: App) {
    this.app = app;
  }

  register(name: string): this {
    Object.defineProperty(this, name, {
      get: () => {
        let result: any = undefined;

        // Check in-memory cache first
        if (this.value[name] !== undefined) {
          result = this.value[name];
        } else {
          // Try to get from global state
          try {
            const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey_t);
            if (globalValue !== undefined) {
              result = globalValue;
              this.value[name] = result; // Populate cache
            }
          } catch (error) {
            // Not a global state key, skip
          }

          // If no global value, try default
          if (result === undefined && this.default[name] !== undefined) {
            result = this.default[name];
            this.value[name] = result; // Populate cache
            try {
              this.app.vscodeapis.updateGlobalState(name as GlobalStateKey_t, result);
            } catch (error) {
              // Not a global state key or failed to save, skip
            }
          }
        }

        return result;
      },
      set: (value: any) => {
        const currentValue = this.value[name];
        if (value !== currentValue) {
          this.value[name] = value;
          try {
            this.app.vscodeapis.updateGlobalState(name as GlobalStateKey_t, value);
          } catch (error) {
            // Not a global state key or failed to save, skip
          }
        }
      },
      enumerable: true,
      configurable: true,
    });
    return this;
  }

  setDefault(name: string, defaultValue: any): this {
    this.default[name] = defaultValue;
    return this;
  }
}
