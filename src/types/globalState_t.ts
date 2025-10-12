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
  fontSizePx: number;
  lineHeight: number;
  theme: string;
  fontFamily: string;
  toolbarPosPx: number;
  pageRenderCacheSize: number;
  scrollDebounceMs: number;
  maxCanvasPoolSize: number;
  scrollableViewerEnabled: boolean;
  autoScrollableViewerThreshold: number;
  toolbarPos: string;
  marginId: string;
}
