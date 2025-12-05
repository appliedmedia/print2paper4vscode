import type { App } from './App';
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
 * @input app - Application instance for global state access
 * @output Dynamic properties with persistent storage, default value management
 *
 * @example
 * const persist = new Persist(app);
 * persist.register('theme').validateDefault('theme', async () => 'github-light');
 * console.log(persist.theme); // 'github-light' from default
 * persist.theme = 'dark'; // Saves to VS Code global state
 */
export class Persist {
  static readonly id = 'persist';
  private fn: FnImport_t;
  private dx: Diagnostics;
  private default: Record<string, PersistValue_t> = {};
  private value: Record<string, PersistValue_t> = {};

  private app: App;
  
  private constructor(args: { app: App }) {
    this.app = args.app;
    // Only request dx.sub via Registry (always available)
    // Other dependencies accessed via this.app.xxx to avoid circular deps during construction
    this.fn = this.app.reg.use();
    this.dx = this.fn.dx.sub({ name: 'Persist' });
  }
  
  static create(args: { app: App }): Persist {
    return new Persist(args);
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
          const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey_t);
          if (globalValue !== undefined) {
            this.value[name] = globalValue;
            result = globalValue;
          } else if (this.default[name] !== undefined) {
            // Fall back to default value
            const defaultValue = this.default[name];
            this.value[name] = defaultValue;
            // Try to persist default to global state
            this.app.vscodeapis.updateGlobalState({
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
            this.app.vscodeapis.updateGlobalState({
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
      await this.app.vscodeapis.deleteGlobalState({
        key: key as GlobalStateKey_t,
      });
    }

    // Clear in-memory caches
    this.value = {};
    this.default = {};

    // Inform user
    this.app.ui.showInfoMessage('Print2Paper state reset - reopen print view to see defaults');
  }
}

// end, Persist.ts
