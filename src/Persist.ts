import type { App } from './App';
import type { GlobalStateKey, GlobalStateKeyToValueType } from './types/globalState_t';

// Type for dynamically created properties on Persist instances
export type PersistProperties = {
  [K in GlobalStateKey]?: GlobalStateKeyToValueType[K];
};

export class Persist {
  private app: App;
  private default: Partial<GlobalStateKeyToValueType> = {};
  private value: Partial<GlobalStateKeyToValueType> = {};

  constructor(app: App) {
    this.app = app;
  }

  register<K extends GlobalStateKey>(name: K): this {
    Object.defineProperty(this, name, {
      get: () => {
        let result: GlobalStateKeyToValueType[K] | undefined = undefined;
        
        // Check in-memory cache first
        if (this.value[name] !== undefined) {
          result = this.value[name] as GlobalStateKeyToValueType[K];
        } else {
          // Try to get from global state
          try {
            const globalValue = this.app.vscodeapis.getGlobalState(name);
            if (globalValue !== undefined) {
              result = globalValue as GlobalStateKeyToValueType[K];
              this.value[name] = result; // Populate cache
            }
          } catch (error) {
            this.app.ui.showErrorMessage(`Failed to load setting: ${name}`);
            // Fall through to use default value
          }
          
          // If no global value, try default
          if (result === undefined && this.default[name] !== undefined) {
            result = this.default[name] as GlobalStateKeyToValueType[K];
            this.value[name] = result; // Populate cache
            try {
              this.app.vscodeapis.updateGlobalState(name, result);
            } catch (error) {
              this.app.ui.showErrorMessage(`Failed to save setting: ${name}`);
              // Swallow error - local value is still set
            }
          }
        }
        
        return result;
      },
      set: (value: GlobalStateKeyToValueType[K]) => {
        const currentValue = this.value[name];
        if (value !== currentValue) {
          this.value[name] = value;
          try {
            this.app.vscodeapis.updateGlobalState(name, value);
          } catch (error) {
            this.app.ui.showErrorMessage(`Failed to save setting: ${name}`);
            // Swallow error - local value is still set
          }
        }
      },
      enumerable: true,
      configurable: true
    });
    return this;
  }

  setDefault<K extends GlobalStateKey>(name: K, defaultValue: GlobalStateKeyToValueType[K]): this {
    this.default[name] = defaultValue;
    return this;
  }
}