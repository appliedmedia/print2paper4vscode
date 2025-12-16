/**
 * Utils - Utility functions for the extension
 * 
 * Provides shared utility methods that were previously on App
 */

import type { Registry } from './Registry';

// Type aliases
export type ForceNumber_scalar_t = number | string | undefined;
export type ForceNumber_dict_t = Record<string, ForceNumber_scalar_t>;
export type ForceNumbers_t = Record<string, number>;

export class Utils {
  static readonly id = 'utils';
  private reg: Registry;
  private ns: string;
  private ns_: string;

  constructor(args: { reg: Registry; ns: string; ns_: string }) {
    this.reg = args.reg;
    this.ns = args.ns;
    this.ns_ = args.ns_;
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
   * Replaces all {{key}} placeholders in source text with values from dictionary
   * Supports nested placeholders by performing multiple passes until no changes occur
   * Automatically includes namespace values (ns, ns_) in every replacement dictionary
   */
  templateDictReplace(source: string, dictionary: Record<string, string>): string {
    let result = source;
    const maxIterations = 4;
    let iteration = 0;
    let changed = true;

    // Auto-inject namespace values into dictionary
    const enrichedDictionary: Record<string, string> = {
      ns: this.ns,
      ns_: this.ns_,
      ...dictionary,
    };

    // Repeat replacement passes until no changes occur or max iterations reached
    while (changed && iteration < maxIterations) {
      const previousResult = result;
      iteration++;

      for (const key of Object.keys(enrichedDictionary)) {
        const placeholder = `{{${key}}}`;
        const value = enrichedDictionary[key];
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
  forceNumber(value: ForceNumber_scalar_t): number {
    return this.forceNumbers({ value }).value;
  }

  /**
   * Force a dictionary of values to numbers, ensuring all finite results
   * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with useForZero.
   * If requiredKeys specified, missing keys are added and set to useForZero.
   */
  forceNumbers(
    dict: ForceNumber_dict_t,
    useForZero = 0,
    requiredKeys?: readonly string[]
  ): ForceNumbers_t {
    const force1Number = (value: ForceNumber_scalar_t): number => {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return !Number.isFinite(parsed) || parsed === 0 ? useForZero : parsed;
    };

    const dictResult: ForceNumbers_t = {};

    if (requiredKeys) {
      for (const key of requiredKeys) {
        if (!(key in dict)) {
          dict[key] = useForZero;
        }
      }
    }

    for (const [key, value] of Object.entries(dict)) {
      dictResult[key] = force1Number(value);
    }

    if (Object.keys(dictResult).length === 0) {
      dictResult['0'] = useForZero;
    }

    return dictResult;
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
