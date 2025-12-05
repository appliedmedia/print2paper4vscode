import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import type { FnImport_t } from './types/Registry_t';

/**
 * Component interface for Registry-managed classes
 * All constructors take a single args object with reg plus any extra init params
 * Components get dx via this.fn.dx.sub() after calling reg.use()
 */
export interface ComponentClass {
  readonly id: string;
  create?(args: { reg: Registry } & Record<string, unknown>): unknown;
  new (args: { reg: Registry } & Record<string, unknown>): unknown;
}

/**
 * Registry - Dependency injection and lazy component management system
 *
 * Components are created lazily when first accessed via use().
 * Special init params (like vscode/context for VSCodeAPIs) are passed
 * via the init dict at Registry construction.
 *
 * Diagnostics is bootstrapped first - pass init.dx.name for root dx name (e.g., 'App').
 */
export class Registry {
  static readonly id = 'reg';

  [key: string]: unknown;

  private _instances: Map<string, unknown> = new Map();
  private _initialized: Set<string> = new Set();
  private components: ComponentClass[] = [];
  private always: string[] = [];
  private init: Record<string, Record<string, unknown>> = {};
  private fn: FnImport_t;
  private dx: Diagnostics;
  public readonly app: App; // Public so components can access App utilities
  private constructionStack: string[] = [];

  constructor(args: {
    app: App;
    components?: ComponentClass[];
    always?: string[];
    init?: Record<string, Record<string, unknown>>;
  }) {
    this.app = args.app;
    this.components = args.components || [];
    this.always = args.always || [];
    this.init = args.init || {};

    // Bootstrap: Create root Diagnostics first (before anything else)
    // Use init.dx.name for root name (defaults to 'App')
    const dxInit = this.init['dx'] || {};
    const rootDxName = (dxInit.name as string) || 'App';
    const rootDx = new Diagnostics({ name: rootDxName, app: this.app });
    this._instances.set('dx', rootDx);
    this._initialized.add('dx');


    // Now Registry can use fn.dx.sub() like everyone else
    this.fn = this.use();
    this.dx = this.fn.dx.sub({ name: 'Registry' });

    // Build placeholder structure for intellisense
    for (const Component of this.components) {
      if (Component.id) {
        (this as Record<string, unknown>)[Component.id] = {};
      }
    }
  }

  /**
   * Register an existing component instance
   */
  registerInstance(componentId: string, instance: unknown): void {
    this._instances.set(componentId, instance);
    this._initialized.add(componentId);
  }

  /**
   * Check if a component instance already exists (without triggering instantiation)
   */
  hasInstance(componentId: string): boolean {
    return this._instances.has(componentId);
  }

  /**
   * Get or create a component instance by ID
   */
  getInstance<T = unknown>(componentId: string): T | undefined {
    if (this._instances.has(componentId)) {
      return this._instances.get(componentId) as T;
    }

    const Component = this.components.find((c) => c.id === componentId);
    if (!Component) {
      return undefined;
    }

    this.createInstance(Component);
    return this._instances.get(componentId) as T;
  }

  /**
   * Create a component instance using factory or constructor
   * Merges { reg } with init params for this component
   * Components can access app via reg.app for utility methods
   */
  private createInstance(Component: ComponentClass): void {
    const componentId = Component.id;

    if (this.constructionStack.includes(componentId)) {
      const cycle = [...this.constructionStack, componentId].join(' -> ');
      throw new Error(`Circular dependency: ${cycle}`);
    }

    this.constructionStack.push(componentId);

    try {
      // All constructors receive args with reg and any init params
      // Components get dx via this.fn.dx.sub() after calling reg.use()
      // Components can access app utilities via reg.app
      const args = { reg: this, ...this.init[componentId] };
      let instance: unknown;
      
      if ('create' in Component && typeof Component.create === 'function') {
        instance = Component.create(args);
      } else {
        instance = new Component(args);
      }
      
      this._instances.set(componentId, instance);
      this._initialized.add(componentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.dx.error(`Failed to create '${componentId}': ${msg}`);
      throw err;
    } finally {
      this.constructionStack.pop();
    }
  }

  /**
   * Request methods from components
   * Returns lazy proxies - components are only instantiated when methods are actually called
   */
  use(...methodIds: string[]): FnImport_t {
    const allMethods = [...methodIds, ...this.always];
    const result: FnImport_t = {};

    for (const methodName of allMethods) {
      let id: string | undefined;
      let actualMethodName: string;

      if (methodName.includes('.')) {
        const parts = methodName.split('.');
        id = parts[0];
        actualMethodName = parts.slice(1).join('.');
      } else {
        actualMethodName = methodName;
      }

      // For already-registered instances (like dx), bind immediately
      if (id && this._instances.has(id)) {
        const instance = this._instances.get(id);
        if (instance) {
          const value = (instance as Record<string, unknown>)[actualMethodName];
          if (!result[id]) result[id] = {};
          if (typeof value === 'function') {
            result[id][actualMethodName] = value.bind(instance);
          } else {
            throw new Error(`'${id}.${actualMethodName}' is not a function`);
          }
        }
        continue;
      }

      // Find component class that owns this method
      let foundComponent: ComponentClass | undefined;

      if (id) {
        foundComponent = this.components.find((c) => c.id === id);
        if (!foundComponent) {
          throw new Error(`Component '${id}' not found`);
        }
      } else {
        // Search by method name in prototypes (use 'in' to find inherited methods too)
        for (const Component of this.components) {
          if (actualMethodName in (Component.prototype || {})) {
            foundComponent = Component;
            break;
          }
        }
        if (!foundComponent) {
          throw new Error(`Method '${actualMethodName}' not found`);
        }
      }

      const componentId = foundComponent.id;
      if (!result[componentId]) result[componentId] = {};

      // Return lazy proxy - instance created on first call
      result[componentId][actualMethodName] = ((...args: unknown[]) => {
        const instance = this.getInstance(componentId);
        if (!instance) {
          throw new Error(`Failed to get instance of '${componentId}'`);
        }
        const method = (instance as Record<string, unknown>)[actualMethodName];
        if (typeof method !== 'function') {
          throw new Error(`'${componentId}.${actualMethodName}' is not a function`);
        }
        return method.apply(instance, args);
      }) as Function;
    }

    return result;
  }

  /**
   * Cleanup all components
   */
  done(): void {
    const ids = Array.from(this._initialized).reverse();
    for (const id of ids) {
      // Skip dx for now, clean it up last
      if (id === 'dx') continue;
      const instance = this._instances.get(id);
      if (instance && typeof (instance as { done?: () => void }).done === 'function') {
        try {
          (instance as { done: () => void }).done();
        } catch (err) {
          this.dx.out(`Error in ${id}.done(): ${err}`);
        }
      }
    }
    // Clean up dx last
    this.dx.done();
  }
}
