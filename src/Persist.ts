import type { App } from './App';
import type { GlobalStateKey, GlobalStateValue } from './types/globalState_t';

export class Persist {
  private app: App;
  private default: { [key in GlobalStateKey]?: GlobalStateValue } = {};

  constructor(app: App) {
    this.app = app;
  }

  register(name: GlobalStateKey): this {
    Object.defineProperty(this, name, {
      get: () => {
        if ((this as any).hasOwnProperty(`_${name}`)) {
          return (this as any)[`_${name}`];
        }
        
        const globalValue = this.app.vscodeapis.getGlobalState(name);
        if (globalValue !== undefined) {
          (this as any)[`_${name}`] = globalValue;
          return globalValue;
        }
        
        if (this.default[name] !== undefined) {
          const defaultValue = this.default[name];
          (this as any)[`_${name}`] = defaultValue;
          this.app.vscodeapis.updateGlobalState(name, defaultValue);
          return defaultValue;
        }
        
        return undefined;
      },
      set: (value: GlobalStateValue) => {
        const currentValue = (this as any)[`_${name}`];
        if (value !== currentValue) {
          (this as any)[`_${name}`] = value;
          this.app.vscodeapis.updateGlobalState(name, value);
        }
      },
      enumerable: true,
      configurable: true
    });
    return this;
  }

  setDefault(name: GlobalStateKey, defaultValue: GlobalStateValue): this {
    this.default[name] = defaultValue;
    return this;
  }
}