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
  // Generic runtime context for calc template variable substitution
  // Updated on each menu selection from webview (e.g., pageWidth, windowHeight)
  private runtimeContext?: Record<string, number>;

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
  async handleMenuItemSelected(
    menuId: MenuId_t,
    itemId: MenuItemId_t,
    runtimeContext?: Record<string, number>
  ): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');

    try {
      // Store runtime context for calc template variable substitution
      if (runtimeContext) {
        this.runtimeContext = runtimeContext;
        const contextStr = Object.entries(runtimeContext)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        dx.out(`Runtime context updated: ${contextStr}`);
      }

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

  // Get the selected menuItemId for a menu (returns the persisted ID)
  getValueForSelectedByMenuId(menuId: MenuId_t): string | undefined {
    const menu = this.getMenuById(menuId);
    const selectedValue = (menu.persist as unknown as Record<string, string>)[menuId];
    return selectedValue;
  }

  // Get the numeric value for a selected menu item
  // Looks up menuItem by ID, evaluates calc templates, or parses numeric IDs
  // Returns undefined if:
  // - menuItem not found
  // - calc template requires unavailable runtime dimensions (e.g., fitPage/fitWidth)
  // - value cannot be parsed as number
  getNumericValueForMenuItemId(menuId: MenuId_t, menuItemId: string): number | undefined {
    const menu = this.getMenuById(menuId);
    const menuItems = menu.getMenuItems();
    
    // Try to find the menuItem in the list
    const menuItem = menuItems.find(item => item.id === menuItemId);
    
    if (menuItem && 'value' in menuItem) {
      const value = (menuItem as any).value;
      
      // Check if value is a calc template
      if (typeof value === 'string' && value.startsWith('{{calc:')) {
        // Evaluate calc template (may return undefined if dimensions unavailable)
        const result = this.evaluateCalcTemplate(value);
        return result; // undefined = calc requires runtime dimensions
      }
      
      // Return numeric value
      return typeof value === 'number' ? value : parseFloat(value);
    }
    
    // If not found in menuItems, try parsing menuItemId as number
    const parsed = parseFloat(menuItemId);
    return isNaN(parsed) ? undefined : parsed;
  }

  // Evaluate calc template like {{calc:{{pageHeight}}/{{windowHeight}}}}
  // 
  // SECURITY NOTE: eval() is safe here because:
  // - Templates are DEVELOPER-DEFINED in PaperPrinter_t.ts constants (not user input)
  // - Users only SELECT which template to use (pick "fitPage" menuItemId)
  // - Template variable substitution uses VALIDATED numeric values from runtimeContext
  // - No user-entered formulas can reach eval()
  // 
  // Flexibility: Using eval() allows complex future formulas:
  // - {{calc:{{pageWidth}} * 0.9}} - fit with margin
  // - {{calc:Math.min({{pageWidth}}/{{windowWidth}}, {{pageHeight}}/{{windowHeight}})}}
  // - {{calc:({{pageHeight}}/{{windowHeight}}) * 1.1}} - scale adjustments
  private evaluateCalcTemplate(template: string): number | undefined {
    const dx = this.dx.sub('evaluateCalcTemplate');
    
    try {
      // Extract the expression from {{calc:...}}
      const match = template.match(/^\{\{calc:(.*)\}\}$/);
      if (!match) {
        dx.out('Invalid calc template format');
        return undefined;
      }
      
      let expression = match[1];
      
      // Check if runtime context is available (sent from webview on menu selection)
      if (!this.runtimeContext) {
        dx.out('No runtime context available for calc template');
        return undefined;
      }
      
      // Replace template variables with actual values from runtime context
      // e.g., {{pageWidth}} -> 595, {{windowHeight}} -> 800
      for (const [key, value] of Object.entries(this.runtimeContext)) {
        const placeholder = `{{${key}}}`;
        if (expression.includes(placeholder)) {
          // Validate that the value is actually a number before substitution
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            dx.out(`Invalid runtime context value for ${key}: ${value}`);
            return undefined;
          }
          expression = expression.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
          dx.out(`Substituted ${placeholder} -> ${value}`);
        }
      }
      
      // Check if any template variables remain unsubstituted
      if (expression.match(/\{\{.*?\}\}/)) {
        dx.out(`Unsubstituted template variables in expression: ${expression}`);
        return undefined;
      }
      
      // Evaluate the expression (developer-defined formula with validated numeric substitutions)
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      
      // Validate result
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        dx.out(`Invalid calc result: ${result}`);
        return undefined;
      }
      
      dx.out(`Calc template evaluated: ${template} -> ${expression} = ${result}`);
      return result;
      
    } catch (error) {
      dx.out(`Error evaluating calc template: ${String(error)}`);
      return undefined;
    } finally {
      dx.done();
    }
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
