export interface UIMenuItem {
  id: string;
  displayName: string;
  iconSlot: string; // Button content: icon, text_edit widget (e.g., "text_edit: {...}"), or empty for non-button
  iconSlot_prefix: string; // Text before iconSlot (e.g., for spacing)
  iconSlot_suffix: string; // Text after iconSlot (e.g., "%" for zoom percentage)
}

// PostMessage types - defines messages sent via postMessage API
export type PostMessage = {
  type:
    | 'dragEnd'
    | 'menu'
    | 'print'
    | 'menuItemSelected'
    | 'refreshMenu'
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
  menuId?: string; // For menu item selection and menu refresh
  itemId?: string; // For menu item selection
  menuHTML?: string; // For menu refresh
  printType?: string; // For print messages
  zoomLevel?: number; // For zoom messages
  zoomAction?: 'in' | 'out' | 'fitWidth' | 'fitPage' | 'actualSize'; // For zoom actions
  pdfDataUrl?: string; // For PDF updates
  pageTotal?: number; // For page total updates
  // Runtime dimensions for calc template evaluation (sent from webview)
  pageWidth?: number; // PDF page width in pixels (from webview globals)
  pageHeight?: number; // PDF page height in pixels (from webview globals)
  windowWidth?: number; // Viewport width in pixels (window.innerWidth)
  windowHeight?: number; // Viewport height in pixels (window.innerHeight)
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
