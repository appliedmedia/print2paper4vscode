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
  // Generic context dictionary for template variable substitution
  // Updated on each menu selection from webview (window dimensions)
  private contextDict?: Record<string, number>;

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
    contextDict?: Record<string, number>
  ): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');

    try {
      // Store context dictionary for template variable substitution
      if (contextDict) {
        this.contextDict = contextDict;
        const contextStr = Object.entries(contextDict)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        dx.out(`Context dictionary updated: ${contextStr}`);
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
  // - calc template evaluation fails (returns empty string)
  // - value cannot be parsed as number
  getNumericValueForMenuItemId(menuId: MenuId_t, menuItemId: string): number | undefined {
    const menu = this.getMenuById(menuId);
    const menuItems = menu.getMenuItems();
    
    // Try to find the menuItem in the list
    const menuItem = menuItems.find(item => item.id === menuItemId);
    
    if (menuItem && 'value' in menuItem) {
      const value = (menuItem as any).value;
      
      // Check if value contains template syntax (including calc)
      if (typeof value === 'string' && (value.includes('{{calc:') || value.includes('{{'))) {
        // Evaluate template (replaces vars and evaluates calc expressions)
        const result = this.evaluateCalcTemplate(value);
        // Empty string means evaluation failed, return undefined
        if (result === '') return undefined;
        const parsed = parseFloat(result);
        return isNaN(parsed) ? undefined : parsed;
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
  // - No user-entered formulas can reach eval()
  // 
  // Process:
  // 1. Merge contextDict (from webview) with known page dimensions (from PDF)
  // 2. Always call templateDictReplace on value (replaces all {{vars}})
  // 3. Look for {{calc:...}} pattern and extract expression
  // 4. eval() the expression (developer-defined formula)
  // 5. Replace {{calc:...}} with result
  // 6. Return final string (or empty string on error)
  //    - If result contains "{{", it's clear which variable didn't have a dict entry
  private evaluateCalcTemplate(value: string): string {
    const dx = this.dx.sub('evaluateCalcTemplate');
    
    try {
      // Build complete context dictionary: merge contextDict with page dimensions
      const pageSizePx = this.app.pdf?.docInfo?.pageSizePx || { widthPx: 0, heightPx: 0 };
      const fullContext: Record<string, string> = {
        // Page dimensions (known on extension side from PDF)
        pageWidth: String(pageSizePx.widthPx),
        pageHeight: String(pageSizePx.heightPx),
      };
      
      // Add contextDict (window dimensions from webview)
      if (this.contextDict) {
        for (const [key, val] of Object.entries(this.contextDict)) {
          fullContext[key] = String(val);
        }
      }
      
      // Validate dimensions are positive before calc evaluation (prevent Infinity from division by zero)
      const pageWidth = parseFloat(fullContext.pageWidth || '0');
      const pageHeight = parseFloat(fullContext.pageHeight || '0');
      const windowWidth = parseFloat(fullContext.windowWidth || '0');
      const windowHeight = parseFloat(fullContext.windowHeight || '0');
      
      if (value.includes('{{calc:')) {
        // If calc template requires dimensions, validate they're positive
        if (value.includes('pageWidth') || value.includes('pageHeight') || 
            value.includes('windowWidth') || value.includes('windowHeight')) {
          if (pageWidth <= 0 || pageHeight <= 0 || windowWidth <= 0 || windowHeight <= 0) {
            dx.out(`Cannot evaluate calc: dimensions not available (page: ${pageWidth}x${pageHeight}, window: ${windowWidth}x${windowHeight})`);
            return ''; // Return empty to signal failure
          }
        }
      }
      
      // Always replace template variables first (regardless of calc or not)
      let result = this.app.templateDictReplace(value, fullContext);
      
      // Look for {{calc:...}} pattern (allows whitespace, only replaces calc portion)
      // Example: "Other: {{calc: 842/800 }}" → "Other: 1.0525"
      const calcMatch = result.match(/\{\{calc:\s*(.+?)\s*\}\}/);
      if (calcMatch) {
        const expression = calcMatch[1].trim(); // Trim captured expression
        
        // eval() the expression (developer-defined formula)
        // If it fails, catch will handle it. If unsubstituted vars remain (e.g., {{foo}}),
        // they'll be obvious in the result or cause eval to fail naturally.
        try {
          // eslint-disable-next-line no-eval
          const calcResult = eval(expression);
          
          // Replace only the {{calc:...}} portion with the result
          // Note: calcResult can be any type (number, string, etc.) - convert to string
          result = result.replace(calcMatch[0], String(calcResult));
          dx.out(`Calc evaluated: ${expression} = ${calcResult}`);
        } catch (evalError) {
          dx.print(`Error in eval: ${String(evalError)}`);
          return '';
        }
      }
      
      dx.out(`Template value resolved: ${value} -> ${result}`);
      return result;
      
    } catch (error) {
      dx.print(`Error in evaluateCalcTemplate: ${String(error)}`);
      return '';
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
