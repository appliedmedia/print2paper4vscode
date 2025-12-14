"use strict";
/**
 * Utils - Utility functions for the extension
 *
 * Provides shared utility methods that were previously on App
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
class Utils {
    static id = 'utils';
    reg;
    ns;
    ns_;
    constructor(args) {
        this.reg = args.reg;
        this.ns = args.ns;
        this.ns_ = args.ns_;
    }
    /**
     * Generic template replacement function
     * Replaces all {{key}} placeholders in source text with values from dictionary
     * Supports nested placeholders by performing multiple passes until no changes occur
     * Automatically includes namespace values (ns, ns_) in every replacement dictionary
     */
    templateDictReplace(source, dictionary) {
        let result = source;
        const maxIterations = 4;
        let iteration = 0;
        let changed = true;
        // Auto-inject namespace values into dictionary
        const enrichedDictionary = {
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
    forceNumber(value) {
        return this.forceNumbers({ value }).value;
    }
    /**
     * Force a dictionary of values to numbers, ensuring all finite results
     * Converts strings to numbers. Replaces undefined, NaN, Infinity, or zero with useForZero.
     * If requiredKeys specified, missing keys are added and set to useForZero.
     */
    forceNumbers(dict, useForZero = 0, requiredKeys) {
        const force1Number = (value) => {
            const parsed = typeof value === 'number' ? value : parseFloat(String(value));
            return !Number.isFinite(parsed) || parsed === 0 ? useForZero : parsed;
        };
        const dictResult = {};
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
    hasContent(content = '') {
        return String(content ?? '').length > 0;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map