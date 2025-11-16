import type { App } from './App';
import type { UI_t } from './UI';
import type { PersistValue_t } from './Persist';
import { contextDict_t, kContextDict_None } from './types/UI_t';
import {
  UIMenu,
  type MenuId_t,
  type MenuItemId_t,
  type HandleSelection_t,
  type UIMenuItem_t,
  type iconSlotTriad_t,
  type TextEditConfig_t,
  kMenuId,
  kMenuItemId,
} from './UIMenu';
import { Diagnostics } from './Diagnostics';
import {
  kFontSizeId,
  type TemplateValueDict,
  type TemplateValueResolver,
} from './types/PaperPrinter_t';

const kTemplateValueRequiredKeys = [
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
  private app: App;
  private menus: UIMenu[] = [];
  private dx: Diagnostics;
  // Generic context dictionary for template variable substitution
  // Updated from webview (window dimensions, text_edit display values) and persists across menu selections
  private contextDict?: contextDict_t;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.sub('UIMenuMgr');
    // No initialization needed - menus are created on-demand by PaperPrinter
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
    // 2. Check if it's a number - could be font size, zoom level, or other numeric menu item
    // Accept any numeric string as valid (font sizes, zoom percentages, zoom scales all use numbers)
    else if (!isNaN(Number(id))) {
      isValid = true;
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
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t
  ): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');
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
        // Text_edit input - apply transform.persist if present
        const menu = this.getMenuById(menuId);
        const iconSlotMain = (menu as any)._iconSlotTriad?.main;
        if (typeof iconSlotMain === 'object' && iconSlotMain.type === 'text_edit') {
          const textEditConfig = iconSlotMain;
          if (textEditConfig.transform?.persist) {
            try {
              const expression = this.app.templateDictReplace(textEditConfig.transform.persist, {
                [kDisplay]: String(contextDict[kDisplay]),
              });
              // biome-ignore lint/security/noGlobalEval: Templates are developer-defined constants; users only select which template to use -- eslint-disable-next-line no-eval
              const transformedValue = eval(expression);
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
      this.dx.error(`Menu not found: ${id}`);
      throw new Error(`Menu not found: ${id}`);
    }
    return menu;
  }

  // Get persist value for a menu (reads from menu.persist[menuId])
  getPersistForMenuId(menuId: MenuId_t): PersistValue_t | undefined {
    const menu = this.getMenuById(menuId);
    return (menu.persist as unknown as Record<string, PersistValue_t>)[menuId];
  }

  // Get persist value for a persistId from a menu's persist
  getValueForPersistIdOnMenuId(menuId: MenuId_t, persistId: UI_t): PersistValue_t | undefined {
    const menu = this.getMenuById(menuId);
    return (menu.persist as unknown as Record<string, PersistValue_t>)[persistId];
  }

  // Set persist value for a persistId on a menu's persist
  setValueForPersistIdOnMenuId(menuId: MenuId_t, persistId: UI_t, value: PersistValue_t): void {
    const dx = this.dx.sub('setValueForPersistIdOnMenuId');
    const menu = this.getMenuById(menuId);
    const oldValue = (menu.persist as unknown as Record<string, PersistValue_t>)[persistId];
    (menu.persist as unknown as Record<string, PersistValue_t>)[persistId] = value;
    dx.out(`Menu[${menuId}].persist[${persistId}] = ${value} (was: ${oldValue})`);
    dx.done();
  }

  // Get the selected menuItemId for a menu (returns the persisted ID)
  getMenuItemIdSelected(menuId: MenuId_t): string | undefined {
    const menu = this.getMenuById(menuId);
    const selectedValue = (menu.persist as unknown as Record<string, string>)[menuId];
    this.dx.out(`getMenuItemIdSelected(${menuId}) → ${selectedValue}`);
    return selectedValue;
  }

  // Get the value for the currently selected menu item
  // Combines getMenuItemIdSelected + getValueForMenuItemId
  // Returns string or number, or undefined if empty/missing
  getValueForMenuItemIdSelected(menuId: MenuId_t): number | string | undefined {
    const dx = this.dx.sub('getValueForMenuItemIdSelected');
    const menuItemId = this.getMenuItemIdSelected(menuId);
    dx.out(`menuId=${menuId}, menuItemId=${menuItemId}`);
    if (!menuItemId) {
      dx.out(`No menuItemId, returning undefined`);
      dx.done();
      return undefined;
    }

    const value = this.getValueForMenuItemId(menuId, menuItemId);
    dx.out(`Final result: menuItemId=${menuItemId}, value=${value}`);
    dx.done();
    return value;
  }

  // Get the value for a menu item by its ID
  // Resolves menu item values via resolver functions (for dynamic values like fitWidth/fitPage),
  // numeric values, or legacy calc templates. Returns the resolved value or menuItemId as fallback.
  // Never returns undefined - defaults to menuItemId if value not found or resolution fails.
  getValueForMenuItemId(menuId: MenuId_t, menuItemId: string): number | string {
    let result: number | string = menuItemId;

    const menu = this.getMenuById(menuId);

    // Check if menuItemId === menuId (custom text_edit value)
    // Read from persistId instead of menu items
    if (menuItemId === menuId) {
      const dx = this.dx.sub('getValueForMenuItemId[iconSlotTriad]');
      const iconSlotMain = (menu as unknown as { _iconSlotTriad: iconSlotTriad_t })._iconSlotTriad
        ?.main;
      dx.out(`menuItemId === menuId, checking for text_edit persistId`);
      if (typeof iconSlotMain === 'object' && iconSlotMain.type === 'text_edit') {
        const textEditConfig = iconSlotMain as TextEditConfig_t;
        dx.out(`Found text_edit config, persistId=${textEditConfig.persistId}`);
        if (textEditConfig.persistId) {
          const persistValue = this.getValueForPersistIdOnMenuId(menuId, textEditConfig.persistId);
          dx.out(`Read from menu.persist[${textEditConfig.persistId}] = ${persistValue}`);
          if (this.app.hasContent(persistValue)) {
            result = persistValue as string | number;
            dx.out(`Returning persistValue: ${result}`);
          }
        }
      }
      dx.done();
    } else {
      const menuItems = menu.getMenuItems();

      // Try to find the menuItem in the list
      const menuItem = menuItems.find(item => item.id === menuItemId);

      if (menuItem && 'value' in menuItem) {
        const itemWithValue = menuItem as UIMenuItem_t & {
          value: number | string | TemplateValueResolver;
        };
        const value = itemWithValue.value;

        if (typeof value === 'function') {
          const resolvedValue = this.resolveTemplateValue(value, menuId, menuItemId);
          if (resolvedValue !== undefined) {
            result = resolvedValue;
          }
        } else if (
          typeof value === 'string' &&
          (value.includes('{{calc:') || value.includes('{{'))
        ) {
          const evalResult = this.evaluateCalcTemplate(value, menuId, menuItemId);
          if (evalResult !== undefined) {
            result = evalResult;
          } else {
            this.dx.error(
              `Template evaluation failed for ${menuId}.${menuItemId}, value: ${value}`
            );
            result = menuItemId;
          }
        } else {
          result = value;
        }
      }
    }

    return result;
  }

  private buildTemplateValueDict(): TemplateValueDict | undefined {
    const dx = this.dx.sub('buildTemplateValueDict');
    const pageSizePx = this.app.pdf?.docInfo?.pageSizePx;
    const context = this.contextDict ?? {};
    const inputs: Record<string, number | string | undefined> = {
      windowWidth: context.windowWidth,
      windowHeight: context.windowHeight,
      pageWidth: pageSizePx?.widthPx,
      pageHeight: pageSizePx?.heightPx,
    };
    const requiredKeys: string[] = [...kTemplateValueRequiredKeys];
    if (!dx.require(inputs, requiredKeys)) {
      dx.error('Missing required template value keys');
      dx.done();
      return undefined;
    }
    // Force each value to a non-zero number with fallback of 1
    const dict_nums = this.app.forceNumber(inputs, 1);
    // Validate that all required keys are present and non-zero after forcing
    for (const key of requiredKeys) {
      if (!(key in dict_nums) || dict_nums[key] === 0) {
        dx.error(`Template value ${key} is missing or zero after coercion`);
        dx.done();
        return undefined;
      }
    }
    dx.done();
    return dict_nums;
  }

  private resolveTemplateValue(
    resolver: TemplateValueResolver,
    menuId: string,
    menuItemId: string
  ): number | string | undefined {
    const dx = this.dx.sub('resolveTemplateValue');
    const dict_nums = this.buildTemplateValueDict();
    if (!dict_nums) {
      dx.done();
      return undefined;
    }
    try {
      const result = resolver(dict_nums);
      dx.done();
      return result;
    } catch (error) {
      this.dx.error(`Template resolver failed for ${menuId}.${menuItemId}: ${String(error)}`);
      dx.done();
      return undefined;
    }
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
  // 6. Return final string, or undefined on error
  //    - If result contains "{{", it's clear which variable didn't have a dict entry
  //
  // @param value - Template string to evaluate
  // @param menuId - Menu ID for error logging context
  // @param menuItemId - Menu item ID for error logging context
  // @returns Evaluated result string, or undefined if evaluation fails
  private evaluateCalcTemplate(
    value: string,
    menuId: string,
    menuItemId: string
  ): string | undefined {
    const dx = this.dx.sub('evaluateCalcTemplate');

    try {
      // Build complete context dictionary: merge contextDict with page dimensions
      const pageSizePx = this.app.pdf?.docInfo?.pageSizePx || { widthPx: 0, heightPx: 0 };
      dx.out(`PDF page dimensions: ${pageSizePx.widthPx}px x ${pageSizePx.heightPx}px`);
      const fullContext: Record<string, string> = {
        // Page dimensions (known on extension side from PDF)
        pageWidth: String(pageSizePx.widthPx),
        pageHeight: String(pageSizePx.heightPx),
      };

      // Add contextDict (window dimensions from webview)
      // contextDict persists across calls - set once from webview message, used for all subsequent calcs
      dx.out(`contextDict available: ${this.contextDict ? 'yes' : 'no'}`);
      if (this.contextDict) {
        dx.out(`Adding contextDict: ${JSON.stringify(this.contextDict)}`);
        for (const [key, val] of Object.entries(this.contextDict)) {
          fullContext[key] = String(val);
        }
      }

      // Always replace template variables first (regardless of calc or not)
      dx.out(`fullContext keys: ${Object.keys(fullContext).join(', ')}`);
      dx.out(`fullContext: ${JSON.stringify(fullContext)}`);
      dx.out(`Template to replace: ${value}`);
      let result = this.app.templateDictReplace(value, fullContext);
      dx.out(`After template replacement: ${result}`);

      // Look for {{calc:...}} pattern
      const calcMatch = result.match(/\{\{calc:\s*(.+?)\s*\}\}/);
      if (calcMatch) {
        const expression = calcMatch[1].trim();

        // Check for unreplaced template variables ({{ or }}) inside the expression
        if (expression.includes('{{') || expression.includes('}}')) {
          dx.error(`Template has unreplaced vars for ${menuId}.${menuItemId}: ${expression}`);
          dx.done();
          return undefined;
        } else {
          dx.out(`Extracted calc expression: "${expression}"`);

          try {
            // biome-ignore lint/security/noGlobalEval: Templates are developer-defined constants; users only select which template to use -- eslint-disable-next-line no-eval
            const calcResult = eval(expression);
            result = result.replace(calcMatch[0], String(calcResult));
            dx.out(`Calc evaluated: ${expression} = ${calcResult}`);
          } catch (evalError) {
            dx.error(`Eval failed for ${menuId}.${menuItemId}: ${String(evalError)}`);
            dx.out(`Template: ${value}`);
            dx.out(`After replacement: ${result}`);
            dx.out(`Expression to eval: "${expression}"`);
            dx.out(`Context dictionary: ${JSON.stringify(fullContext, null, 2)}`);
            dx.done();
            return undefined;
          }
        }
      } else if (result.includes('{{') || result.includes('}}')) {
        // If there are still unreplaced template variables, fail validation
        dx.error(`Template has unreplaced vars for ${menuId}.${menuItemId}: ${result}`);
        dx.done();
        return undefined;
      }

      dx.out(`Template value resolved: ${value} -> ${result}`);
      dx.done();
      return result;
    } catch (error) {
      dx.error(`Template evaluation failed for ${menuId}.${menuItemId}: ${String(error)}`);
      dx.done();
      return undefined;
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
