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

import type { App } from './App';

export class Yaml<T extends Record<string, string>> {
  static readonly id = 'yaml';
  private cached: T | undefined = undefined;
  private app: App;
  private filePath: string;
  private dataStruct: T;

  private constructor(args: { app: App; filePath: string; dataStruct: T }) {
    // Note: Cannot use dx.require here as Diagnostics is not yet initialized
    if (!args.app || !args.filePath || !args.dataStruct) {
      throw new Error('Yaml constructor requires app, filePath, and dataStruct');
    }
    const { app, filePath, dataStruct } = args;
    this.app = app;
    this.filePath = filePath;
    this.dataStruct = dataStruct;
  }

  static create<T extends Record<string, string>>(args: { app: App }, filePath: string, dataStruct: T): Yaml<T> {
    return new Yaml({ app: args.app, filePath, dataStruct });
  }

  done(): void {
    // Clear cache
    this.cached = undefined;
  }

  get(): T {
    if (this.cached === undefined) {
      this.cached = this.app.os.fileRead<T>({ path: this.filePath }) || this.dataStruct;
    }
    return this.cached;
  }
}
