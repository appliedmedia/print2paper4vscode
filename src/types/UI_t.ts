export interface UIMenuItem {
  id: string;
  displayName: string;
  attributes?: Record<string, string>;
}

// Webview message types - defines the contract between frontend UI and backend
export type WebviewMessage = {
  type: 'dragEnd' | 'menu' | 'print' | 'menuItemSelected' | 'dx';
  clientX?: number;
  left?: number;
  startLeft?: number;
  value?: string;
  targetId?: string;
  parentId?: string;
  x?: number;
  y?: number;
  message?: string; // For dx messages
};

// Extension to webview message types - defines messages sent from extension to webview
export type ExtensionToWebviewMessage = {
  type: 'updatePdf';
  pdfDataUrl: string;
};

// Message handler callback type
export type MessageHandler = (msg: WebviewMessage) => Promise<void> | void;
