import type { App } from './App';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
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
 * const html = await uimenumgr.getAllUIMenuHTML();
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

    // Strip any composed prefixes (e.g., "headerTitle.left" -> "left")
    // This handles cases where IDs might be composed in the DOM
    const baseId = id.includes('.') ? id.split('.').pop() || id : id;

    // 1. Check against static kMenuItemId list (now auto-constructed from PaperPrinter_t.ts)
    if ((kMenuItemId as readonly string[]).includes(baseId)) {
      isValid = true;
    }
    // 2. Check if it's a number - validate against font size menu items
    else if (!isNaN(Number(baseId))) {
      try {
        const fontMenu = this.getMenuById('fontSizeId');
        const fontMenuItems = fontMenu.getMenuItems();
        isValid = fontMenuItems.some(item => item.id === baseId);
      } catch {
        // Menu doesn't exist yet, fallback to static list
        const validFontSizes = Object.keys(kFontSizeId);
        isValid = validFontSizes.includes(baseId);
      }
    }
    // 3. Check against theme IDs
    else {
      const validThemes = this.app.stylize.getThemes().map(t => t.id);
      isValid = validThemes.includes(baseId);
    }

    return isValid;
  }

  done(): void {
    // Cleanup any resources if needed
    this.menus = [];
    this.dx.done();
  }

  createMenu(
    id: MenuId_t,
    displayName: string,
    icon: string,
    isFlyout: boolean = false,
    menuItems: () => UIMenuItem_t[],
    flyoutMenuItemIds: string[] = [],
    selectionHandler: (menuId: MenuId_t, menuItemId: MenuItemId_t) => Promise<HandleSelection_t>
  ): UIMenu {
    return new UIMenu(
      this.app,
      id,
      displayName,
      icon,
      isFlyout,
      menuItems,
      flyoutMenuItemIds,
      selectionHandler
    );
  }

  // Get all menus
  getAllMenus(): UIMenu[] {
    return [...this.menus];
  }

  // Handle menu item selection
  async handleMenuItemSelected(menuId: MenuId_t, itemId: MenuItemId_t): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');

    try {
      // Strip any composed prefixes (e.g., "headerTitle.left" -> "left")
      // This handles cases where IDs might be composed in the DOM
      const baseItemId = (
        itemId.includes('.') ? itemId.split('.').pop() || itemId : itemId
      ) as MenuItemId_t;

      const menu = this.getAllMenus().find(menu => menu.id === menuId);
      if (menu) {
        await menu.dispatchSelection(baseItemId);
        dx.out(`Menu item selected: ${menuId}.${baseItemId}`);
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
    const menu = this.getAllMenus().find(menu => menu.id === id);
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
  async getAllUIMenuHTML(): Promise<string> {
    const allMenus = this.getAllMenus();
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
  getAllUIMenuJS(): string {
    // All menus share the same generic handlers - get from any menu's cached YAML
    const allMenus = this.getAllMenus();
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
  getAllUIMenuCSS(): string {
    const anyMenu = this.getAllMenus()[0];
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
