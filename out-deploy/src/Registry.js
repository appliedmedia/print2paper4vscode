"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
const Diagnostics_1 = require("./Diagnostics");
/**
 * Registry - Dependency injection and lazy component management system
 *
 * Components are created lazily when first accessed via use().
 * Special init params (like vscode/context for VSCodeAPIs) are passed
 * via the init dict at Registry construction.
 *
 * Diagnostics is bootstrapped first - pass init.dx.name for root dx name (e.g., 'App').
 */
class Registry {
    static id = 'reg';
    _instances = new Map();
    _initialized = new Set();
    components = [];
    always = [];
    init = {};
    fn;
    dx;
    app;
    constructionStack = [];
    constructor(args) {
        this.app = args.app;
        this.components = args.components || [];
        this.always = args.always || [];
        this.init = args.init || {};
        // Bootstrap: Create root Diagnostics first (before anything else)
        // Use init.dx.name for root name (defaults to 'App')
        const dxInit = this.init['dx'] || {};
        const rootDxName = dxInit.name || 'App';
        const rootDx = new Diagnostics_1.Diagnostics({ name: rootDxName, app: this.app });
        this._instances.set('dx', rootDx);
        this._initialized.add('dx');
        // Now Registry can use fn.dx.sub() like everyone else
        this.fn = this.use();
        this.dx = this.fn.dx.sub({ name: 'Registry' });
        // Build placeholder structure for intellisense
        for (const Component of this.components) {
            if (Component.id) {
                this[Component.id] = {};
            }
        }
    }
    /**
     * Register an existing component instance
     */
    registerInstance(componentId, instance) {
        this._instances.set(componentId, instance);
        this._initialized.add(componentId);
    }
    /**
     * Check if a component instance already exists (without triggering instantiation)
     */
    hasInstance(componentId) {
        return this._instances.has(componentId);
    }
    /**
     * Get or create a component instance by ID
     */
    getInstance(componentId) {
        if (this._instances.has(componentId)) {
            return this._instances.get(componentId);
        }
        const Component = this.components.find((c) => c.id === componentId);
        if (!Component) {
            return undefined;
        }
        this.createInstance(Component);
        return this._instances.get(componentId);
    }
    /**
     * Create a component instance using factory or constructor
     * Merges { reg } with init params for this component
     * Components can access app via reg.app for utility methods
     */
    createInstance(Component) {
        const componentId = Component.id;
        if (this.constructionStack.includes(componentId)) {
            const cycle = [...this.constructionStack, componentId].join(' -> ');
            this.dx.error(`Circular dependency: ${cycle}`);
            throw new Error(`Circular dependency: ${cycle}`);
        }
        this.constructionStack.push(componentId);
        try {
            // All constructors receive args with reg and any init params
            // Components get dx via this.fn.dx.sub() after calling reg.use()
            // Components can access app utilities via reg.app
            const args = { reg: this, ...this.init[componentId] };
            let instance;
            if ('create' in Component && typeof Component.create === 'function') {
                instance = Component.create(args);
            }
            else {
                instance = new Component(args);
            }
            this._instances.set(componentId, instance);
            this._initialized.add(componentId);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.dx.error(`Failed to create '${componentId}': ${msg}`);
            throw err;
        }
        finally {
            this.constructionStack.pop();
        }
    }
    /**
     * Request methods from components
     * Returns lazy proxies - components are only instantiated when methods are actually called
     */
    use(...methodIds) {
        const allMethods = [...methodIds, ...this.always];
        const result = {};
        for (const methodName of allMethods) {
            let id;
            let actualMethodName;
            if (methodName.includes('.')) {
                const parts = methodName.split('.');
                id = parts[0];
                actualMethodName = parts.slice(1).join('.');
            }
            else {
                actualMethodName = methodName;
            }
            // For already-registered instances (like dx), bind immediately
            if (id && this._instances.has(id)) {
                const instance = this._instances.get(id);
                if (instance) {
                    const value = instance[actualMethodName];
                    if (!result[id])
                        result[id] = {};
                    if (typeof value === 'function') {
                        result[id][actualMethodName] = value.bind(instance);
                    }
                    else {
                        this.dx.error(`'${id}.${actualMethodName}' is not a function`);
                        throw new Error(`'${id}.${actualMethodName}' is not a function`);
                    }
                }
                continue;
            }
            // Find component class that owns this method
            let foundComponent;
            if (id) {
                foundComponent = this.components.find((c) => c.id === id);
                if (!foundComponent) {
                    this.dx.error(`Component '${id}' not found`);
                    throw new Error(`Component '${id}' not found`);
                }
            }
            else {
                // Search by method name in prototypes (use 'in' to find inherited methods too)
                for (const Component of this.components) {
                    if (actualMethodName in (Component.prototype || {})) {
                        foundComponent = Component;
                        break;
                    }
                }
                if (!foundComponent) {
                    this.dx.error(`Method '${actualMethodName}' not found`);
                    throw new Error(`Method '${actualMethodName}' not found`);
                }
            }
            const componentId = foundComponent.id;
            if (!result[componentId])
                result[componentId] = {};
            // Return lazy proxy - instance created on first call
            result[componentId][actualMethodName] = ((...args) => {
                const instance = this.getInstance(componentId);
                if (!instance) {
                    this.dx.error(`Failed to get instance of '${componentId}'`);
                    throw new Error(`Failed to get instance of '${componentId}'`);
                }
                const method = instance[actualMethodName];
                if (typeof method !== 'function') {
                    this.dx.error(`'${componentId}.${actualMethodName}' is not a function`);
                    throw new Error(`'${componentId}.${actualMethodName}' is not a function`);
                }
                return method.apply(instance, args);
            });
        }
        return result;
    }
    /**
     * Cleanup all components
     */
    done() {
        const ids = Array.from(this._initialized).reverse();
        for (const id of ids) {
            // Skip dx for now, clean it up last
            if (id === 'dx')
                continue;
            const instance = this._instances.get(id);
            if (instance && typeof instance.done === 'function') {
                try {
                    instance.done();
                }
                catch (err) {
                    this.dx.out(`Error in ${id}.done(): ${err}`);
                }
            }
        }
        // Clean up dx last
        this.dx.done();
    }
}
exports.Registry = Registry;
//# sourceMappingURL=Registry.js.map