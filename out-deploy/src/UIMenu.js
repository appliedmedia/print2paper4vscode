"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIMenu = exports.kMenuItemId = exports.kMenuId = void 0;
const PaperPrinter_t_1 = require("./types/PaperPrinter_t");
// Menu ID types - UI component identifiers
// Auto-constructed from PaperPrinter_t.ts _id constants
exports.kMenuId = [
    // Top-level menus
    PaperPrinter_t_1.kPrint.id,
    PaperPrinter_t_1.kPage.id,
    PaperPrinter_t_1.kTheme.id,
    PaperPrinter_t_1.kFontSizeId.id,
    // Page submenus
    PaperPrinter_t_1.kPageSizeId.id,
    PaperPrinter_t_1.kOrient.id,
    PaperPrinter_t_1.kMarginId.id,
    // Header/Footer locations
    PaperPrinter_t_1.kHeader.id,
    PaperPrinter_t_1.kFooter.id,
    // Zoom menus
    PaperPrinter_t_1.kZoomOut.id,
    PaperPrinter_t_1.kZoomIn.id,
    PaperPrinter_t_1.kZoomLevel.id,
    // Composed from header/footer + kHeaderFooter positions
    ...PaperPrinter_t_1.kHeaderFooterMenuIds,
];
// Menu Item ID types - Individual menu item identifiers
// Auto-constructed from PaperPrinter_t.ts constants using shared kMenus
exports.kMenuItemId = [
    // System sentinel
    'default',
    // Extract menuItems from all menu constants
    ...PaperPrinter_t_1.kMenus.flatMap(menu => {
        const menuItemIds = menu.menuItems && menu.menuItems.length > 0 ? menu.menuItems.map(item => item.id) : [];
        // If menu has constrained input widget, include menu.id as valid menuItemId (for custom values)
        const hasConstrainedInput = typeof menu.iconSlotTriad.main === 'object' && menu.iconSlotTriad.main.constrain !== undefined;
        if (hasConstrainedInput || menuItemIds.length === 0) {
            // Include menu.id for: text_edit menus OR button-only menus
            return [menu.id, ...menuItemIds];
        }
        else {
            return menuItemIds;
        }
    }),
    // From kHeaderFooter (for header/footer position menus)
    ...PaperPrinter_t_1.kHeaderFooterMenuIds,
    // From kHeaderFooter.subMenuItems (for header/footer content selections)
    ...PaperPrinter_t_1.kHeaderFooter.subMenuItems.map(item => item.id),
];
/**
 * UIMenu - Generic menu component for webview toolbar
 *
 * Creates and manages individual menu instances with items, flyouts, and selection
 * handling. Generates HTML/CSS/JS from YAML templates, manages persistence of
 * selections, and dispatches user interactions to handlers.
 *
 * @input app - Application instance
 * @input id - Unique menu identifier
 * @input displayName - User-visible menu name
 * @input icon - SVG icon for menu button
 * @input menuItems - Function returning menu item definitions
 * @input selectionHandler - Async handler for menu item selections
 * @output HTML menu structure, selection handling, persistent state
 *
 * @example
 * const menu = new UIMenu(app, 'theme', 'Themes', '🎨', false,
 *   () => [{id: 'light', displayName: 'Light'}],
 *   [],
 *   async (id) => ({ id, value: id }));
 */
class UIMenu {
    static kYaml = {
        uimenu_html: '',
        uimenu_item: '',
        uimenu_flyout: '',
        uimenu_generic_handlers: '',
        uimenu_css: '',
        uimenu_text_edit: '',
        uimenu_items_container: '',
    };
    reg;
    fn;
    dx;
    _yaml;
    // Public getter for id
    get id() {
        return this._id;
    }
    _id;
    _displayName;
    _iconSlotTriad;
    _isFlyout;
    _menuItems;
    _flyoutMenuItemIds;
    _selectionHandler;
    constructor(args) {
        // Note: Cannot use dx.require here as Diagnostics is not yet initialized
        if (!args.reg || !args.id || !args.displayName || !args.iconSlotTriad || !args.menuItems || !args.selectionHandler) {
            throw new Error('UIMenu constructor requires reg, id, displayName, iconSlotTriad, menuItems, and selectionHandler');
        }
        const { reg, id, displayName, iconSlotTriad, isFlyout = false, menuItems, flyoutMenuItemIds = [], selectionHandler } = args;
        this.reg = reg;
        this.fn = this.reg.use('yaml.create', 'persist.get', 'persist.set', 'persist.validateDefault', 'utils.templateDictReplace', 'uimenumgr.getValueForMenuItemIdSelected', 'uimenumgr.getMenuById');
        this._id = id;
        this._displayName = displayName;
        this._iconSlotTriad = iconSlotTriad;
        this._isFlyout = isFlyout;
        this._menuItems = menuItems;
        this._flyoutMenuItemIds = flyoutMenuItemIds;
        this._selectionHandler = selectionHandler;
        this.dx = this.fn.dx.sub({ name: 'UIMenu' });
        this._yaml = this.fn.yaml.create({ filePath: 'src/UIMenu.yaml', dataStruct: UIMenu.kYaml });
    }
    yaml() {
        return this._yaml.get();
    }
    // Getters for private properties
    get displayName() {
        return this._displayName;
    }
    get flyoutMenuItemIds() {
        return this._flyoutMenuItemIds;
    }
    get isFlyout() {
        return this._isFlyout;
    }
    // Get the menu items from the injected listBuilder
    getMenuItems() {
        return this._menuItems();
    }
    // Static method to get the default selection ID
    static defaultId() {
        const defaultMenuItemId = 'default';
        return defaultMenuItemId;
    }
    // Instance method to get the default selection ID
    defaultId() {
        return UIMenu.defaultId();
    }
    // Dispatch a selection to this menu's handler
    async dispatchSelection(menuItemId, contextDict = {}) {
        return this._selectionHandler(this._id, menuItemId, contextDict);
    }
    // Get the default item ID for this menu (for default icon 📝)
    async getDefaultItemId() {
        const defaultItemId = await this.fn.persist.validateDefault({
            name: this._id,
            computeFn: async () => {
                const { id } = await this.dispatchSelection(this.defaultId());
                return id;
            },
        });
        return String(defaultItemId);
    }
    // Get the currently selected item ID for this menu (for highlighting ✓)
    async getSelectedItemId() {
        // Get the current persisted value (user's selection)
        let menuItemId = this.fn.persist.get(this._id) || '';
        if (!menuItemId) {
            menuItemId = await this.getDefaultItemId();
        }
        return String(menuItemId);
    }
    // Generate a single menu item HTML
    async getItemHTML(args) {
        const dx = this.dx.sub({ name: 'getItemHTML' });
        dx.require(args, ['item', 'flyout', 'defaultItemId', 'selectedItemId']);
        const { item, flyout, defaultItemId, selectedItemId } = args;
        const yaml = this.yaml(); // This will load and validate automatically
        // Check if this item has a flyout by checking if its ID is in flyoutMenuItemIds
        const menuItemId = item.id;
        const isFlyout = this.flyoutMenuItemIds.includes(menuItemId);
        const flyoutMenuId = isFlyout ? ` data-{{ns_}}flyoutMenuId="${menuItemId}"` : ``;
        const isDefault = menuItemId === defaultItemId;
        const isSelected = menuItemId === selectedItemId;
        // Handle special widget types (e.g., text_edit)
        const iconSlotResult = this.handleIconSlotTypes(item.iconSlotTriad.main, menuItemId);
        // Individual items only need these classes
        const itemClasses = [
            isFlyout ? 'isFlyout' : '',
            isSelected ? 'isSelected' : '',
            isDefault ? 'isDefault' : '',
            iconSlotResult.cssClass || '',
        ]
            .filter(Boolean)
            .join(' ');
        const itemId = isFlyout ? `flyout-${menuItemId}` : menuItemId;
        // DisplayName already contains processed SVG content from PaperPrinter
        const processedDisplayName = item.displayName;
        // Build content with prefix/suffix from iconSlotTriad
        let iconSlotWithPrefixSuffix = ``;
        if (iconSlotResult.html || item.iconSlotTriad.begin || item.iconSlotTriad.end) {
            const prefix = item.iconSlotTriad.begin
                ? `<span class="icon-slot-prefix">${item.iconSlotTriad.begin}</span>`
                : ``;
            const suffix = item.iconSlotTriad.end
                ? `<span class="icon-slot-suffix">${item.iconSlotTriad.end}</span>`
                : ``;
            iconSlotWithPrefixSuffix = prefix + iconSlotResult.html + suffix;
        }
        const replacementDict = {
            itemId,
            itemDisplayName: processedDisplayName,
            itemClasses,
            contentGutterBefore: '', // Content handled by CSS
            contentGutterAfter: '', // Content handled by CSS
            iconSlotWithPrefixSuffix,
            textEditConfigAttr: iconSlotResult.configAttr || ``,
            shortcutCodeAttr: item.shortcutCode ? ` data-{{ns_}}shortcutCode="${item.shortcutCode}"` : ``,
            flyout,
            flyoutMenuId,
        };
        dx.done();
        return this.fn.utils.templateDictReplace(yaml.uimenu_item, replacementDict);
    }
    /**
     * Build button content from iconSlotTriad
     */
    buildButtonContent() {
        const iconSlotResult = this.handleIconSlotTypes(this._iconSlotTriad.main, this._id);
        const content = iconSlotResult.html;
        const begin = this._iconSlotTriad.begin
            ? `<span class="icon-slot-prefix">${this._iconSlotTriad.begin}</span>`
            : ``;
        const end = this._iconSlotTriad.end
            ? `<span class="icon-slot-suffix">${this._iconSlotTriad.end}</span>`
            : ``;
        return begin + content + end;
    }
    /**
     * Build constrain data attributes from iconSlotTriad.main.constrain
     * Returns undefined if no constrain property present
     */
    handleIconSlotTypes_main_constrain(iconSlotTriadMain) {
        if (!iconSlotTriadMain.constrain) {
            return undefined;
        }
        // Validate regex pattern
        try {
            void new RegExp(iconSlotTriadMain.constrain.regex);
        }
        catch (regexError) {
            this.dx.error(`Invalid constrain.regex: ${iconSlotTriadMain.constrain.regex}`);
            throw new Error(`Invalid constrain.regex: ${iconSlotTriadMain.constrain.regex}`);
        }
        // Build data attributes from constrain object (all three work together)
        return [
            ` data-{{ns_}}constrain_regex="${iconSlotTriadMain.constrain.regex}"`,
            ` data-{{ns_}}constrain_min="${iconSlotTriadMain.constrain.min}"`,
            ` data-{{ns_}}constrain_max="${iconSlotTriadMain.constrain.max}"`,
        ].join('');
    }
    /**
     * Calculate width style from iconSlotTriad.main.width or auto-calculate from constrain.max
     * Returns undefined if no width or constrain present
     */
    handleIconSlotTypes_main_width(iconSlotTriadMain) {
        let width = iconSlotTriadMain.width;
        // If no explicit width, try to auto-calculate from constrain.max
        if (!width && iconSlotTriadMain.constrain) {
            const maxDigits = String(iconSlotTriadMain.constrain.max).length;
            width = `${maxDigits + 1}ch`;
        }
        if (!width) {
            return undefined;
        }
        return ` style="width: ${width};"`;
    }
    /**
     * Get initial value from persistence and apply transform.display if defined
     * Returns undefined if no persisted value present
     */
    handleIconSlotTypes_main_transform(iconSlotTriadMain) {
        const dx = this.dx.sub({ name: 'handleIconSlotTypes_main_transform' });
        let value = undefined;
        try {
            const persistedValue = this.fn.uimenumgr.getValueForMenuItemIdSelected(this._id);
            if (persistedValue === undefined || persistedValue === null) {
                dx.out(`No persisted value for ${this._id}`);
                dx.done();
                return undefined;
            }
            dx.out(`Transform for ${this._id}: value=${persistedValue}, type=${typeof persistedValue}`);
            // Pass value to transform as-is (string | number | undefined)
            // Transform functions handle their own type conversion
            if (iconSlotTriadMain.transform?.display) {
                try {
                    const displayValue = iconSlotTriadMain.transform.display(persistedValue);
                    value = String(displayValue ?? '');
                    dx.out(`Transform value set to: ${value} (from persist: ${persistedValue})`);
                }
                catch (error) {
                    dx.error(`Failed to evaluate transform.display: ${String(error)}`);
                    // On error, preserve exactly what was persisted
                    value = String(persistedValue);
                }
            }
            else {
                // No transform.display: display == persisted representation
                value = String(persistedValue);
                dx.out(`Transform value (no display): ${value}`);
            }
        }
        catch (error) {
            // If menu lookup fails (e.g., in test scenarios), just return undefined
            dx.out(`Could not get value for ${this._id}: ${String(error)}`);
        }
        dx.done();
        return value;
    }
    /**
     * Render text_edit type with constrain, width, and value
     */
    handleIconSlotTypes_main_text_edit(itemId, constrain, width, value) {
        const dx = this.dx.sub({ name: 'handleIconSlotTypes_main_text_edit' });
        if (!constrain) {
            dx.error('text_edit requires constrain');
            dx.done();
            return {
                html: '',
                cssClass: '',
                configAttr: '',
            };
        }
        try {
            const yaml = this.yaml();
            const html = this.fn.utils.templateDictReplace(yaml.uimenu_text_edit, {
                itemId,
                constrain,
                width: width ?? '',
                value: value ? ` value="${value}"` : '',
            });
            dx.done();
            return {
                html,
                cssClass: 'text-edit',
                configAttr: constrain,
            };
        }
        catch (error) {
            dx.error(`Failed to process text_edit config: ${String(error)}`);
            dx.done();
            return {
                html: '',
                cssClass: '',
                configAttr: '',
            };
        }
    }
    /**
     * Handle different iconSlotTriad.main types (text_edit, text_static, etc.)
     * Returns HTML, CSS class, and config attributes for the main slot content
     */
    handleIconSlotTypes(iconSlotTriadMain, itemId) {
        const dx = this.dx.sub({ name: 'handleIconSlotTypes' });
        try {
            // Default return for regular icon content
            let returnVals = {
                html: typeof iconSlotTriadMain === 'string' && iconSlotTriadMain
                    ? `<span class="iconSlotTriad">${iconSlotTriadMain}</span>`
                    : ``,
                cssClass: ``,
                configAttr: ``,
            };
            if (iconSlotTriadMain) {
                // Handle object types - gather data then dispatch by type
                if (typeof iconSlotTriadMain === 'object' && iconSlotTriadMain?.type) {
                    const constrain = this.handleIconSlotTypes_main_constrain(iconSlotTriadMain);
                    const width = this.handleIconSlotTypes_main_width(iconSlotTriadMain);
                    const value = this.handleIconSlotTypes_main_transform(iconSlotTriadMain);
                    if (iconSlotTriadMain.type === 'text_edit') {
                        returnVals = this.handleIconSlotTypes_main_text_edit(itemId, constrain, width, value);
                    }
                }
            }
            return returnVals;
        }
        finally {
            dx.done();
        }
    }
    // Generate the complete HTML for this menu using YAML template
    // Recursively generates flyouts on-demand
    async getHTML(visited = new Set()) {
        // Prevent infinite loops
        if (visited.has(this._id)) {
            this.dx.out(`Cycle detected for menu ${this._id}, skipping`);
            return `<!-- Cycle detected: ${this._id} -->`;
        }
        visited.add(this._id);
        try {
            const yaml = this.yaml(); // This will load and validate automatically
            // Generate flyout HTML for any menu items that have flyouts
            const flyoutCache = {};
            for (const flyoutMenuItemId of this.flyoutMenuItemIds) {
                try {
                    const flyoutMenu = this.fn.uimenumgr.getMenuById(flyoutMenuItemId);
                    const flyoutHtml = await flyoutMenu.getHTML(visited);
                    flyoutCache[flyoutMenuItemId] = flyoutHtml;
                }
                catch (error) {
                    this.dx.out(`ERROR generating flyout ${flyoutMenuItemId} for menu ${this._id}: ${String(error)}`);
                    flyoutCache[flyoutMenuItemId] = `<!-- ERROR: ${error} -->`;
                }
            }
            // Generate menu items HTML using the new getItemHTML function
            const menuItemsList = this.getMenuItems();
            if (this.isFlyout) {
                this.dx.out(`Flyout ${this._id}: Got ${menuItemsList.length} menu items`);
            }
            const defaultItemId = await this.getDefaultItemId(); // Get default item for 📝 icon
            const selectedItemId = await this.getSelectedItemId(); // Get selected item for ✓ highlighting
            const hasDefaultItem = !!defaultItemId;
            // Use explicit properties instead of calculated values
            const isFlyout = this.isFlyout;
            const hasFlyout = this.flyoutMenuItemIds.length > 0;
            // Determine gutter states upfront - this is all we need for CSS
            const hasGutterBefore = hasDefaultItem; // Only if there's a default item
            const hasGutterAfter = hasFlyout || hasDefaultItem; // Menus with flyout items OR default items get gutter-after
            const processedMenuItemsHtml = await Promise.all(menuItemsList.map(item => this.getItemHTML({ item, flyout: flyoutCache[item.id] || '', defaultItemId, selectedItemId })));
            const menuItems = processedMenuItemsHtml.join('\n');
            const hasItems = menuItemsList.length > 0;
            // Build CSS classes for menu container - only what we need
            const menuClasses = [
                isFlyout ? 'isFlyout' : '',
                hasGutterBefore ? 'has-gutter-before' : '',
                hasGutterAfter ? 'has-gutter-after' : '',
            ]
                .filter(Boolean)
                .join(' ');
            // Use the main template for all menus
            const template = yaml.uimenu_html;
            // Get shortcutCode from menu constant if it exists
            const menuConst = PaperPrinter_t_1.kMenus.find(m => m.id === this._id);
            const shortcutCode = menuConst?.shortcutCode;
            const shortcutCodeAttr = shortcutCode ? ` data-{{ns_}}shortcutCode="${shortcutCode}"` : ``;
            // Build button content from iconSlotTriad
            const buttonContent = this.buildButtonContent();
            const replacementDict = {
                menuId: this._id,
                displayName: this.displayName,
                icon: buttonContent,
                menuItems: hasItems ? menuItems : '', // Empty string if no items
                menuItemsContainer: hasItems
                    ? this.fn.utils.templateDictReplace(this.yaml().uimenu_items_container, {
                        menuId: this._id,
                        menuItems,
                    })
                    : '', // Only create container if there are items
                menuClasses,
                shortcutCodeAttr,
            };
            const result = this.fn.utils.templateDictReplace(template, replacementDict);
            visited.delete(this._id); // Remove from visited set after successful generation
            return result;
        }
        catch (error) {
            visited.delete(this._id); // Always remove from visited set on error
            throw error;
        }
    }
    done() {
        this.dx.done();
    }
}
exports.UIMenu = UIMenu;
// end, UIMenu.ts
//# sourceMappingURL=UIMenu.js.map