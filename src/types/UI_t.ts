export interface UIMenuItem {
  id: string;
  displayName: string;
  attributes?: Record<string, string>;
}

// Webview message types - defines the contract between frontend UI and backend
export type WebviewMessage = {
  type: 'dragEnd' | 'menu' | 'print' | 'menuItemSelected';
  clientX?: number;
  startLeft?: number;
  value?: string;
  targetId?: string;
  parentId?: string;
  x?: number;
  y?: number;
};

// Message handler callback type
export type MessageHandler = (msg: WebviewMessage) => Promise<void> | void;
