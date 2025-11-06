import type { App } from './App';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
  type iconSlotTriad_t,
  kMenuId,
  kMenuItemId,
} from './UIMenu';
import { Diagnostics } from './Diagnostics';
import { kFontSizeId } from './types/PaperPrinter_t';

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
  private app: App;
  private menus: UIMenu[] = [];
  private dx: Diagnostics;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIMenuMgr');
    // No initialization needed - menus are created on-demand by PaperPrinter
  }

  init(): void {
    // No initialization needed - menus are created on-demand by PaperPrinter
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
    // 2. Check if it's a number - validate against font size menu items
    else if (!isNaN(Number(id))) {
      try {
        const fontMenu = this.getMenuById('fontSizeId');
        const fontMenuItems = fontMenu.getMenuItems();
        isValid = fontMenuItems.some(item => item.id === id);
      } catch {
        // Menu doesn't exist yet, fallback to static list
        const validFontSizes = Object.keys(kFontSizeId);
        isValid = validFontSizes.includes(id);
      }
    }
    // 3. Check against theme IDs
    else {
      const validThemes = this.app.stylize.getThemes().map(t => t.id);
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

  createMenu(
    id: MenuId_t,
    displayName: string,
    iconSlotTriad: iconSlotTriad_t,
    isFlyout: boolean = false,
    menuItems: () => UIMenuItem_t[],
    flyoutMenuItemIds: string[] = [],
    selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>
  ): UIMenu {
    return new UIMenu(
      this.app,
      id,
      displayName,
      iconSlotTriad,
      isFlyout,
      menuItems,
      flyoutMenuItemIds,
      selectionHandler
    );
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
  async handleMenuItemSelected(menuId: MenuId_t, itemId: MenuItemId_t): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');

    try {
      const menu = this.getUIMenus().find(menu => menu.id === menuId);
      if (menu) {
        await menu.dispatchSelection(itemId);
        dx.out(`Menu item selected: ${menuId}.${itemId}`);
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
      this.dx.error(`Menu not found: ${id}`);
      throw new Error(`Menu not found: ${id}`);
    }
    return menu;
  }

  // Set persist value for a menu
  setPersistForMenuId(menuId: MenuId_t, menuItemId: MenuItemId_t): void {
    const menu = this.getMenuById(menuId);
    (menu.persist as unknown as Record<string, string | number | boolean>)[menuId] = menuItemId;
  }

  // Get the selected value for a menu
  getValueForSelectedByMenuId(menuId: MenuId_t): string | undefined {
    const menu = this.getMenuById(menuId);
    const selectedValue = (menu.persist as unknown as Record<string, string>)[menuId];
    return selectedValue;
  }

  // Add a menu to the list (called by PaperPrinter)
  addMenu(menu: UIMenu): void {
    if (this.menus.some(m => m.id === menu.id)) {
      return;
    }
    this.menus.push(menu);
  }

  // Generate all HTML at once using recursive flyout strategy
  async getUIMenus_HTML(): Promise<string> {
    const allMenus = this.getUIMenus();
    const visited = new Set<string>(); // Prevent infinite loops
    let result = '';

    // Generate only main menus (those that are not flyouts) - flyouts will be generated recursively
    for (const menu of allMenus.filter(menu => !menu.isFlyout)) {
      try {
        const html = await menu.getHTML(visited);
        result += (result ? '\n' : '') + html;
      } catch (error) {
        this.dx.out(`ERROR generating HTML for menu ${menu.id}: ${String(error)}`);
        result += (result ? '\n' : '') + `<!-- ERROR generating menu ${menu.id}: ${error} -->`;
      }
    }

    return result;
  }

  // Generate all JavaScript at once
  getUIMenus_JS(): string {
    // All menus share the same generic handlers - get from any menu's cached YAML
    const allMenus = this.getUIMenus();
    const anyMenu = allMenus[0];
    if (!anyMenu) {
      return '';
    }

    // Get the generic handlers - yaml getter handles loading automatically
    const js: string = anyMenu.yaml.uimenu_generic_handlers;
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

    // Get the CSS - yaml getter handles loading automatically
    const css: string = anyMenu.yaml.uimenu_css;
    if (!css) {
      return '';
    }

    return css;
  }
}

// end, UIMenuMgr.ts
