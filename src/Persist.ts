import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

// Type for dynamically created properties on Persist instances
export type PersistProperties = {
  [K in GlobalStateKey]?: string;
};

export class Persist {
  private app: App;
  private default: { [key in GlobalStateKey]?: string } = {};
  private value: { [key in GlobalStateKey]?: string } = {};

  constructor(app: App) {
    this.app = app;
  }

  register(name: GlobalStateKey): this {
    Object.defineProperty(this, name, {
      get: () => {
        let result: string | undefined = undefined;
        
        // Check in-memory cache first
        if (this.value[name] !== undefined) {
          result = this.value[name];
        } else {
          // Try to get from global state
          try {
            const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
            if (globalValue !== undefined) {
              result = globalValue;
              this.value[name] = globalValue; // Populate cache
            }
          } catch (error) {
            this.app.ui.showErrorMessage(`Failed to load setting: ${name}`);
            // Fall through to use default value
          }
          
          // If no global value, try default
          if (result === undefined && this.default[name] !== undefined) {
            result = this.default[name];
            this.value[name] = result; // Populate cache
            try {
              this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, result);
            } catch (error) {
              this.app.ui.showErrorMessage(`Failed to save setting: ${name}`);
              // Swallow error - local value is still set
            }
          }
        }
        
        return result;
      },
      set: (value: string) => {
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

  setDefault(name: GlobalStateKey, defaultValue: string): this {
    this.default[name] = defaultValue;
    return this;
  }
}