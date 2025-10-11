import type { App } from './App';
import type { GlobalStateKey } from './types/globalState_t';

export class Persist {
  private app: App;
  private defaults: { [key: string]: any } = {};

  constructor(app: App) {
    this.app = app;
  }

  register(name: string): this {
    Object.defineProperty(this, name, {
      get: () => {
        if ((this as any).hasOwnProperty(`_${name}`)) {
          return (this as any)[`_${name}`];
        }
        
        const globalValue = this.app.vscodeapis.getGlobalState(name as GlobalStateKey);
        if (globalValue !== undefined) {
          (this as any)[`_${name}`] = globalValue;
          return globalValue;
        }
        
        if (this.defaults[name] !== undefined) {
          const defaultValue = this.defaults[name];
          (this as any)[`_${name}`] = defaultValue;
          this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, defaultValue);
          return defaultValue;
        }
        
        return undefined;
      },
      set: (value: any) => {
        const currentValue = (this as any)[`_${name}`];
        if (value !== currentValue) {
          (this as any)[`_${name}`] = value;
          this.app.vscodeapis.updateGlobalState(name as GlobalStateKey, value);
        }
      },
      enumerable: true,
      configurable: true
    });
    return this;
  }

  setDefault(name: string, defaultValue: any): this {
    this.defaults[name] = defaultValue;
    return this;
  }
}