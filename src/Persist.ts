import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

// Type for dynamically created properties on Persist instances
export interface PersistProperties {
  [key: string]: string;
}

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
        if (this.value[name] !== undefined) {
          return this.value[name];
        }
        
        try {
          const globalValue = this.app.vscodeapis.getGlobalState(name);
          if (globalValue !== undefined) {
            this.value[name] = globalValue;
            return globalValue;
          }
        } catch (error) {
          this.app.ui.showErrorMessage(`Failed to load setting: ${name}`);
          // Fall through to use default value
        }
        
        if (this.default[name] !== undefined) {
          const defaultValue = this.default[name];
          this.value[name] = defaultValue;
          try {
            this.app.vscodeapis.updateGlobalState(name, defaultValue);
          } catch (error) {
            this.app.ui.showErrorMessage(`Failed to save setting: ${name}`);
            // Swallow error - local value is still set
          }
          return defaultValue;
        }
        
        return undefined;
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