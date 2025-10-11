import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

export class Persist {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Register a persistent property and return this for chaining
   * @param name - The property name
   * @param defaultValue - The default value
   */
  register(name: string, defaultValue: any): this {
    // If already registered, just update the default logic
    if (this.hasOwnProperty(name)) {
      const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
      
      // If global state has a value, keep it; otherwise use new default
      if (globalValue === undefined) {
        (this as any)[name] = defaultValue;
        this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, defaultValue);
      }
      return this;
    }

    // First time registration
    const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
    const initialValue = globalValue !== undefined ? globalValue : defaultValue;
    
    // If global state was undefined, set it to default
    if (globalValue === undefined) {
      this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, defaultValue);
    }

    // Create getter/setter on this instance
    Object.defineProperty(this, name, {
      get: () => {
        // Always return local value (fast)
        return (this as any)[`_${name}`];
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

    // Set the initial value
    (this as any)[`_${name}`] = initialValue;

    return this;
  }
}