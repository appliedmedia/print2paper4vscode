/**
 * Global State Type Definitions
 *
 * Defines the keys and types for VS Code global state storage.
 * This ensures type safety when accessing global state values.
 *
 * Note: GlobalStateKey_t is now defined in UI.ts where it belongs.
 */

import type { GlobalStateKey_t as GlobalStateKeyFromUI } from '../UI';

export type GlobalStateKey_t = GlobalStateKeyFromUI;
export type GlobalStateValue_t = string | number | boolean;

export interface GlobalStateKeyToValueType_t {
  pageSizeId: string; // 'a4', 'letter' - page size ID
  orient: string; // 'portrait', 'landscape' - orientation ID
  fontSizeId: string; // '12', '14', '18' - font size ID (menu item)
  theme: string; // 'github-light', 'monokai' - theme ID
  toolbarPosPx: number; // 100, 200 - actual pixel position
  pageRenderCacheSize: number; // 10, 20 - actual cache size
  scrollDebounceMs: number; // 16, 32 - actual milliseconds
  maxCanvasPoolSize: number; // 7, 10 - actual pool size
  scrollableViewerEnabled: boolean; // true, false - actual boolean
  autoScrollableViewerThreshold: number; // 100, 500 - actual threshold
  marginId: string; // 'normal', 'wide' - margin ID
}
