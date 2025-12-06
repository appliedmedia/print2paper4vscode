/**
 * Yaml - Generic YAML file loader with caching
 *
 * Purpose:
 *   Provides a reusable pattern for loading and caching YAML files throughout the extension.
 *   Handles single-attempt loading, error reporting, and fallback to empty defaults.
 *
 * Inputs:
 *   - app: App instance for file reading and error display
 *   - filePath: Path to YAML file (extension-relative or absolute)
 *   - dataStruct: Data structure template with empty string values if load fails
 *
 * Outputs:
 *   - get(): Returns cached YAML object (loaded content or empty dataStruct)
 *
 * Key Features:
 *   - Single-attempt loading (never retries after first attempt)
 *   - Automatic error display via UI.showErrorMessage
 *   - Type-safe generic interface
 *   - Minimal boilerplate in consuming classes
 */

import type { Registry } from './Registry';
import type { FnImport_t } from './types/Registry_t';

// Yaml instance - created by YamlFactory
export class YamlInstance<T extends Record<string, string>> {
  private cached: T | undefined = undefined;
  private reg: Registry;
  private fn: FnImport_t;
  private filePath: string;
  private dataStruct: T;

  constructor(args: { reg: Registry; filePath: string; dataStruct: T }) {
    // Note: Cannot use dx.require here as Diagnostics is not yet initialized
    if (!args.reg || !args.filePath || !args.dataStruct) {
      throw new Error('Yaml constructor requires reg, filePath, and dataStruct');
    }
    const { reg, filePath, dataStruct } = args;
    this.reg = reg;
    this.fn = this.reg.use('os.fileRead');
    this.filePath = filePath;
    this.dataStruct = dataStruct;
  }

  done(): void {
    // Clear cache
    this.cached = undefined;
  }

  get(): T {
    if (this.cached === undefined) {
      const fileRead = this.fn.os.fileRead as import('./OS').FileRead_t;
      this.cached = fileRead<T>({ path: this.filePath }) || this.dataStruct;
    }
    return this.cached as T;
  }
}

// Yaml factory singleton - Registry instantiates this
export class Yaml {
  static readonly id = 'yaml';
  private reg: Registry;

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
  }

  // Factory method exposed to components via this.fn.yaml.create()
  create<T extends Record<string, string>>(args: { filePath: string; dataStruct: T }): YamlInstance<T> {
    return new YamlInstance({ reg: this.reg, ...args });
  }
}

// end, Yaml.ts
