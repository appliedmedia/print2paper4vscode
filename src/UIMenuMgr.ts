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

    // 1. Check against static kMenuItemId list
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

  createMenu(
    id: MenuId_t,
    displayName: string,
    icon: string,
    isFlyout: boolean = false,
    menuItems: () => UIMenuItem_t[],
    flyoutMenuItemIds: string[] = [],
    selectionHandler: (selectedId: MenuItemId_t) => Promise<HandleSelection_t>
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
      const menu = this.getAllMenus().find(menu => menu.id === menuId);
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
    const menu = this.getAllMenus().find(menu => menu.id === id);
    if (!menu) {
      this.dx.error(`Menu not found: ${id}`);
      throw new Error(`Menu not found: ${id}`);
    }
    return menu;
  }

  // Set persist value for a menu
  setPersistForMenuId(menuId: MenuId_t, selectedId: MenuItemId_t): void {
    const menu = this.getMenuById(menuId);
    (menu.persist as unknown as Record<string, string | number | boolean>)[menuId] = selectedId;
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
      this.dx.out(`addMenu: Duplicate id ${menu.id} ignored`);
      return;
    }
    this.menus.push(menu);
    this.dx.out(`addMenu: Added menu ${menu.id}, total menus: ${this.menus.length}`);
  }

  // Generate all HTML at once using two-pass flyout strategy
  async getAllUIMenuHTML(): Promise<string> {
    const allMenus = this.getAllMenus();
    this.dx.out(`getAllUIMenuHTML: Found ${allMenus.length} menus`);
    const flyoutCache: Record<string, string> = {};

    // Process flyout menus first
    for (const menu of allMenus.filter(menu => !menu.icon?.length)) {
      // flyout menus only (don't have an icon)
      this.dx.out(`Caching flyout HTML for: ${menu.id}`);
      try {
        const html = await menu.getHTML();
        flyoutCache[menu.id] = html;
        this.dx.out(`Cached flyout for ${menu.id}: ${html.substring(0, 100)}...`);
      } catch (error) {
        this.dx.out(`ERROR generating flyout for ${menu.id}: ${String(error)}`);
        flyoutCache[menu.id] = `<!-- ERROR: ${error} -->`;
      }
    }

    // Rest of menus
    let result = '';
    for (const menu of allMenus.filter(menu => menu.icon?.length)) {
      this.dx.out(`Generating HTML for menu: ${menu.id}`);
      try {
        const html = await menu.getHTML(flyoutCache);
        this.dx.out(`Generated HTML for menu ${menu.id}: ${html.substring(0, 100)}...`);
        result += (result ? '\n' : '') + html;
      } catch (error) {
        this.dx.out(`ERROR generating HTML for menu ${menu.id}: ${String(error)}`);
        result += (result ? '\n' : '') + `<!-- ERROR generating menu ${menu.id}: ${error} -->`;
      }
    }

    // Append all flyout menus to the result so they're in the DOM
    for (const [flyoutId, flyoutHtml] of Object.entries(flyoutCache)) {
      result += '\n' + flyoutHtml;
    }

    this.dx.out(`Total generated HTML length: ${result.length}`);
    this.dx.out(`Final HTML preview: ${result.substring(0, 200)}...`);
    return result;
  }

  // Generate all JavaScript at once
  getAllUIMenuJS(): string {
    // All menus share the same generic handlers - get from any menu's cached YAML
    const allMenus = this.getAllMenus();
    this.dx.out(`getAllUIMenuJS: Found ${allMenus.length} menus`);
    const anyMenu = allMenus[0];
    if (!anyMenu) {
      this.dx.out('getAllUIMenuJS: No menus available, returning empty JS');
      return '';
    }

    // Get the generic handlers - yaml getter handles loading automatically
    const js: string = anyMenu.yaml.uimenu_generic_handlers;
    if (!js) {
      this.dx.out(
        'getAllUIMenuJS: JS is undefined/empty, YAML loading failed or no handlers present'
      );
      return '';
    }
    this.dx.out(`getAllUIMenuJS: Generated ${js.length} characters of JS`);
    return js;
  }

  // Get all UIMenu CSS
  getAllUIMenuCSS(): string {
    const anyMenu = this.getAllMenus()[0];
    if (!anyMenu) {
      this.dx.out('getAllUIMenuCSS: No menus available');
      return '';
    }

    // Get the CSS - yaml getter handles loading automatically
    const css: string = anyMenu.yaml.uimenu_css;
    if (!css) {
      this.dx.out('getAllUIMenuCSS: CSS is undefined, YAML loading failed');
      return '';
    }
    this.dx.out(`getAllUIMenuCSS: Generated ${css.length} characters of CSS`);

    return css;
  }
}

// end, UIMenuMgr.ts
