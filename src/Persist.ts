import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

export class Persist {
  private app: App;
  private bindings: Map<string, { localRef: any; propertyName: string; globalKey: GlobalStateKey }> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Bind a local object property to global state
   * @param localRef - The object containing the property
   * @param propertyName - The property name (without persist_ prefix)
   * @param globalKey - The global state key to sync with
   */
  bindProperty(localRef: any, propertyName: string, globalKey: GlobalStateKey): void {
    const fullPropertyName = `persist_${propertyName}`;
    
    // Store the binding
    this.bindings.set(fullPropertyName, {
      localRef,
      propertyName: fullPropertyName,
      globalKey
    });

    // Store the original value as default
    const defaultValue = localRef[fullPropertyName];

    // Create getter/setter on the local object
    Object.defineProperty(localRef, fullPropertyName, {
      get: () => {
        // Get from global state, fallback to local default
        const globalValue = this.app.vscodeapis.getGlobalState(globalKey);
        return globalValue !== undefined ? globalValue : defaultValue;
      },
      set: (value: any) => {
        // Update global state
        this.app.vscodeapis.updateGlobalState(globalKey, value);
      },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Initialize all bound properties from global state
   * Call this after all bindings are set up
   */
  initialize(): void {
    // No need to initialize - the getters handle this automatically
    // They check global state first, then fall back to defaults
  }

  /**
   * Get all bound properties for debugging
   */
  getBindings(): Map<string, { localRef: any; propertyName: string; globalKey: GlobalStateKey }> {
    return new Map(this.bindings);
  }
}