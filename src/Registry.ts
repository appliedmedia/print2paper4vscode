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
  private constructionStack: string[] = []; // Track components being constructed for circular dependency detection

  constructor(args: {
    app: App;
    components?: Array<{ new (...args: any[]): any; id: string }>;
    always?: string[];
  }) {
    this.app = args.app;
    this.components = args.components || [];
    this.always = args.always || [];

    // Create Diagnostics instance as child of App's dx (not a new root instance)
    this.dx = this.app.dx.sub({ name: 'Registry' });
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
      // Parse methodId if it's in format 'id.methodName', otherwise just methodName
      let id: string | undefined;
      let actualMethodName: string;

      if (methodName.includes('.')) {
        const parts = methodName.split('.');
        id = parts[0];
        actualMethodName = parts.slice(1).join('.');
      } else {
        actualMethodName = methodName;
      }

      // Find component that owns this method
      let foundComponent: { new (app: App): any; id: string } | undefined;
      let foundMethodName = actualMethodName;

      if (id) {
        // Explicit component specified - find it
        foundComponent = this.components.find((c) => c.id === id);
        // If not in components array, check if instance was registered directly (e.g., OS)
        if (!foundComponent && this._instances.has(id)) {
          // Instance exists but not in components array - get instance to resolve method
          const instance = this._instances.get(id);
          if (instance && typeof (instance as Record<string, unknown>)[actualMethodName] === 'function') {
            // Ensure component entry exists in result
            if (!result[id]) {
              result[id] = {};
            }
            // Bind method to instance and add to result
            result[id][actualMethodName] = (
              (instance as Record<string, unknown>)[actualMethodName] as Function
            ).bind(instance);
          } else {
            const errorMsg = `Method '${actualMethodName}' not found on registered instance '${id}'`;
            this.dx.error(errorMsg);
            throw new Error(errorMsg);
          }
        }
        if (!foundComponent) {
          const errorMsg = `Component '${id}' not found in Registry`;
          this.dx.error(errorMsg);
          throw new Error(errorMsg);
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
        const errorMsg = `Method '${actualMethodName}' not found in any component`;
        this.dx.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Get or create component instance
      // Use foundComponent.id directly (always defined since foundComponent exists)
      const componentId = foundComponent.id;

      if (!this._instances.has(componentId)) {
        // Check for circular dependency
        if (this.constructionStack.includes(componentId)) {
          const cycle = [...this.constructionStack, componentId].join(' -> ');
          const errorMsg = `Circular dependency detected: ${cycle}. Components cannot depend on each other directly or indirectly.`;
          this.dx.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Push component onto construction stack
        this.constructionStack.push(componentId);

        try {
          // Try to create instance lazily if not already registered
          // Note: VSCodeAPIs needs special args, so it should be registered by App
          const instance = new foundComponent(this.app);
          this._instances.set(componentId, instance);
        } catch (err) {
          const errorMsg = `Failed to initialize component '${componentId}': ${err instanceof Error ? err.message : String(err)}. Extension may need to be restarted.`;
          this.dx.error(errorMsg);
          throw new Error(errorMsg);
        } finally {
          // Pop component from stack when done (even if error occurred)
          // Always pop the last item we pushed (LIFO stack behavior)
          const popped = this.constructionStack.pop();
          if (popped !== componentId) {
            // This should never happen, but log if it does for debugging
            this.dx.error(
              `Construction stack mismatch: expected to pop '${componentId}' but popped '${popped}'. Stack: ${this.constructionStack.join(' -> ')}`
            );
            // Restore stack integrity by removing componentId if it exists elsewhere
            const index = this.constructionStack.indexOf(componentId);
            if (index !== -1) {
              this.constructionStack.splice(index, 1);
            }
            // Restore the popped item if it wasn't what we expected
            if (popped) {
              this.constructionStack.push(popped);
            }
          }
        }
      }

      const instance = this._instances.get(componentId);
      if (!instance) {
        continue;
      }

      // Ensure component entry exists in result
      if (!result[componentId]) {
        result[componentId] = {};
      }

      // Return method (bound) or property (direct access)
      const value = (instance as Record<string, unknown>)[foundMethodName];
      if (typeof value === 'function') {
        result[componentId][foundMethodName] = value.bind(instance);
      } else {
        result[componentId][foundMethodName] = value;
      }
    }

    return result;
  }
}
