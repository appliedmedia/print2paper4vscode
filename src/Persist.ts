import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

export class Persist {
  private app: App;
  private defaults: Map<string, any> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Register a persistent property (no value set yet)
   * @param name - The property name
   */
  register(name: string): this {
    // Create getter/setter on this instance
    Object.defineProperty(this, name, {
      get: () => {
        // Check if we have a local value
        if ((this as any).hasOwnProperty(`_${name}`)) {
          return (this as any)[`_${name}`];
        }
        
        // No local value, check global state
        const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
        if (globalValue !== undefined) {
          (this as any)[`_${name}`] = globalValue;
          return globalValue;
        }
        
        // No global value, use default if available
        if (this.defaults.has(name)) {
          const defaultValue = this.defaults.get(name);
          (this as any)[`_${name}`] = defaultValue;
          this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, defaultValue);
          return defaultValue;
        }
        
        return undefined;
      },
      set: (value: any) => {
        const currentValue = (this as any)[`_${name}`];
        // Only update if value actually changed
        if (value !== currentValue) {
          // Update local cache
          (this as any)[`_${name}`] = value;
          // Update global state
          this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, value);
        }
      },
      enumerable: true,
      configurable: true
    });

    return this;
  }

  /**
   * Set default value for a property
   * @param name - The property name
   * @param defaultValue - The default value
   */
  setDefault(name: string, defaultValue: any): this {
    this.defaults.set(name, defaultValue);
    return this;
  }
}