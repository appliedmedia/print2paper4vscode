import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

export class Persist {
  private app: App;
  private properties: Map<string, any> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Register a persistent property and return this for chaining
   * @param name - The property name
   * @param defaultValue - The default value
   */
  register(name: string, defaultValue: any): this {
    // Store the default value for fallback
    this.properties.set(name, defaultValue);

    // Create getter/setter on this instance
    Object.defineProperty(this, name, {
      get: () => {
        // Get from global state, fallback to default
        const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
        if (globalValue !== undefined) {
          return globalValue;
        }
        // First time - set default in global state
        this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, defaultValue);
        return defaultValue;
      },
      set: (value: any) => {
        // Update global state
        this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, value);
      },
      enumerable: true,
      configurable: true
    });

    return this;
  }

  /**
   * Get all registered properties for debugging
   */
  getProperties(): Map<string, any> {
    return new Map(this.properties);
  }
}