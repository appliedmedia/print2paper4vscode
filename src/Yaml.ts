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
  private cached: T | undefined = undefined;

  constructor(
    private app: App,
    private filePath: string,
    private dataStruct: T
  ) {}

  init(): void {
    // Nothing to initialize
  }

  done(): void {
    // Clear cache
    this.cached = undefined;
  }

  get(): T {
    if (this.cached === undefined) {
      this.cached = this.app.os.fileRead<T>(this.filePath) || this.dataStruct;
    }
    return this.cached;
  }
}
