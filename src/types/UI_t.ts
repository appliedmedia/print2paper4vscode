import type { MenuId_t, MenuItemId_t } from './UIMenu_t';

// Toolbar configuration
export const kToolbar = {
  pos: {
    persistId: 'toolbar_pos',
    min_px: 8,
    max_px: 5120, // Reasonable max for 5K displays
  },
} as const;

// Save dialog configuration
export const kLastSaveDir = {
  persistId: 'lastSaveDir',
} as const;

export interface UIMenuItem {
  id: string;
  displayName: string;
  iconSlot: string; // Button content: icon, text_edit widget (e.g., "text_edit: {...}"), or empty for non-button
  iconSlot_prefix: string; // Text before iconSlot (e.g., for spacing)
  iconSlot_suffix: string; // Text after iconSlot (e.g., "%" for zoom percentage)
}

// Context dictionary for template variable substitution
// Sent from webview with window dimensions and optional text_edit display values
export type contextDict_t = Record<string, number | string>;
export const kContextDict_None: contextDict_t = {};

// Messages sent from webview to extension
export type SendToExt_dragEnd = {
  type: 'dragEnd';
  left: number;
};

export type SendToExt_menuItemSelected = {
  type: 'menuItemSelected';
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
  contextDict: contextDict_t;
};

export type SendToExt_dx = {
  type: 'dx';
  message: string;
};

// Asks the extension for a fresh value for a single dynamic-marked menu item.
// Sent by the webview when the user opens a dropdown that contains marked items.
export type SendToExt_getDynamicValue = {
  type: 'getDynamicValue';
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
};

// Union of all webview→extension messages
export type SendToExt_t =
  | SendToExt_dragEnd
  | SendToExt_menuItemSelected
  | SendToExt_dx
  | SendToExt_getDynamicValue;

// Message handler callback type
export type MessageHandler_t = (msg: SendToExt_t) => Promise<void> | void;

// Messages sent from extension to webview
export type SendFromExt_dynamicValue = {
  type: 'dynamicValue';
  menuId: MenuId_t;
  menuItemId: MenuItemId_t;
  value: string | number | boolean | undefined;
};

// Union of all extension→webview messages
export type SendFromExt_t = SendFromExt_dynamicValue;

// end, UI_t.ts
