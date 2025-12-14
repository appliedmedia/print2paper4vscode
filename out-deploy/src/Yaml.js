"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yaml = exports.YamlInstance = void 0;
// Yaml instance - created by YamlFactory
class YamlInstance {
    cached = undefined;
    reg;
    fn;
    filePath;
    dataStruct;
    constructor(args) {
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
    done() {
        // Clear cache
        this.cached = undefined;
    }
    get() {
        if (this.cached === undefined) {
            const fileRead = this.fn.os.fileRead;
            this.cached = fileRead({ path: this.filePath }) || this.dataStruct;
        }
        return this.cached;
    }
}
exports.YamlInstance = YamlInstance;
// Yaml factory singleton - Registry instantiates this
class Yaml {
    static id = 'yaml';
    reg;
    constructor(args) {
        this.reg = args.reg;
    }
    // Factory method exposed to components via this.fn.yaml.create()
    create(args) {
        return new YamlInstance({ reg: this.reg, ...args });
    }
}
exports.Yaml = Yaml;
// end, Yaml.ts
//# sourceMappingURL=Yaml.js.map