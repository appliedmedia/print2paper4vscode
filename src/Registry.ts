import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import type { FnImport_t } from './types/Registry_t';

/**
 * Registry - Dependency injection and lazy component management system
 *
 * Manages lazy instantiation of components, resolves method dependencies,
 * and provides scoped access to component methods. Components declare what
 * they need via `app.use()` and Registry resolves and caches instances.
 *
 * @input app - App instance
 * @input components - Array of component classes to register
 * @input always - Array of method IDs always injected (format: 'componentId.methodName')
 * @output Lazy-loaded component instances, method resolution, dependency management
 */
export class Registry {
  static readonly id = 'reg';

  // Index signature for dynamic component lookups (this.pdf, this.ui, etc.)
  [key: string]: unknown;

  private _instances: Map<string, unknown> = new Map();
  private components: Array<{ new (...args: any[]): any; id: string }> = [];
  private always: string[] = [];
  private dx: Diagnostics;
  private app: App;

  constructor(args: {
    app: App;
    components?: Array<{ new (...args: any[]): any; id: string }>;
    always?: string[];
  }) {
    this.app = args.app;
    this.components = args.components || [];
    this.always = args.always || [];

    // Create Diagnostics instance immediately (needed for debugging)
    this.dx = new Diagnostics({
      name: 'Registry',
      debugOn: undefined,
      parent: null,
      app: this.app,
    });
    this._instances.set('dx', this.dx);

    // Build placeholder structure on `this` for intellisense
    // For each component: `this[Component.id] = {}` - just empty placeholders!
    for (const Component of this.components) {
      if (Component.id) {
        (this as Record<string, unknown>)[Component.id] = {};
      }
    }
  }

  /**
   * Register an existing component instance with Registry
   *
   * Allows App to register instances created the old way so Registry can use them.
   *
   * @param componentId - Component ID (e.g., 'ui', 'pdf')
   * @param instance - The component instance to register
   */
  registerInstance(componentId: string, instance: unknown): void {
    this._instances.set(componentId, instance);
  }

  /**
   * Request methods from components via Registry
   *
   * THE SIMPLE VERSION:
   * - Merge methodIds with always-injected methods
   * - For each method name, find which component class has that method via prototype
   * - Get or create instance and return bound method
   *
   * @param methodIds - Variadic method names (e.g., 'showError', 'generatePdf')
   * @returns Object organized by component: { dx: { sub: Function }, ui: { showErrorMessage: Function } }
   */
  use(...methodIds: string[]): FnImport_t {
    // Merge requested methods with always-injected methods
    const allMethods = [...methodIds, ...this.always];

    const result: FnImport_t = {};

    // For each method name, find which component owns it
    for (const methodName of allMethods) {
      // Parse methodId if it's in format 'componentId.methodName', otherwise just methodName
      let componentId: string | undefined;
      let actualMethodName: string;

      if (methodName.includes('.')) {
        const parts = methodName.split('.');
        componentId = parts[0];
        actualMethodName = parts.slice(1).join('.');
      } else {
        actualMethodName = methodName;
      }

      // Find component that owns this method
      let foundComponent: { new (app: App): any; id: string } | undefined;
      let foundMethodName = actualMethodName;

      if (componentId) {
        // Explicit component specified - find it
        foundComponent = this.components.find((c) => c.id === componentId);
        if (!foundComponent) {
          this.dx.error(`Component '${componentId}' not found in Registry`);
          continue;
        }
      } else {
        // No component specified - search all components via prototype
        for (const Component of this.components) {
          if (Component.prototype.hasOwnProperty(actualMethodName)) {
            foundComponent = Component;
            foundMethodName = actualMethodName;
            break;
          }
        }
      }

      if (!foundComponent) {
        this.dx.error(`Method '${actualMethodName}' not found in any component`);
        continue;
      }

      // Get or create component instance
      const componentIdForInstance = foundComponent.id;
      if (!this._instances.has(componentIdForInstance)) {
        try {
          // Try to create instance lazily if not already registered
          // Note: VSCodeAPIs needs special args, so it should be registered by App
          const instance = new foundComponent(this.app);
          this._instances.set(componentIdForInstance, instance);
        } catch (err) {
          this.dx.error(
            `Failed to create component '${componentIdForInstance}': ${err instanceof Error ? err.message : String(err)}`
          );
          continue;
        }
      }

      const instance = this._instances.get(componentIdForInstance);
      if (!instance) {
        continue;
      }

      // Ensure component entry exists in result
      if (!result[componentIdForInstance]) {
        result[componentIdForInstance] = {};
      }

      // Bind method to instance and add to result
      if (typeof (instance as Record<string, unknown>)[foundMethodName] === 'function') {
        result[componentIdForInstance][foundMethodName] = (
          (instance as Record<string, unknown>)[foundMethodName] as Function
        ).bind(instance);
      } else {
        this.dx.error(`Method '${foundMethodName}' is not a function on component '${componentIdForInstance}'`);
      }
    }

    return result;
  }
}
