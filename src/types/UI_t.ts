export interface UIMenuItem {
  id: string;
  displayName: string;
  attributes?: Record<string, string>;
}

// Webview message types - defines the contract between frontend UI and backend
export type WebviewMessage = {
  type: 'dragEnd' | 'menu' | 'print' | 'menuItemSelected' | 'dx' | 'requestPageRender' | 'scrollDiagnostic';
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
  data?: any; // For diagnostic messages
};

// Extension to webview message types - defines messages sent from extension to webview
export type ExtensionToWebviewMessage = {
  type: 'updatePdf' | 'pageRenderResponse' | 'pageRenderError' | 'scrollDiagnostic' | 'clearAllPages';
  pdfDataUrl?: string;
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
  pageNumber?: number;
  data?: any;
};

// Message handler callback type
export type MessageHandler = (msg: WebviewMessage) => Promise<void> | void;
