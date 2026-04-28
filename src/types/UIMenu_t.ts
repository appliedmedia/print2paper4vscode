/**
 * UIMenu type definitions
 *
 * All types and constants related to UIMenu component
 */

import type { Force_scalar_t } from '../Utils';
import type { UI_t } from '../UI';
import {
  kHeaderFooter,
  kHeaderFooterMenuIds,
  kMenus,
  type UIMenuFxn_t,
  type UIMenuItemValue_t,
} from './PaperPrinter_t';

/**
 * Text edit constraint configuration
 *
 * All three properties work together as a cohesive validation strategy:
 * - regex: Real-time validation during typing (blocks invalid keystrokes)
 * - min/max: Final validation on blur (clamps value to valid range)
 *
 * Note: For max digits, use regex with one extra digit (e.g., \d{0,4} for max value 300)
 * to allow users to temporarily type an extra character during editing.
 */
export type TextEditConstraint_t = {
  regex: string; // Regex pattern for real-time validation (e.g., '^\d{0,4}$')
  min: number; // Minimum value (enforced on blur)
  max: number; // Maximum value (enforced on blur)
};

export type iconSlotTriad_main_t = {
  type: 'text_edit'; // Tells us what UI element to render
  width?: string;
  persistId: UI_t; // Separate persist key for value storage (e.g., 'zoomLevel_value') - REQUIRED for text_edit
  constrain: TextEditConstraint_t; // Validation strategy (regex + min/max work together)
  transform?: {
    // Transforms handle their own type conversion - they receive raw persisted values
    display?: (persist: Force_scalar_t) => Force_scalar_t; // Convert persist value to display value
    persist?: (display: Force_scalar_t) => Force_scalar_t; // Convert display value to persist value
  };
};

// IconSlotTriad type - three-part slot structure
export interface iconSlotTriad_t {
  begin: string;
  main: string | iconSlotTriad_main_t; // Can be string icon or text_edit object
  end: string;
}

// UIMenuItem type - menu item structure
export interface UIMenuItem_t {
  id: string;
  displayName: string;
  iconSlotTriad: iconSlotTriad_t; // Button content: icon, text_edit widget (e.g., "text_edit: {...}"), or empty for non-button
  shortcutCode?: string; // Optional KeyboardEvent.code for keyboard shortcuts (e.g., "Digit0", "Minus", "Equal")
  shortcut?: string; // Optional display string for keyboard shortcut (e.g., "Ctrl/Cmd + 0")
  tooltip?: string; // Optional native browser tooltip on hover (e.g., URL for external-link items)
  isExternalLink?: boolean; // True if item opens an external URL — renders box-with-arrow SVG in gutter-after
  value?: UIMenuItemValue_t | UIMenuFxn_t;
}

// Menu ID types - UI component identifiers
// Auto-constructed from kMenus array
export const kMenuId = [
  ...kMenus.map(m => m.id),
  // Composed from header/footer + kHeaderFooter positions
  ...kHeaderFooterMenuIds,
] as const;

export type MenuId_t = (typeof kMenuId)[number];

// Menu Item ID types - Individual menu item identifiers
// Auto-constructed from PaperPrinter_t.ts constants using shared kMenus
export const kMenuItemId = [
  // System sentinel
  'default',
  // Extract menuItems from all menu constants
  ...kMenus.flatMap(menu => {
    const menuItemIds =
      menu.menuItems && menu.menuItems.length > 0 ? menu.menuItems.map(item => item.id) : [];

    // If menu has constrained input widget, include menu.id as valid menuItemId (for custom values)
    const hasConstrainedInput =
      typeof menu.iconSlotTriad.main === 'object' &&
      menu.iconSlotTriad.main.constrain !== undefined;

    if (hasConstrainedInput || menuItemIds.length === 0) {
      // Include menu.id for: text_edit menus OR button-only menus
      return [menu.id, ...menuItemIds];
    } else {
      return menuItemIds;
    }
  }),
  // From kHeaderFooter (for header/footer position menus)
  ...kHeaderFooterMenuIds,
  // From kHeaderFooter.subMenuItems (for header/footer content selections)
  ...kHeaderFooter.subMenuItems.map(item => item.id),
] as const;

export type MenuItemId_t = (typeof kMenuItemId)[number] | string;

// Selection handler return type - id is what's selected, value is what to use
export interface HandleSelection_t {
  id: string;
  value: UIMenuItemValue_t;
}
