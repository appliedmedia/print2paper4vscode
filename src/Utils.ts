/**
 * Utils - Utility functions for the extension
 * 
 * Provides shared utility methods that were previously on App
 */

import type { Registry } from './Registry';
import type { FnImport_t } from './types/Registry_t';
import { kPath } from './types/OS_t';

// Type aliases
export type Force_scalar_t = number | string | undefined;
export type Force_dict_t = Record<string, Force_scalar_t>;
export type ForceNumbers_t = Record<string, number>;

export class Utils {
  static readonly id = 'utils';
  private reg: Registry;
  private fn: FnImport_t;
  private ns: string;
  private ns_: string;

  constructor(args: { reg: Registry; ns: string; ns_: string }) {
    this.reg = args.reg;
    this.ns = args.ns;
    this.ns_ = args.ns_;
    // Initialize fn to access diagnostics.sub method
    this.fn = this.reg.use('dx.sub');
  }

  /**
   * Escape HTML special characters to prevent XSS
   * Converts: & < > " ' to HTML entities
   */
  htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Generic template replacement function
   * Replaces all {{key}} placeholders in source text with values from dict
   * Supports nested placeholders by performing multiple passes until no changes occur
   * Automatically includes namespace values (ns, ns_) in every replacement dict
   */
  templateDictReplace(source: string, dict: Record<string, string>): string {
    let result = source;
    const maxIterations = 4;
    let iteration = 0;
    let changed = true;

    // Auto-inject namespace values into dict
    const dictPlus: Record<string, string> = {
      ns: this.ns,
      ns_: this.ns_,
      path_lib: kPath.lib,
      path_yaml: kPath.yaml,
      ...dict,
    };

    // Repeat replacement passes until no changes occur or max iterations reached
    while (changed && iteration < maxIterations) {
      const previousResult = result;
      iteration++;

      for (const key of Object.keys(dictPlus)) {
        const placeholder = `{{${key}}}`;
        const value = dictPlus[key];
        result = result.replaceAll(placeholder, value);
      }

      changed = result !== previousResult;
    }

    return result;
  }

  /**
   * Force a single value to number, ensuring finite result
   * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with 0.
   */
  forceNumber(value: Force_scalar_t): number {
    return this.forceNumbers({ value }).value;
  }

  /**
   * Force a dictionary of values to numbers, ensuring all finite results
   * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with useForZero.
   * If requiredKeys specified, missing keys are added and set to useForZero.
   */
  forceNumbers(
    dict: Force_dict_t,
    useForZero = 0,
    requiredKeys?: readonly string[]
  ): ForceNumbers_t {
    const force1Number = (value: Force_scalar_t): number => {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return !Number.isFinite(parsed) || parsed === 0 ? useForZero : parsed;
    };

    // Don't mutate input - create local copy
    const dictLocal = { ...dict };

    const dictResult: ForceNumbers_t = {};

    if (requiredKeys) {
      for (const key of requiredKeys) {
        if (!(key in dictLocal)) {
          dictLocal[key] = useForZero;
        }
      }
    }

    for (const [key, value] of Object.entries(dictLocal)) {
      dictResult[key] = force1Number(value);
    }

    if (Object.keys(dictResult).length === 0) {
      dictResult['0'] = useForZero;
    }

    return dictResult;
  }

  /**
   * Force a value to be a string, returning useForEmpty if invalid
   *
   * Mirrors forceNumber() but for string content validation.
   * Ensures values are strings and provides fallback for empty/null/undefined.
   *
   * @param val - Value to force to string
   * @param useForEmpty - Value to use for empty/null/undefined (default: '')
   * @returns String value or useForEmpty
   */
  forceContent(val: Force_scalar_t, useForEmpty: string = ''): string {
    if (val === null || val === undefined || val === '') {
      return useForEmpty;
    }
    return String(val);
  }

  /**
   * Force all values in dict to strings with required keys validation
   *
   * Mirrors forceNumbers() but for string content validation.
   * Ensures all values are strings and adds missing required keys with useForEmpty.
   *
   * @param dict - Dictionary to process
   * @param useForEmpty - Value to use for empty/null/undefined (default: '')
   * @param requiredKeys - Keys that must exist (will be added with useForEmpty if missing)
   * @returns Dictionary with all values as strings
   */
  forceContents(
    dict: Force_dict_t,
    useForEmpty: string = '',
    requiredKeys?: readonly string[]
  ): Record<string, string> {
    const dx = this.fn.dx.sub({ name: 'forceContents' });
    const result: Record<string, string> = {};

    // Add all required keys first with useForEmpty
    if (requiredKeys) {
      for (const key of requiredKeys) {
        result[key] = useForEmpty;
      }
    }

    // Process all dict values, converting to strings
    for (const [key, val] of Object.entries(dict)) {
      result[key] = this.forceContent(val, useForEmpty);
    }

    dx.done();
    return result;
  }

  /**
   * Check if content has content when stringified
   * Note: Numbers (including 0) and booleans (including false) always have content after stringification.
   * Only undefined and empty strings are considered empty.
   */
  hasContent(content: string | number | boolean | undefined = ''): boolean {
    return String(content ?? '').length > 0;
  }
}
