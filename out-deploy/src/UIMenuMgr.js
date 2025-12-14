"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIMenuMgr = void 0;
const UI_t_1 = require("./types/UI_t");
const UIMenu_1 = require("./UIMenu");
const kUIMenuItemDictRequiredKeys = [
    'windowWidth',
    'windowHeight',
    'pageWidth',
    'pageHeight',
];
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
class UIMenuMgr {
    static id = 'uimenumgr';
    reg;
    fn;
    menus = [];
    dx;
    // Generic context dictionary for template variable substitution
    // Updated from webview (window dimensions, text_edit display values) and persists across menu selections
    contextDict;
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('stylize.getThemes', 'os.dictReplace', 'persist.get', 'persist.set', 'utils.hasContent', 'utils.forceNumbers', 'utils.templateDictReplace', 'pdf.docInfo');
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
    setContextDict(contextDict = UI_t_1.kContextDict_None) {
        this.contextDict = { ...(this.contextDict ?? UI_t_1.kContextDict_None), ...contextDict };
    }
    // Instance methods with full validation using this.app
    isMenuId(id) {
        return UIMenu_1.kMenuId.includes(id);
    }
    isMenuItemId(id) {
        let isValid = false;
        // 1. Check against static kMenuItemId list (now auto-constructed from PaperPrinter_t.ts)
        if (UIMenu_1.kMenuItemId.includes(id)) {
            isValid = true;
        }
        // 2. Check if it's a number - could be font size, zoom level, or other numeric menu item
        // Accept any numeric string as valid (font sizes, zoom percentages, zoom scales all use numbers)
        else if (!isNaN(Number(id))) {
            isValid = true;
        }
        // 3. Check against theme IDs
        else {
            const validThemes = this.fn.stylize.getThemes().map((t) => t.id);
            isValid = validThemes.includes(id);
        }
        return isValid;
    }
    done() {
        // Cleanup any resources if needed
        this.menus = [];
        this.dx.done();
    }
    /**
     * Generate fresh HTML for a specific menu
     * Returns the HTML to be sent to webview by caller
     */
    async getUIMenu_HTML(menuId) {
        const menu = this.getMenuById(menuId);
        return await menu.getHTML();
    }
    createMenu(args) {
        const dx = this.dx.sub({ name: 'createMenu' });
        dx.require(args, ['id', 'displayName', 'iconSlotTriad', 'menuItems', 'selectionHandler']);
        const { id, displayName, iconSlotTriad, isFlyout = false, menuItems, flyoutMenuItemIds = [], selectionHandler } = args;
        return new UIMenu_1.UIMenu({
            reg: this.reg,
            id,
            displayName,
            iconSlotTriad,
            isFlyout,
            menuItems,
            flyoutMenuItemIds,
            selectionHandler
        });
    }
    // Get all menus
    getUIMenus() {
        return [...this.menus];
    }
    // Handle menu item selection
    // NOTE: All menu IDs and menu item IDs are static and known at compile time.
    // They are defined in PaperPrinter_t.ts constants and compiled into kMenuId/kMenuItemId.
    // There is no "random DOM code" that generates IDs - all IDs come from these constants.
    // Therefore, we don't need ID normalization, prefix stripping, or other bulletproofing.
    // If an invalid ID appears, it's a bug that should be fixed, not silently handled.
    // Future: HTML IDs will be completely reworked, so this validation is temporary.
    async handleMenuItemSelected(menuId, menuItemId, contextDict) {
        const dx = this.dx.sub({ name: 'handleMenuItemSelected' });
        dx.out(`Received: menuId=${menuId}, menuItemId=${menuItemId}`);
        dx.out(`contextDict: ${JSON.stringify(contextDict)}`);
        // Constant for display property key to avoid duplication
        const kDisplay = 'display';
        try {
            // Store contextDict for calc evaluations
            this.setContextDict(contextDict);
            // Handle text_edit input: if contextDict.display exists and menuItemId === menuId
            let finalMenuItemId = menuItemId;
            let isTextEditInput = false;
            dx.out(`Checking text_edit: contextDict.${kDisplay}=${contextDict?.[kDisplay]}, menuItemId===menuId? ${menuItemId === menuId}`);
            if (contextDict?.[kDisplay] !== undefined && menuItemId === menuId) {
                isTextEditInput = true;
                dx.out(`Text_edit input detected`);
                // Apply transform.persist if present (e.g., for text_edit input)
                const menu = this.getMenuById(menuId);
                const iconSlotMain = menu._iconSlotTriad?.main;
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
                    }
                    catch (error) {
                        dx.error(`Failed to apply transform.persist: ${error}`);
                        return;
                    }
                }
                else {
                    // No transform - use display value as-is
                    finalMenuItemId = String(contextDict[kDisplay]);
                    dx.out(`No transform, using display value as-is: ${finalMenuItemId}`);
                }
            }
            // Validate finalMenuItemId after transform (transformed value should be valid menuItemId)
            if (!this.isMenuItemId(finalMenuItemId)) {
                dx.error(`Invalid menu item ID: ${menuId}.${finalMenuItemId}${isTextEditInput ? ' (after transform)' : ''}`);
                return;
            }
            const menu = this.getUIMenus().find(menu => menu.id === menuId);
            if (menu) {
                await menu.dispatchSelection(finalMenuItemId, contextDict);
                dx.out(`Menu item selected: ${menuId}.${finalMenuItemId}`);
            }
            else {
                dx.error(`Invalid menu: ${menuId}`);
                return;
            }
        }
        finally {
            dx.done();
        }
    }
    // Get a specific menu by ID
    // Throws error if menu not found - guarantees a valid menu is returned
    getMenuById(id) {
        const menu = this.getUIMenus().find(menu => menu.id === id);
        if (!menu) {
            this.dx.error(`Menu not found: ${id}`);
            throw new Error(`Menu not found: ${id}`);
        }
        return menu;
    }
    // Get persist value for a menu (reads from persist singleton)
    getPersistForMenuId(menuId) {
        return this.fn.persist.get(menuId);
    }
    // Get persist value for a persistId from persist singleton
    getValueForPersistIdOnMenuId(args) {
        const dx = this.dx.sub({ name: 'getValueForPersistIdOnMenuId' });
        dx.require(args, ['menuId', 'persistId']);
        const { persistId } = args;
        const result = this.fn.persist.get(persistId);
        dx.done();
        return result;
    }
    // Set persist value for a persistId on persist singleton
    setValueForPersistIdOnMenuId(args) {
        const dx = this.dx.sub({ name: 'setValueForPersistIdOnMenuId' });
        dx.require(args, ['menuId', 'persistId', 'value']);
        const { menuId, persistId, value } = args;
        const oldValue = this.fn.persist.get(persistId);
        this.fn.persist.set(persistId, value);
        dx.out(`Menu[${menuId}].persist[${persistId}] = ${value} (was: ${oldValue})`);
        dx.done();
    }
    // Get the selected menuItemId for a menu (returns the persisted ID)
    getMenuItemIdSelected(menuId) {
        const selectedValue = this.fn.persist.get(menuId);
        this.dx.out(`getMenuItemIdSelected(${menuId}) → ${selectedValue}`);
        return selectedValue ? String(selectedValue) : undefined;
    }
    // Get the value for the currently selected menu item
    // Combines getMenuItemIdSelected + getValueForMenuItemId
    // Returns string or number, or undefined if empty/missing
    getValueForMenuItemIdSelected(menuId) {
        const dx = this.dx.sub({ name: 'getValueForMenuItemIdSelected' });
        const menuItemId = this.getMenuItemIdSelected(menuId);
        dx.out(`menuId=${menuId}, menuItemId=${menuItemId}`);
        if (!menuItemId) {
            dx.out(`No menuItemId, returning undefined`);
            dx.done();
            return undefined;
        }
        const value = this.getValueForMenuItemId({ menuId, menuItemId });
        dx.out(`Final result: menuItemId=${menuItemId}, value=${value}`);
        dx.done();
        return value;
    }
    // Get the value for a menu item by its ID
    // Resolves menu item values via resolver functions (for dynamic values like fitWidth/fitPage),
    // numeric values, or legacy calc templates. Returns the resolved value or menuItemId as fallback.
    // Never returns undefined - defaults to menuItemId if value not found or resolution fails.
    getValueForMenuItemId(args) {
        const dx = this.dx.sub({ name: 'getValueForMenuItemId' });
        dx.require(args, ['menuId', 'menuItemId']);
        const { menuId, menuItemId } = args;
        let result = menuItemId;
        const menu = this.getMenuById(menuId);
        // Check if menuItemId === menuId (custom text_edit value)
        // Read from persistId instead of menu items
        if (menuItemId === menuId) {
            const dx = this.dx.sub({ name: 'getValueForMenuItemId[iconSlotTriad]' });
            const iconSlotMain = menu._iconSlotTriad
                ?.main;
            dx.out(`menuItemId === menuId, checking for persistId`);
            if (typeof iconSlotMain !== 'string' && iconSlotMain.persistId) {
                dx.out(`Found persistId: ${iconSlotMain.persistId}`);
                const persistValue = this.getValueForPersistIdOnMenuId({ menuId, persistId: iconSlotMain.persistId });
                dx.out(`Read from menu.persist[${iconSlotMain.persistId}] = ${persistValue}`);
                if (this.fn.utils.hasContent(persistValue)) {
                    result = persistValue;
                    dx.out(`Returning persistValue: ${result}`);
                }
            }
            dx.done();
        }
        else {
            const menuItems = menu.getMenuItems();
            // Try to find the menuItem in the list
            const menuItem = menuItems.find(item => item.id === menuItemId);
            if (menuItem && 'value' in menuItem) {
                const itemWithValue = menuItem;
                const value = itemWithValue.value;
                if (typeof value === 'function') {
                    const resolvedValue = this.resolveUIMenuItemValue(value, menuId, menuItemId);
                    if (resolvedValue !== undefined) {
                        result = resolvedValue;
                    }
                }
                else if (typeof value === 'string' &&
                    (value.includes('{{calc:') || value.includes('{{'))) {
                    const evalResult = this.evaluateCalcTemplate(value, menuId, menuItemId);
                    if (evalResult !== undefined) {
                        result = evalResult;
                    }
                    else {
                        this.dx.error(`Template evaluation failed for ${menuId}.${menuItemId}, value: ${value}`);
                        result = menuItemId;
                    }
                }
                else {
                    result = value;
                }
            }
        }
        return result;
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
    buildUIMenuItemDict() {
        const dx = this.dx.sub({ name: 'buildUIMenuItemDict' });
        const pageSizePx = this.fn.pdf?.docInfo()?.pageSizePx;
        const context = this.contextDict ?? {};
        const inputs = {
            windowWidth: context.windowWidth,
            windowHeight: context.windowHeight,
            pageWidth: pageSizePx?.widthPx,
            pageHeight: pageSizePx?.heightPx,
        };
        // forceNumbers with requiredKeys ensures all keys exist, coerces to numbers (non-zero or useForZero)
        // Missing keys are added with useForZero=1, invalid/zero values become 1
        const dict_nums = this.fn.utils.forceNumbers(inputs, 1, kUIMenuItemDictRequiredKeys);
        dx.done();
        return dict_nums;
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
    resolveUIMenuItemValue(resolver, menuId, menuItemId) {
        const dx = this.dx.sub({ name: 'resolveUIMenuItemValue' });
        const dict_nums = this.buildUIMenuItemDict();
        try {
            const result = resolver(dict_nums);
            dx.done();
            return result;
        }
        catch (error) {
            this.dx.error(`Menu item value resolver failed for ${menuId}.${menuItemId}: ${String(error)}`);
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
    evaluateCalcTemplate(value, menuId, menuItemId) {
        const dx = this.dx.sub({ name: 'evaluateCalcTemplate' });
        try {
            // Build complete context dictionary: merge contextDict with page dimensions
            const pageSizePx = this.fn.pdf?.docInfo()?.pageSizePx || { widthPx: 0, heightPx: 0 };
            dx.out(`PDF page dimensions: ${pageSizePx.widthPx}px x ${pageSizePx.heightPx}px`);
            const fullContext = {
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
            let result = this.fn.utils.templateDictReplace(value, fullContext);
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
                }
                else {
                    dx.out(`Extracted calc expression: "${expression}"`);
                    try {
                        // biome-ignore lint/security/noGlobalEval: Templates are developer-defined constants; users only select which template to use -- eslint-disable-next-line no-eval
                        const calcResult = eval(expression);
                        result = result.replace(calcMatch[0], String(calcResult));
                        dx.out(`Calc evaluated: ${expression} = ${calcResult}`);
                    }
                    catch (evalError) {
                        dx.error(`Eval failed for ${menuId}.${menuItemId}: ${String(evalError)}`);
                        dx.out(`Template: ${value}`);
                        dx.out(`After replacement: ${result}`);
                        dx.out(`Expression to eval: "${expression}"`);
                        dx.out(`Context dictionary: ${JSON.stringify(fullContext, null, 2)}`);
                        dx.done();
                        return undefined;
                    }
                }
            }
            else if (result.includes('{{') || result.includes('}}')) {
                // If there are still unreplaced template variables, fail validation
                dx.error(`Template has unreplaced vars for ${menuId}.${menuItemId}: ${result}`);
                dx.done();
                return undefined;
            }
            dx.out(`Template value resolved: ${value} -> ${result}`);
            dx.done();
            return result;
        }
        catch (error) {
            dx.error(`Template evaluation failed for ${menuId}.${menuItemId}: ${String(error)}`);
            dx.done();
            return undefined;
        }
    }
    // Add a menu to the list (called by PaperPrinter)
    addMenu(menu) {
        if (this.menus.some(m => m.id === menu.id)) {
            return;
        }
        this.menus.push(menu);
    }
    // Generate all HTML at once using recursive flyout strategy
    async getUIMenus_HTML() {
        const allMenus = this.getUIMenus();
        const visited = new Set(); // Prevent infinite loops
        let result = '';
        // Generate only main menus (those that are not flyouts) - flyouts will be generated recursively
        for (const menu of allMenus.filter(menu => !menu.isFlyout)) {
            try {
                const html = await menu.getHTML(visited);
                result += (result ? '\n' : '') + html;
            }
            catch (error) {
                this.dx.out(`ERROR generating HTML for menu ${menu.id}: ${String(error)}`);
                result += (result ? '\n' : '') + `<!-- ERROR generating menu ${menu.id}: ${error} -->`;
            }
        }
        return result;
    }
    // Generate all JavaScript at once
    getUIMenus_JS() {
        // All menus share the same generic handlers - get from any menu's cached YAML
        const allMenus = this.getUIMenus();
        const anyMenu = allMenus[0];
        if (!anyMenu) {
            return '';
        }
        // Get the generic handlers - yaml method handles loading automatically
        const js = anyMenu.yaml().uimenu_generic_handlers;
        if (!js) {
            return '';
        }
        return js;
    }
    // Get all UIMenu CSS
    getUIMenus_CSS() {
        const anyMenu = this.getUIMenus()[0];
        if (!anyMenu) {
            return '';
        }
        // Get the CSS - yaml method handles loading automatically
        const css = anyMenu.yaml().uimenu_css;
        if (!css) {
            return '';
        }
        return css;
    }
}
exports.UIMenuMgr = UIMenuMgr;
// end, UIMenuMgr.ts
//# sourceMappingURL=UIMenuMgr.js.map