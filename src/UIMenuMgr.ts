import type { Registry } from './Registry';
import type { Force_dict_t } from './Utils';
import type { FnImport_t } from './types/Registry_t';
import type { UI_t } from './UI';
import type { PersistValue_t } from './Persist';
import { contextDict_t, kContextDict_None } from './types/UI_t';
import { UIMenu } from './UIMenu';
import type {
  MenuId_t,
  MenuItemId_t,
  HandleSelection_t,
  UIMenuItem_t,
  iconSlotTriad_t,
} from './types/UIMenu_t';
import { kMenuId, kMenuItemId } from './types/UIMenu_t';
import { Diagnostics } from './Diagnostics';
import {
  type UIMenuItemDict_t,
  type UIMenuFxn_t,
  type UIMenuItemValue_t,
  type UIMenuShortcutFxn_t,
} from './types/PaperPrinter_t';
import type { Theme } from './types/theme_t';

const kUIMenuItemDictRequiredKeys = [
  'windowWidth',
  'windowHeight',
  'pageWidth',
  'pageHeight',
] as const;

/**
 * UIMenuMgr - Menu manager for webview toolbar system
 *
 * Manages collection of UIMenu instances, coordinates HTML/CSS/JS generation,
 * handles two-pass flyout rendering, and dispatches menu item selections.
 * Provides centralized menu lookup and configuration management.
 *
 * @input app - Application instance
 * @output Aggregated menu HTML/CSS/JS, menu item selection routing, menu lookup
 *
 * @example
 * const uimenumgr = new UIMenuMgr(app);
 * const menu = uimenumgr.createMenu('print', 'Print', '🖨️', false, ...);
 * uimenumgr.addMenu(menu);
 * const html = await uimenumgr.getUIMenus_HTML();
 */
export class UIMenuMgr {
  static readonly id = 'uimenumgr';
  private reg: Registry;
  private fn: FnImport_t;
  private menus: UIMenu[] = [];
  private dx: Diagnostics;
  // Generic context dictionary for template variable substitution
  // Updated from webview (window dimensions, text_edit display values) and persists across menu selections
  private contextDict?: contextDict_t;

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'stylize.getThemes',
      'os.dictReplace',
      'persist.get',
      'persist.set',
      'utils.hasContent',
      'utils.forceNumbers',
      'utils.forceContent',
      'utils.forceContents',
      'utils.templateDictReplace',
      'pdf.docInfo'
    );
    this.dx = this.fn.dx.sub({ name: 'UIMenuMgr' });
  }

  /**
   * Set context dictionary (merge-only)
   *
   * Called from UIWebView message handler to update template substitution context.
   * Always merges new values into existing context - never replaces or clears keys.
   * Stale keys persist across calls intentionally, as context accumulates webview
   * state (window dimensions, text_edit values) that should remain available for
   * subsequent menu selections and calc template evaluations.
   *
   * @param contextDict - Context values to merge (window dimensions, display values, etc.)
   */
  setContextDict(contextDict: contextDict_t = kContextDict_None): void {
    this.contextDict = { ...(this.contextDict ?? kContextDict_None), ...contextDict };
  }

  // Instance methods with full validation using this.app
  isMenuId(id: string): id is MenuId_t {
    return kMenuId.includes(id as MenuId_t);
  }

  isMenuItemId(id: string): id is MenuItemId_t {
    let isValid = false;

    // 1. Check against static kMenuItemId list (now auto-constructed from PaperPrinter_t.ts)
    if ((kMenuItemId as readonly string[]).includes(id)) {
      isValid = true;
    }
    // 2. Check if it's a number - could be font size, zoom level, or other numeric menu item
    // Accept any numeric string as valid (font sizes, zoom percentages, zoom scales all use numbers)
    else if (!isNaN(Number(id))) {
      isValid = true;
    }
    // 3. Check against theme IDs
    else {
      const validThemes = this.fn.stylize.getThemes().map((t: Theme) => t.id);
      isValid = validThemes.includes(id);
    }

    return isValid;
  }

  done(): void {
    // Cleanup any resources if needed
    this.menus = [];
    this.dx.done();
  }

  /**
   * Generate fresh HTML for a specific menu
   * Returns the HTML to be sent to webview by caller
   */
  async getUIMenu_HTML(menuId: MenuId_t): Promise<string> {
    const menu = this.getMenuById(menuId);
    return await menu.getHTML();
  }

  createMenu(args: {
    id: MenuId_t;
    displayName: string;
    iconSlotTriad: iconSlotTriad_t;
    isFlyout?: boolean;
    isHidden?: boolean | UIMenuFxn_t;
    menuItems: () => UIMenuItem_t[];
    flyoutMenuItemIds?: string[];
    selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>;
  }): UIMenu {
    const dx = this.dx.sub({ name: 'createMenu' });
    dx.require(args, ['id', 'displayName', 'iconSlotTriad', 'menuItems', 'selectionHandler']);
    const {
      id,
      displayName,
      iconSlotTriad,
      isFlyout = false,
      isHidden,
      menuItems,
      flyoutMenuItemIds = [],
      selectionHandler,
    } = args;

    // Pass isHidden through unresolved (boolean | UIMenuFxn_t | undefined).
    // UIMenu.getHTML resolves it fresh per render via getIsHiddenOfMenuId, so a
    // dynamic resolver sees the latest docInfo (e.g. languageId set during PDF
    // generation) instead of being frozen at construction time.
    return new UIMenu({
      reg: this.reg,
      id,
      displayName,
      iconSlotTriad,
      isFlyout,
      isHidden,
      menuItems,
      flyoutMenuItemIds,
      selectionHandler,
    });
  }

  // Get all menus
  getUIMenus(): UIMenu[] {
    return [...this.menus];
  }

  // Handle menu item selection
  // NOTE: All menu IDs and menu item IDs are static and known at compile time.
  // They are defined in PaperPrinter_t.ts constants and compiled into kMenuId/kMenuItemId.
  // There is no "random DOM code" that generates IDs - all IDs come from these constants.
  // Therefore, we don't need ID normalization, prefix stripping, or other bulletproofing.
  // If an invalid ID appears, it's a bug that should be fixed, not silently handled.
  // Future: HTML IDs will be completely reworked, so this validation is temporary.
  async handleMenuItemSelected(
    menuId: MenuId_t,
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t
  ): Promise<void> {
    const dx = this.dx.sub({ name: 'handleMenuItemSelected' });
    dx.out(`Received: menuId=${menuId}, menuItemId=${menuItemId}`);
    dx.out(`contextDict: ${JSON.stringify(contextDict)}`);

    // Constant for display property key to avoid duplication
    const kDisplay = 'display';

    try {
      // Store contextDict for calc evaluations
      this.setContextDict(contextDict);

      // Handle text_edit input: if contextDict.display exists and menuItemId === menuId
      let finalMenuItemId: string = menuItemId;
      let isTextEditInput = false;
      dx.out(
        `Checking text_edit: contextDict.${kDisplay}=${contextDict?.[kDisplay]}, menuItemId===menuId? ${menuItemId === menuId}`
      );
      if (contextDict?.[kDisplay] !== undefined && menuItemId === menuId) {
        isTextEditInput = true;
        dx.out(`Text_edit input detected`);
        // Apply transform.persist if present (e.g., for text_edit input)
        const menu = this.getMenuById(menuId);
        const iconSlotMain = (menu as UIMenu)['_iconSlotTriad']?.main;
        if (typeof iconSlotMain !== 'string' && iconSlotMain.transform?.persist) {
          try {
            const displayValue = parseFloat(String(contextDict[kDisplay]));
            if (isNaN(displayValue)) {
              dx.error(`Invalid display value for transform: ${contextDict[kDisplay]}`);
              return;
            }
            const transformedValue = iconSlotMain.transform.persist(displayValue);
            finalMenuItemId = String(transformedValue);
            dx.out(`Applied transform.persist: ${contextDict[kDisplay]} → ${finalMenuItemId}`);
          } catch (error) {
            dx.error(`Failed to apply transform.persist: ${error}`);
            return;
          }
        } else {
          // No transform - use display value as-is
          finalMenuItemId = String(contextDict[kDisplay]);
          dx.out(`No transform, using display value as-is: ${finalMenuItemId}`);
        }
      }

      // Validate finalMenuItemId after transform (transformed value should be valid menuItemId)
      if (!this.isMenuItemId(finalMenuItemId)) {
        dx.error(
          `Invalid menu item ID: ${menuId}.${finalMenuItemId}${isTextEditInput ? ' (after transform)' : ''}`
        );
        return;
      }

      const menu = this.getUIMenus().find(menu => menu.id === menuId);
      if (menu) {
        await menu.dispatchSelection(finalMenuItemId, contextDict);
        dx.out(`Menu item selected: ${menuId}.${finalMenuItemId}`);
      } else {
        dx.error(`Invalid menu: ${menuId}`);
        return;
      }
    } finally {
      dx.done();
    }
  }

  // Get a specific menu by ID
  // Throws error if menu not found - guarantees a valid menu is returned
  getMenuById(id: string): UIMenu {
    const menu = this.getUIMenus().find(menu => menu.id === id);
    if (!menu) {
      this.dx.error(`Menu not found: ${JSON.stringify(id)}`);
      throw new Error(`Menu not found: ${id}`);
    }
    return menu;
  }

  // Get persist value for a menu (reads from persist singleton)
  getPersistForMenuId(menuId: MenuId_t): PersistValue_t | undefined {
    return this.fn.persist.get(menuId);
  }

  // Get persist value for a persistId from persist singleton
  getValueOfPersistIdForMenuId(args: {
    menuId: MenuId_t;
    persistId: UI_t;
  }): PersistValue_t | undefined {
    const dx = this.dx.sub({ name: 'getValueOfPersistIdForMenuId' });
    dx.require(args, ['menuId', 'persistId']);
    const { persistId } = args;
    const result = this.fn.persist.get(persistId);
    dx.done();
    return result;
  }

  // Set persist value for a persistId on persist singleton
  setValueOfPersistIdForMenuId(args: {
    menuId: MenuId_t;
    persistId: UI_t;
    value: PersistValue_t;
  }): void {
    const dx = this.dx.sub({ name: 'setValueOfPersistIdForMenuId' });
    dx.require(args, ['menuId', 'persistId', 'value']);
    const { menuId, persistId, value } = args;
    const oldValue = this.fn.persist.get(persistId);
    this.fn.persist.set(persistId, value);
    dx.out(`Menu[${menuId}].persist[${persistId}] = ${value} (was: ${oldValue})`);
    dx.done();
  }

  // Get the selected menuItemId for a menu (returns the persisted ID)
  getMenuItemIdSelected(menuId: MenuId_t): string | undefined {
    const selectedValue = this.fn.persist.get(menuId);
    this.dx.out(`getMenuItemIdSelected(${menuId}) → ${selectedValue}`);
    return selectedValue ? String(selectedValue) : undefined;
  }

  // Get the value for the currently selected menu item
  // Combines getMenuItemIdSelected + getValueOfMenuItemIdForMenuId
  // Returns string or number, or undefined if empty/missing
  getValueOfMenuItemIdSelected(menuId: MenuId_t): UIMenuItemValue_t | undefined {
    const dx = this.dx.sub({ name: 'getValueOfMenuItemIdSelected' });
    const menuItemId = this.getMenuItemIdSelected(menuId);
    dx.out(`menuId=${menuId}, menuItemId=${menuItemId}`);
    if (!menuItemId) {
      dx.out(`No menuItemId, returning undefined`);
      dx.done();
      return undefined;
    }

    const value = this.getValueOfMenuItemIdForMenuId({ menuId, menuItemId });
    dx.out(`Final result: menuItemId=${menuItemId}, value=${value}`);
    dx.done();
    return value;
  }

  // Look up the static menu-item id whose numeric `value` matches the menu's
  // current resolved value. Used as a fallback in UIMenu.getSelectedItemId when
  // the persisted id does not directly match any menu item — e.g., the zoom
  // +/- button persists the menu-id sentinel ("zoomLevel"), or a text-edit
  // transform persists "0.9" while the matching item id is "0.90". Items whose
  // value is a function (e.g., fitWidth/fitPage resolvers) are skipped: those
  // should highlight only when explicitly picked, not when the current numeric
  // zoom incidentally matches the computed fit ratio.
  getMenuItemIdMatchingCurrentValue(menuId: MenuId_t): string | undefined {
    // Coerce numeric strings (e.g., "0.9" from text-edit input) to numbers
    // so the fallback resolver matches items whose stored value is numeric.
    const raw = this.getValueOfMenuItemIdSelected(menuId);
    const currentValue =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string' && raw.trim() !== ''
          ? Number(raw)
          : NaN;
    if (!Number.isFinite(currentValue)) return undefined;
    const menu = this.getMenuById(menuId);
    const epsilon = 1e-6;
    const match = menu.getMenuItems().find(item => {
      if (!('value' in item)) return false;
      const v = (item as UIMenuItem_t & { value: UIMenuItemValue_t | UIMenuFxn_t }).value;
      if (typeof v !== 'number') return false;
      return Math.abs(v - currentValue) < epsilon;
    });
    return match?.id;
  }

  // Get the value for a menu item by its ID
  // Resolves menu item values via resolver functions (for dynamic values like fitWidth/fitPage),
  // numeric values, or legacy calc templates. Returns the resolved value or menuItemId as fallback.
  // Never returns undefined - defaults to menuItemId if value not found or resolution fails.
  getValueOfMenuItemIdForMenuId(args: { menuId: MenuId_t; menuItemId: string }): UIMenuItemValue_t {
    const dx = this.dx.sub({ name: 'getValueOfMenuItemIdForMenuId' });
    if (!dx.require(args, ['menuId', 'menuItemId'])) {
      dx.error(`Invalid args: ${JSON.stringify(args)}`);
      throw new Error(`getValueOfMenuItemIdForMenuId: invalid arguments`);
    }
    const { menuId, menuItemId } = args;
    let result: UIMenuItemValue_t = menuItemId;

    const menu = this.getMenuById(menuId);

    // Check if menuItemId === menuId (custom text_edit value)
    // Read from persistId instead of menu items
    if (menuItemId === menuId) {
      const dx = this.dx.sub({ name: 'getValueOfMenuItemIdForMenuId[iconSlotTriad]' });
      const iconSlotMain = (menu as unknown as { _iconSlotTriad: iconSlotTriad_t })._iconSlotTriad
        ?.main;
      dx.out(`menuItemId === menuId, checking for persistId`);
      if (typeof iconSlotMain !== 'string' && iconSlotMain.persistId) {
        dx.out(`Found persistId: ${iconSlotMain.persistId}`);
        const persistValue = this.getValueOfPersistIdForMenuId({
          menuId,
          persistId: iconSlotMain.persistId,
        });
        dx.out(`Read from menu.persist[${iconSlotMain.persistId}] = ${persistValue}`);
        if (this.fn.utils.hasContent(persistValue)) {
          result = persistValue as string | number;
          dx.out(`Returning persistValue: ${result}`);
        }
      }
      dx.done();
    } else {
      const menuItems = menu.getMenuItems();

      // Try to find the menuItem in the list
      const menuItem = menuItems.find(item => item.id === menuItemId);

      if (menuItem && 'value' in menuItem) {
        const itemWithValue = menuItem as UIMenuItem_t & {
          value: UIMenuItemValue_t | UIMenuFxn_t;
        };
        const value = itemWithValue.value;

        if (typeof value === 'function') {
          const resolvedValue = this.getValueOfMenuFxnByCalcValue(value, menuId, menuItemId);
          if (resolvedValue !== undefined) {
            result = resolvedValue;
          }
        } else {
          // Direct value (number or string literal)
          result = value;
        }
      }
    }

    return result;
  }

  /**
   * Resolve a menu's hidden state fresh on every call.
   *
   * Mirrors getValueOfMenuItemIdForMenuId: looks the menu up by id, reads the
   * stored isHidden (boolean | UIMenuFxn_t | undefined), and runs it through
   * getValueOfMenuFxnByCalcIsHidden so dynamic resolvers see current docInfo.
   *
   * Called from UIMenu.getHTML each render — keeps menus like kMd in sync with
   * the active document's languageId without rebuilding the menu.
   */
  getIsHiddenOfMenuId(menuId: MenuId_t): boolean {
    const menu = this.getMenuById(menuId);
    return this.getValueOfMenuFxnByCalcIsHidden(menu.isHidden, menuId);
  }

  /**
   * Resolve a menu item's shortcut display string fresh on every call.
   *
   * Mirrors getValueOfMenuItemIdForMenuId / getIsHiddenOfMenuId: the menu item
   * stores `shortcut: string | UIMenuShortcutFxn_t | undefined`. Static strings
   * pass through; resolver functions run through the validated-dict helper so
   * a resolver that calls e.g. `getShortcutForCommand(...)` always reads the
   * current VS Code keybinding at HTML generation time.
   */
  getShortcutOfMenuItemIdForMenuId(args: { menuId: MenuId_t; menuItemId: string }): string {
    const { menuId, menuItemId } = args;
    const menu = this.getMenuById(menuId);
    const menuItem = menu.getMenuItems().find(item => item.id === menuItemId);
    const shortcut = menuItem?.shortcut;
    if (typeof shortcut === 'function') {
      return this.getValueOfMenuFxnByCalcShortcut(shortcut, menuId, menuItemId);
    }
    return shortcut ?? '';
  }

  // Like getValueOfMenuFxnByCalcValue, but typed for shortcut resolvers (always string).
  // Returns '' if the resolver throws.
  private getValueOfMenuFxnByCalcShortcut(
    resolver: UIMenuShortcutFxn_t,
    menuId: string,
    menuItemId: string
  ): string {
    const dx = this.dx.sub({ name: 'getValueOfMenuFxnByCalcShortcut' });
    const dict = this.buildUIMenuItemDict();
    try {
      const result = resolver(dict);
      dx.done();
      return result;
    } catch (error) {
      this.dx.error(
        `Menu item shortcut resolver failed for ${menuId}.${menuItemId}: ${String(error)}`
      );
      dx.done();
      return '';
    }
  }

  /**
   * Build validated menu item value dictionary for resolver functions
   *
   * Constructs dict from webview context (window dimensions) and PDF page dimensions.
   * All values validated by forceNumber() with requiredKeys to guarantee:
   * - All required keys present (added with useForZero=1 if missing)
   * - All values are finite numbers (invalid/zero values become 1)
   * - No undefined or NaN values possible
   *
   * This validated dict is passed to resolver functions which can rely on all keys existing
   * and containing valid numeric values - no defensive checks needed in resolvers.
   *
   * @returns UIMenuItemDict_t with all required keys as finite, non-zero numbers
   */
  private buildUIMenuItemDict(): UIMenuItemDict_t {
    const dx = this.dx.sub({ name: 'buildUIMenuItemDict' });
    const docInfo = this.fn.pdf.docInfo();
    const pageSizePx = docInfo?.pageSizePx;
    const context = this.contextDict ?? {};

    // Numeric keys - validate with forceNumbers
    const numericInputs: Force_dict_t = {
      windowWidth: context.windowWidth,
      windowHeight: context.windowHeight,
      pageWidth: pageSizePx?.widthPx,
      pageHeight: pageSizePx?.heightPx,
    };
    const dict_nums = this.fn.utils.forceNumbers(numericInputs, 1, kUIMenuItemDictRequiredKeys);

    // Textual keys - validate with forceContents
    const textualInputs: Force_dict_t = {
      languageId: docInfo?.languageId,
    };
    const dict_text = this.fn.utils.forceContents(textualInputs, '');

    // Combine both dicts
    const combined = { ...dict_nums, ...dict_text };

    dx.done();
    return combined as UIMenuItemDict_t;
  }

  /**
   * Resolve menu hidden state using isHidden function or boolean
   *
   * Executes isHidden function with validated dict (numeric + textual context).
   * Returns boolean indicating whether menu should be hidden.
   *
   * @param isHidden - Boolean or function that determines hidden state from context
   * @param menuId - Menu ID for error logging context
   * @returns true if menu should be hidden, false otherwise (default: false)
   */
  private getValueOfMenuFxnByCalcIsHidden(
    isHidden: boolean | UIMenuFxn_t | undefined,
    menuId: string
  ): boolean {
    const dx = this.dx.sub({ name: 'getValueOfMenuFxnByCalcIsHidden' });

    // Handle undefined - default to visible (isHidden = false)
    if (isHidden === undefined) {
      dx.done();
      return false;
    }

    // Handle boolean literal
    if (typeof isHidden === 'boolean') {
      dx.done();
      return isHidden;
    }

    // Handle function - build dict and execute
    const dict = this.buildUIMenuItemDict();
    try {
      const result = isHidden(dict);
      dx.done();
      return Boolean(result);
    } catch (error) {
      this.dx.error(`Menu isHidden resolver failed for ${menuId}: ${String(error)}`);
      dx.done();
      return false; // Default to visible (isHidden = false) on error
    }
  }

  /**
   * Resolve a menu item value using resolver function
   *
   * Executes resolver function with validated dict (all required keys present as finite numbers).
   * Returns number | string | undefined - does NOT force to number at this level.
   * Type coercion happens at consumer level based on their specific needs.
   *
   * @param resolver - Function that computes value from menu item dict
   * @param menuId - Menu ID for error logging context
   * @param menuItemId - Menu item ID for error logging context
   * @returns Resolved value (number | string | undefined) or undefined on error
   */
  private getValueOfMenuFxnByCalcValue(
    resolver: UIMenuFxn_t,
    menuId: string,
    menuItemId: string
  ): UIMenuItemValue_t | undefined {
    const dx = this.dx.sub({ name: 'getValueOfMenuFxnByCalcValue' });
    const dict_nums = this.buildUIMenuItemDict();
    try {
      const result = resolver(dict_nums);
      dx.done();
      // UIMenuItemValue_t is number | string | boolean. Anything else (object,
      // function, symbol from a misbehaving resolver) collapses to undefined.
      if (typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean' || result === undefined) {
        return result;
      }
      return undefined;
    } catch (error) {
      this.dx.error(
        `Menu item value resolver failed for ${menuId}.${menuItemId}: ${String(error)}`
      );
      dx.done();
      return undefined;
    }
  }

  // REMOVED: evaluateCalcTemplate() method
  // Migrated from eval()-based string templates to type-safe function-based values.
  // See: resolveUIMenuItemValue() for current implementation using UIMenuItemValueFxn_t.

  // Add a menu to the list (called by PaperPrinter)
  addMenu(menu: UIMenu): void {
    if (this.menus.some(m => m.id === menu.id)) {
      return;
    }
    this.menus.push(menu);
  }

  // Generate all HTML at once using recursive flyout strategy
  async getUIMenus_HTML(): Promise<string> {
    const dx = this.dx.sub({ name: 'getUIMenus_HTML' });
    const allMenus = this.getUIMenus();
    dx.out(`Total menus: ${allMenus.length}, non-flyout menus: ${allMenus.filter(m => !m.isFlyout).length}`);
    
    try {
      const visited = new Set<string>(); // Prevent infinite loops
      let result = '';

      // Generate only main menus (those that are not flyouts) - flyouts will be generated recursively
      for (const menu of allMenus.filter(menu => !menu.isFlyout)) {
        dx.out(`Generating HTML for menu: ${menu.id}`);
        const html = await menu.getHTML(visited);
        result += (result ? '\n' : '') + html;
        dx.out(`Successfully generated HTML for menu: ${menu.id}`);
      }

      return result;
    } finally {
      dx.done();
    }
  }

  // Generate all JavaScript at once
  getUIMenus_JS(): string {
    // All menus share the same generic handlers - get from any menu's cached YAML
    const allMenus = this.getUIMenus();
    const anyMenu = allMenus[0];
    if (!anyMenu) {
      return '';
    }

    // Get the generic handlers - yaml method handles loading automatically
    const js: string = anyMenu.yaml().uimenu_generic_handlers;
    if (!js) {
      return '';
    }
    return js;
  }

  // Get all UIMenu CSS
  getUIMenus_CSS(): string {
    const anyMenu = this.getUIMenus()[0];
    if (!anyMenu) {
      return '';
    }

    // Get the CSS - yaml method handles loading automatically
    const css: string = anyMenu.yaml().uimenu_css;
    if (!css) {
      return '';
    }

    return css;
  }
}

// end, UIMenuMgr.ts
