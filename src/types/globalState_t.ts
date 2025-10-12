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
  pageSizeId: string;
  orient: string;
  fontSizePx: string;  // Font size ID like '12', '14', etc.
  lineHeight: string;  // Line height ID like '18', '20', etc.
  theme: string;
  fontFamily: string;
  toolbarPosPx: string;  // Toolbar position ID
  pageRenderCacheSize: string;  // Cache size ID
  scrollDebounceMs: string;  // Debounce time ID
  maxCanvasPoolSize: string;  // Pool size ID
  scrollableViewerEnabled: string;  // Boolean as string ID like 'true', 'false'
  autoScrollableViewerThreshold: string;  // Threshold ID
  toolbarPos: string;
  marginId: string;
}
