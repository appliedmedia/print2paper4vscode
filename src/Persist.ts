import type { Registry } from './Registry';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import type { UI_t } from './UI';
import type { GlobalStateKey_t, GlobalStateValue_t } from './VSCodeAPIs';
import { kMenuId } from './UIMenu';

// Persist value types - what we store locally
// NOTE: No booleans - we have no global persist bools in this codebase.
// All menu selections are strings (menuItemId) or numbers (zoom levels, margins).
// If you need boolean-like state, use string values like 'on'/'off' or '1'/'0'.
export type PersistValue_t = string | number;

// Empty value: intentionally not persisted (for flyout-only parent menus)
export const kEmptyNoPersist = '';

// Type for dynamically created properties on Persist instances
export type Persist_t = Record<UI_t, PersistValue_t>;

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
export class Persist {
  static readonly id = 'persist';
  private reg: Registry;
  private fn: FnImport_t;
  private dx: Diagnostics;
  private default: Record<string, PersistValue_t> = {};
  private value: Record<string, PersistValue_t> = {};
  
  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'vscodeapis.getGlobalState',
      'vscodeapis.updateGlobalState',
      'vscodeapis.deleteGlobalState',
      'ui.showInfoMessage'
    );
    this.dx = this.fn.dx.sub({ name: 'Persist' });
  }

  // Factory method that returns the singleton (for API consistency with Yaml)
  // Persist is inherently a singleton because it manages shared global state
  create(): Persist {
    return this;
  }

  register(name: string): this {
    Object.defineProperty(this, name, {
      get: () => {
        let result: unknown = undefined;

        // Check in-memory cache first
        if (this.value[name] !== undefined) {
          result = this.value[name];
        } else {
          // Try to get from global state (may fail if not a GlobalStateKey)
          const globalValue = this.fn.vscodeapis.getGlobalState(name as GlobalStateKey_t);
          if (globalValue !== undefined) {
            this.value[name] = globalValue;
            result = globalValue;
          } else if (this.default[name] !== undefined) {
            // Fall back to default value
            const defaultValue = this.default[name];
            this.value[name] = defaultValue;
            // Try to persist default to global state
            this.fn.vscodeapis.updateGlobalState({
              key: name as GlobalStateKey_t,
              value: defaultValue as GlobalStateValue_t,
            });
            result = defaultValue;
          }
        }

        return result;
      },
      set: (value: PersistValue_t) => {
        if (value !== this.value[name]) {
          this.value[name] = value;
          // Skip global state update if value is empty string (non-persistent menus like 'print'/'page')
          if (value !== kEmptyNoPersist) {
            this.fn.vscodeapis.updateGlobalState({
              key: name as GlobalStateKey_t,
              value: value as GlobalStateValue_t,
            });
          }
        }
      },
      enumerable: true,
      configurable: true,
    });
    return this;
  }

  async validateDefault(args: {
    name: string;
    computeFn: () => Promise<PersistValue_t>;
  }): Promise<PersistValue_t> {
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
  async clear(): Promise<void> {
    // Clear all menu-related state
    const keysToReset: GlobalStateKey_t[] = [...kMenuId, 'toolbar_pos'];

    for (const key of keysToReset) {
      await this.fn.vscodeapis.deleteGlobalState({
        key: key as GlobalStateKey_t,
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
  static async clear(args: { reg: Registry }): Promise<void> {
    const { reg } = args;
    const fn = reg.use(
      'vscodeapis.deleteGlobalState',
      'ui.showInfoMessage'
    );

    // Clear all menu-related state
    const keysToReset: GlobalStateKey_t[] = [...kMenuId, 'toolbar_pos'];

    for (const key of keysToReset) {
      await fn.vscodeapis.deleteGlobalState({
        key: key as GlobalStateKey_t,
      });
    }

    // Inform user
    fn.ui.showInfoMessage('Print2Paper state reset - reopen print view to see defaults');
  }
}

// end, Persist.ts
