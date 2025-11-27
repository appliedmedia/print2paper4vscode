/**
 * Extension ID - Single Source of Truth for Namespace
 * 
 * This constant defines the extension's namespace used throughout the codebase:
 * - VS Code command IDs (package.json)
 * - CSS class names ({{ns_}}menuBtn -> p2p4vsc_menuBtn)
 * - HTML IDs ({{ns_}}toolbar -> p2p4vsc_toolbar)
 * - JavaScript selectors
 * - Webview IDs
 * - Build scripts
 * 
 * To change the extension's namespace:
 * 1. Update this ONE constant
 * 2. Run `npm run compile`
 * 3. Everything updates automatically
 */
export const kExtId = 'p2p4vsc' as const;

/**
 * Extension ID type - for type safety
 */
export type ExtensionId_t = typeof kExtId;
