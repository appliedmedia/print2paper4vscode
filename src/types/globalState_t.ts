/**
 * Global State Type Definitions
 *
 * Defines the keys and types for VS Code global state storage.
 * This ensures type safety when accessing global state values.
 */

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
  | 'marginId'
  // Test keys
  | 'testMenu'
  | 'menu-with-dashes'
  | 'a'
  | '1menu'
  | 'menu_$#@!'
  | 'ménu'
  | 'menu1'
  | 'menu2'
  | 'TestMenu'
  | 'nonExistent'
  | '';

export interface GlobalStateMap {
  pageSizeId: string;
  orient: string;
  fontSizePx: string;
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
  marginId: string;
  // Test keys
  testMenu: string;
  'menu-with-dashes': string;
  a: string;
  '1menu': string;
  'menu_$#@!': string;
  ménu: string;
  menu1: string;
  menu2: string;
  TestMenu: string;
  nonExistent: string;
  '': string;
}
