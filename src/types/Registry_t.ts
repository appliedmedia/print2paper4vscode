/**
 * Registry Type Definitions
 *
 * Type definitions for the Registry dependency injection system.
 */

/**
 * FnImport_t - What a class imports (receives from Registry)
 *
 * Structure: { [componentId: string]: { [methodName: string]: Function | unknown } }
 *
 * Can return methods (bound functions) or properties (direct access).
 *
 * Example:
 * {
 *   dx: { sub: Function, out: Function },
 *   ui: { showErrorMessage: Function },
 *   pdf: { generatePdf: Function, docInfo: DocInfo_PDF }
 * }
 */
export type FnImport_t = {
  [componentId: string]: {
    [methodName: string]: Function | unknown;
  };
};
