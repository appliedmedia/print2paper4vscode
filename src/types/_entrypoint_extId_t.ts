/**
 * Extension ID - Single Source of Truth for Namespace
 *
 * Defines the extension's namespace, command IDs, and external URLs.
 * Used in code AND substituted into `config/template.package.json` by
 * `scripts/generate-package-json.mjs` so package.json never drifts.
 *
 * Substituted placeholders (template → value):
 *   {{extId}}              → kExtId
 *   {{cmdPrint}}           → kCommandPrint
 *   {{cmdPersistClear}}    → kCommandPersistClear
 *   {{urlHomePage}}        → kURL.homePage
 *   {{urlSupport}}         → kURL.support
 *
 * To change any of these: edit the constant here and run `npm run precompile`.
 */
export const kExtId = 'p2p4vsc' as const;

// Command suffix constants — the part after the extension namespace
export const kCommandPrint = 'print2paper' as const;
export const kCommandPersistClear = 'persistClear' as const;

// Fully-qualified command IDs — derived; use these wherever a command id is needed
export const kCommandPrintId = `${kExtId}.${kCommandPrint}` as const;
export const kCommandPersistClearId = `${kExtId}.${kCommandPersistClear}` as const;

// External URLs — same source of truth as package.json's homepage/bugs.url
// Use direct URLs (not vanity redirects) so menu tooltips show the real destination.
export const kURL = {
  homePage: 'https://print2paper4vscode.com',
  support: 'https://p2p4vsc.support',
} as const;

/**
 * Namespace constants - derived from kExtId
 */
export const kNs = kExtId;
export const kNs_ = kNs + '_';

/**
 * Extension ID type - for type safety
 */
export type ExtensionId_t = typeof kExtId;
