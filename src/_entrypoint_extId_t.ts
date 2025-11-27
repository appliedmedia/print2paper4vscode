/**
 * Extension ID - Single Source of Truth for Namespace
 * 
 * This constant defines the extension's namespace used throughout the codebase:
 * - VS Code command IDs (package.json: {{ns}}.print2paper)
 * - CSS class names ({{ns_}}menuBtn -> p2p4vsc_menuBtn)
 * - HTML IDs ({{ns_}}toolbar -> p2p4vsc_toolbar)
 * - JavaScript selectors
 * - Webview IDs
 * 
 * To change the extension's namespace:
 * 1. Update this constant
 * 2. Run `npm run compile`
 * 3. All templates and configurations automatically update
 * 
 * IMPORTANT: Must match package.json command registrations (processed during build)
 */
export const kExtensionId = 'p2p4vsc' as const;

/**
 * Extension ID type - for type safety when passing extension IDs
 */
export type ExtensionId_t = typeof kExtensionId;
