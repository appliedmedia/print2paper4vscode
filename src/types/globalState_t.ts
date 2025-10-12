/**
 * Global State Type Definitions
 *
 * Defines the keys and types for VS Code global state storage.
 * This ensures type safety when accessing global state values.
 * 
 * Note: GlobalStateKey_t is now defined in UI.ts where it belongs.
 */

import type { GlobalStateKey_t } from '../UI';

export type GlobalStateValue = string | number | boolean;

// Re-export for backward compatibility
export type GlobalStateKey = GlobalStateKey_t;

export interface GlobalStateKeyToValueType {
  pageSizeId: string;           // 'a4', 'letter' - page size item ID
  orient: string;               // 'portrait', 'landscape' - orientation item ID
  fontSizePx: string;           // '12', '14', '18' - font size item ID
  theme: string;                // 'github-light', 'monokai' - theme item ID
  toolbarPosPx: string;         // '100', '200' - toolbar position item ID
  pageRenderCacheSize: string;  // '10', '20' - cache size item ID
  scrollDebounceMs: string;     // '16', '32' - debounce time item ID
  maxCanvasPoolSize: string;    // '7', '10' - pool size item ID
  scrollableViewerEnabled: string; // 'true', 'false' - enabled item ID
  autoScrollableViewerThreshold: string; // '100', '500' - threshold item ID
  marginId: string;             // 'normal', 'wide' - margin item ID
}
