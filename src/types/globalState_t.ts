/**
 * Global State Type Definitions
 *
 * Defines the keys and types for VS Code global state storage.
 * This ensures type safety when accessing global state values.
 */

export type GlobalStateValue = string | number | boolean;

export type GlobalStateKey =
  | 'pageSizeId'
  | 'orient'
  | 'fontSizePx'
  | 'lineHeight'
  | 'theme'
  | 'fontFamily'
  | 'toolbarPosPx'
  | 'pageRenderCacheSize'
  | 'scrollDebounceMs'
  | 'maxCanvasPoolSize'
  | 'scrollableViewerEnabled'
  | 'autoScrollableViewerThreshold'
  | 'toolbarPos'
  | 'marginId';

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
