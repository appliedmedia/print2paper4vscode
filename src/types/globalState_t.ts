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

export interface GlobalStateMap {
  pageSizeId: string;           // 'a4', 'letter' - actual page size ID
  orient: string;               // 'portrait', 'landscape' - actual orientation ID
  fontSizePx: number;           // 12, 14, 18 - actual pixel value for calculations
  theme: string;                // 'github-light', 'monokai' - actual theme ID
  toolbarPosPx: number;         // 100, 200 - actual pixel position
  pageRenderCacheSize: number;  // 10, 20 - actual cache size
  scrollDebounceMs: number;     // 16, 32 - actual milliseconds
  maxCanvasPoolSize: number;    // 7, 10 - actual pool size
  scrollableViewerEnabled: boolean; // true, false - actual boolean
  autoScrollableViewerThreshold: number; // 100, 500 - actual threshold
  marginId: string;             // 'normal', 'wide' - actual margin ID
}
