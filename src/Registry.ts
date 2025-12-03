import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import type { FnImport_t } from './types/Registry_t';

/**
 * Component interface for Registry-managed classes
 * Components can have:
 * - static id: string - required, component identifier
 * - static create?(app: App): instance - optional factory method (for abstract classes or private constructors)
 * - init?(): void - optional initialization after construction (for lazy dependency setup)
 */
export interface ComponentClass {
  readonly id: string;
  create?(app: App): unknown;
  new (app: App): unknown;
}

/**
 * Registry - Dependency injection and lazy component management system
 *
 * Manages lazy instantiation of components, resolves method dependencies,
 * and provides scoped access to component methods. Components declare what
 * they need via `app.reg.use()` and Registry resolves and caches instances.
 *
 * Components are created lazily when first requested via use().
 * After creation, init() is called if it exists (for dependency setup).
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
  private _initialized: Set<string> = new Set(); // Track which components have had init() called
  private components: ComponentClass[] = [];
  private always: string[] = [];
  private dx: Diagnostics;
  private app: App;
  private constructionStack: string[] = []; // Track components being constructed for circular dependency detection

  constructor(args: {
    app: App;
    components?: ComponentClass[];
    always?: string[];
  }) {
    this.app = args.app;
    this.components = args.components || [];
    this.always = args.always || [];

    // Create Diagnostics instance as child of App's dx
    this.dx = this.app.dx.sub({ name: 'Registry' });

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
   */
  registerInstance(componentId: string, instance: unknown): void {
    this._instances.set(componentId, instance);
    this._initialized.add(componentId);
  }

  /**
   * Get or create a component instance by ID
   * Used internally and can be used for direct instance access
   */
  getInstance<T = unknown>(componentId: string): T | undefined {
    // Check cache first
    if (this._instances.has(componentId)) {
      return this._instances.get(componentId) as T;
    }

    // Find component class
    const Component = this.components.find((c) => c.id === componentId);
    if (!Component) {
      return undefined;
    }

    // Create instance
    this.createInstance(Component);
    return this._instances.get(componentId) as T;
  }

  /**
   * Create a component instance using factory or constructor
   * No init() calls - components use lazy getters for dependencies
   */
  private createInstance(Component: ComponentClass): void {
    const componentId = Component.id;

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
      // Use static create() if available, otherwise use constructor
      let instance: unknown;
      if ('create' in Component && typeof Component.create === 'function') {
        instance = Component.create(this.app);
      } else {
        instance = new Component(this.app);
      }
      this._instances.set(componentId, instance);
      this._initialized.add(componentId);
    } catch (err) {
      const errorMsg = `Failed to initialize component '${componentId}': ${err instanceof Error ? err.message : String(err)}. Extension may need to be restarted.`;
      this.dx.error(errorMsg);
      throw new Error(errorMsg);
    } finally {
      // Pop component from stack when done (even if error occurred)
      const popped = this.constructionStack.pop();
      if (popped !== componentId) {
        this.dx.error(
          `Construction stack mismatch: expected to pop '${componentId}' but popped '${popped}'.`
        );
      }
    }
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
      let foundComponent: ComponentClass | undefined;
      let foundMethodName = actualMethodName;

      if (id) {
        // Explicit component specified - find it
        foundComponent = this.components.find((c) => c.id === id);
        
        // If not in components array, check if instance was registered directly
        if (!foundComponent && this._instances.has(id)) {
          const instance = this._instances.get(id);
          if (instance && typeof (instance as Record<string, unknown>)[actualMethodName] === 'function') {
            if (!result[id]) {
              result[id] = {};
            }
            result[id][actualMethodName] = (
              (instance as Record<string, unknown>)[actualMethodName] as Function
            ).bind(instance);
            continue; // Skip to next method
          } else if (instance && (instance as Record<string, unknown>)[actualMethodName] !== undefined) {
            // Property access (not a function)
            if (!result[id]) {
              result[id] = {};
            }
            result[id][actualMethodName] = (instance as Record<string, unknown>)[actualMethodName] as Function;
            continue;
          }
        }
        
        if (!foundComponent && !this._instances.has(id)) {
          const errorMsg = `Component '${id}' not found in Registry`;
          this.dx.error(errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        // No component specified - search all components via prototype
        for (const Component of this.components) {
          if (Component.prototype && Component.prototype.hasOwnProperty(actualMethodName)) {
            foundComponent = Component;
            foundMethodName = actualMethodName;
            break;
          }
        }
      }

      if (!foundComponent) {
        // Method not found via prototype, might be on an already-registered instance
        if (id && this._instances.has(id)) {
          continue; // Already handled above
        }
        const errorMsg = `Method '${actualMethodName}' not found in any component`;
        this.dx.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Get or create component instance
      const componentId = foundComponent.id;

      if (!this._instances.has(componentId)) {
        this.createInstance(foundComponent);
      }

      const instance = this._instances.get(componentId);
      if (!instance) {
        continue;
      }

      // Ensure component entry exists in result
      if (!result[componentId]) {
        result[componentId] = {};
      }

      // Bind method to instance and add to result
      const value = (instance as Record<string, unknown>)[foundMethodName];
      if (typeof value === 'function') {
        result[componentId][foundMethodName] = value.bind(instance);
      } else {
        // Property access
        result[componentId][foundMethodName] = value as Function;
      }
    }

    return result;
  }

  /**
   * Call done() on all initialized components in reverse order
   */
  done(): void {
    const componentIds = Array.from(this._initialized).reverse();
    for (const id of componentIds) {
      if (id === 'dx') continue; // Don't clean up registry's own dx
      const instance = this._instances.get(id);
      if (instance && typeof (instance as { done?: () => void }).done === 'function') {
        try {
          (instance as { done: () => void }).done();
        } catch (err) {
          this.dx.out(`Error in ${id}.done(): ${err}`);
        }
      }
    }
  }
}
