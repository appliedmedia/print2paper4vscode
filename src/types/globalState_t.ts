/**
 * Global State Type Definitions
 *
 * Defines the keys and types for VS Code global state storage.
 * This ensures type safety when accessing global state values.
 */

export type GlobalStateKey =
  | 'pageSizeId'
  | 'orient'
  | 'fontSize'
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
  | 'test-key'
  | 'themeChoice'
  | 'marginId';

export type GlobalStateValue = string | number | boolean | undefined;

export interface GlobalStateMap {
  pageSizeId: string;
  orient: string;
  fontSize: string;
  lineHeight: string;
  theme: string;
  fontFamily: string;
  toolbarPosPx: string;
  pageRenderCacheSize: string;
  scrollDebounceMs: string;
  maxCanvasPoolSize: string;
  scrollableViewerEnabled: string;
  autoScrollableViewerThreshold: string;
  toolbarPos: string;
  'test-key': string;
  themeChoice: string;
  marginId: string;
}
