import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import type { FnImport_t } from './types/Registry_t';

/**
 * Component interface for Registry-managed classes
 * All constructors take a single args object with app: App plus any extra params
 */
export interface ComponentClass {
  readonly id: string;
  create?(args: { app: App } & Record<string, unknown>): unknown;
  new (args: { app: App } & Record<string, unknown>): unknown;
}

/**
 * Registry - Dependency injection and lazy component management system
 *
 * Components are created lazily when first accessed via use().
 * Special init params (like vscode/context for VSCodeAPIs) are passed
 * via the init dict at Registry construction.
 */
export class Registry {
  static readonly id = 'reg';

  [key: string]: unknown;

  private _instances: Map<string, unknown> = new Map();
  private _initialized: Set<string> = new Set();
  private components: ComponentClass[] = [];
  private always: string[] = [];
  private init: Record<string, Record<string, unknown>> = {};
  private dx: Diagnostics;
  private app: App;
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

    // Create Registry's own Diagnostics
    this.dx = this.app.dx.sub({ name: 'Registry' });

    // Register App's dx so components can use dx.sub
    this._instances.set('dx', this.app.dx);
    this._initialized.add('dx');

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
   * Merges { app } with init params for this component
   */
  private createInstance(Component: ComponentClass): void {
    const componentId = Component.id;

    if (this.constructionStack.includes(componentId)) {
      const cycle = [...this.constructionStack, componentId].join(' -> ');
      throw new Error(`Circular dependency: ${cycle}`);
    }

    this.constructionStack.push(componentId);

    try {
      // All constructors receive args with app + any init params
      const args = { app: this.app, ...this.init[componentId] };
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

      // Find component that owns this method
      let foundComponent: ComponentClass | undefined;

      if (id) {
        foundComponent = this.components.find((c) => c.id === id);
        
        // Check if already registered (like dx)
        if (!foundComponent && this._instances.has(id)) {
          const instance = this._instances.get(id);
          if (instance) {
            const value = (instance as Record<string, unknown>)[actualMethodName];
            if (!result[id]) result[id] = {};
            if (typeof value === 'function') {
              result[id][actualMethodName] = value.bind(instance);
            } else {
              result[id][actualMethodName] = value as Function;
            }
          }
          continue;
        }
        
        if (!foundComponent) {
          throw new Error(`Component '${id}' not found`);
        }
      } else {
        // Search by method name
        for (const Component of this.components) {
          if (Component.prototype?.hasOwnProperty(actualMethodName)) {
            foundComponent = Component;
            break;
          }
        }
        
        // Check registered instances
        if (!foundComponent) {
          for (const [instId, instance] of this._instances) {
            if (instance && typeof (instance as Record<string, unknown>)[actualMethodName] === 'function') {
              if (!result[instId]) result[instId] = {};
              result[instId][actualMethodName] = ((instance as Record<string, unknown>)[actualMethodName] as Function).bind(instance);
              break;
            }
          }
          continue;
        }
      }

      if (!foundComponent) {
        throw new Error(`Method '${actualMethodName}' not found`);
      }

      const componentId = foundComponent.id;

      if (!this._instances.has(componentId)) {
        this.createInstance(foundComponent);
      }

      const instance = this._instances.get(componentId);
      if (!instance) continue;

      if (!result[componentId]) result[componentId] = {};

      const value = (instance as Record<string, unknown>)[actualMethodName];
      if (typeof value === 'function') {
        result[componentId][actualMethodName] = value.bind(instance);
      } else {
        result[componentId][actualMethodName] = value as Function;
      }
    }

    return result;
  }

  /**
   * Cleanup all components
   */
  done(): void {
    const ids = Array.from(this._initialized).reverse();
    for (const id of ids) {
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
  }
}
