/**
 * Registry Type Definitions
 *
 * Type definitions for the Registry dependency injection system.
 */

/**
 * FnImport_t - What a class imports (receives from Registry)
 *
 * Structure: { [componentId: string]: { [methodName: string]: Function } }
 *
 * Example:
 * {
 *   dx: { sub: Function, out: Function },
 *   ui: { showErrorMessage: Function },
 *   pdf: { generatePdf: Function }
 * }
 */
export type FnImport_t = {
  [componentId: string]: {
    // Generic Function type is intentional - Registry proxies methods with varying signatures:
    // - Named params: fn.persist.validateDefault({ name })
    // - Positional params: fn.persist.get(menuId)
    // - No params: fn.stylize.getThemes()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    [methodName: string]: Function;
  };
};
