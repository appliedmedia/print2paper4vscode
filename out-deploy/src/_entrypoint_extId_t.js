"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kExtId = void 0;
/**
 * Extension ID - Single Source of Truth for Namespace
 *
 * This constant defines the extension's namespace used throughout the codebase:
 * - VS Code command IDs (package.json via templateDictReplace.mjs)
 * - CSS class names ({{ns_}}menuBtn -> p2p4vsc_menuBtn)
 * - HTML IDs ({{ns_}}toolbar -> p2p4vsc_toolbar)
 * - JavaScript selectors
 * - Webview IDs
 * - Build scripts import this directly
 *
 * To change the extension's namespace:
 * 1. Update this ONE constant
 * 2. Run `npm run compile`
 * 3. Everything updates automatically (via templateDictReplace.mjs)
 */
exports.kExtId = 'p2p4vsc';
//# sourceMappingURL=_entrypoint_extId_t.js.map