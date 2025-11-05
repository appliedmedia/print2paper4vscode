export interface UIMenuItem {
  id: string;
  displayName: string;
  icon?: string;
  attributes?: Record<string, string>;
}

// PostMessage types - defines messages sent via postMessage API
export type PostMessage = {
  type:
    | 'dragEnd'
    | 'menu'
    | 'print'
    | 'menuItemSelected'
    | 'dx'
    | 'updatePdf'
    | 'pageRenderResponse'
    | 'pageRenderError'
    | 'clearAllPages'
    | 'updatePageTotal'
    | 'zoom';
  clientX?: number;
  left?: number;
  startLeft?: number;
  value?: string;
  targetId?: string;
  parentId?: string;
  x?: number;
  y?: number;
  message?: string; // For dx messages
  pageNumber?: number; // For page render requests
  data?: unknown; // For diagnostic messages
  menuId?: string; // For menu item selection
  itemId?: string; // For menu item selection
  printType?: string; // For print messages
  zoomLevel?: number; // For zoom messages
  zoomAction?: 'in' | 'out' | 'fitWidth' | 'fitPage' | 'actualSize'; // For zoom actions
  pdfDataUrl?: string; // For PDF updates
  pageTotal?: number; // For page total updates
  pageData?: {
    dataUrl: string;
    widthPx: number;
    heightPx: number;
    pageNumber: number;
  };
  error?: {
    message: string;
    pageNumber: number;
    type: 'generation' | 'validation' | 'memory' | 'unknown';
    timestamp: Date;
  };
};

// Message handler callback type
export type MessageHandler = (msg: PostMessage) => Promise<void> | void;

// end, UI_t.ts
