"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Persist = exports.kEmptyNoPersist = void 0;
const UIMenu_1 = require("./UIMenu");
// Empty value: intentionally not persisted (for flyout-only parent menus)
exports.kEmptyNoPersist = '';
/**
 * Persist - Dynamic property persistence with VS Code global state
 *
 * Creates dynamic properties that automatically sync with VS Code's global state.
 * Properties are registered on-demand and use a three-tier lookup: in-memory cache,
 * global state, then default values. Supports transparent read/write with automatic
 * state synchronization.
 *
 * @input reg - Registry instance for global state access
 * @output Dynamic properties with persistent storage, default value management
 *
 * @example
 * const persist = Persist.create({ reg });
 * persist.register('theme').validateDefault('theme', async () => 'github-light');
 * console.log(persist.theme); // 'github-light' from default
 * persist.theme = 'dark'; // Saves to VS Code global state
 */
class Persist {
    static id = 'persist';
    reg;
    fn;
    dx;
    default = {};
    value = {};
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('vscodeapis.getGlobalState', 'vscodeapis.updateGlobalState', 'vscodeapis.deleteGlobalState', 'ui.showInfoMessage');
        this.dx = this.fn.dx.sub({ name: 'Persist' });
    }
    /**
     * Get a persisted value
     * Returns undefined if key not found and no default set
     */
    get(name) {
        let result = undefined;
        // Check in-memory cache first
        if (this.value[name] !== undefined) {
            result = this.value[name];
        }
        else {
            // Try to get from global state
            const globalValue = this.fn.vscodeapis.getGlobalState(name);
            if (globalValue !== undefined) {
                this.value[name] = globalValue;
                result = globalValue;
            }
            else if (this.default[name] !== undefined) {
                // Fall back to default value
                const defaultValue = this.default[name];
                this.value[name] = defaultValue;
                // Try to persist default to global state
                this.fn.vscodeapis.updateGlobalState({
                    key: name,
                    value: defaultValue,
                });
                result = defaultValue;
            }
        }
        return result;
    }
    /**
     * Set a persisted value
     * Saves to both in-memory cache and VS Code global state
     */
    set(name, value) {
        if (value !== this.value[name]) {
            this.value[name] = value;
            // Skip global state update if value is empty string (non-persistent menus like 'print'/'page')
            if (value !== exports.kEmptyNoPersist) {
                this.fn.vscodeapis.updateGlobalState({
                    key: name,
                    value: value,
                });
            }
        }
    }
    async validateDefault(args) {
        const dx = this.dx.sub({ name: 'validateDefault' });
        dx.require(args, ['name', 'computeFn']);
        const { name, computeFn } = args;
        const existing = this.default[name];
        if (existing !== undefined) {
            dx.done();
            return existing;
        }
        const computed = await computeFn();
        this.default[name] = computed;
        dx.done();
        return computed;
    }
    /**
     * Clear all persist state
     */
    async clear() {
        // Clear all menu-related state
        const keysToReset = [...UIMenu_1.kMenuId, 'toolbar_pos'];
        for (const key of keysToReset) {
            await this.fn.vscodeapis.deleteGlobalState({
                key: key,
            });
        }
        // Clear in-memory caches
        this.value = {};
        this.default = {};
        // Inform user
        this.fn.ui.showInfoMessage('Print2Paper state reset - reopen print view to see defaults');
    }
    /**
     * Clear all persist state (static version for global operations)
     */
    static async clear(args) {
        const { reg } = args;
        // Get the singleton instance and call its clear method
        const persist = reg.getInstance('persist');
        await persist.clear();
    }
}
exports.Persist = Persist;
// end, Persist.ts
//# sourceMappingURL=Persist.js.map