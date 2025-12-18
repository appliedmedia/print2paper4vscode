import type { Registry } from './Registry';
import type { contextDict_t } from './types/UI_t';
import { Diagnostics } from './Diagnostics';
import { YamlInstance } from './Yaml';
import type { FnImport_t } from './types/Registry_t';
import { kMenus } from './types/PaperPrinter_t';
import type {
  iconSlotTriad_main_t,
  iconSlotTriad_t,
  UIMenuItem_t,
  MenuId_t,
  MenuItemId_t,
  HandleSelection_t,
} from './types/UIMenu_t';

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
export class UIMenu {
  private static readonly kYaml = {
    uimenu_html: '',
    uimenu_item: '',
    uimenu_flyout: '',
    uimenu_generic_handlers: '',
    uimenu_css: '',
    uimenu_text_edit: '',
    uimenu_items_container: '',
  } as const;

  private reg: Registry;
  private fn: FnImport_t;
  private dx: Diagnostics;
  private _yaml: YamlInstance<typeof UIMenu.kYaml>;

  // Public getter for id
  get id(): MenuId_t {
    return this._id;
  }

  private _id: MenuId_t;
  private _displayName: string;
  private _iconSlotTriad: iconSlotTriad_t;
  private _isFlyout: boolean;
  private _menuItems: () => UIMenuItem_t[];
  private _flyoutMenuItemIds: string[];
  private _selectionHandler: (
    menuId: MenuId_t,
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t
  ) => Promise<HandleSelection_t>;

  constructor(args: {
    reg: Registry;
    id: MenuId_t;
    displayName: string;
    iconSlotTriad: iconSlotTriad_t;
    isFlyout?: boolean;
    menuItems: () => UIMenuItem_t[];
    flyoutMenuItemIds?: string[];
    selectionHandler: (
      menuId: MenuId_t,
      menuItemId: MenuItemId_t,
      contextDict: contextDict_t
    ) => Promise<HandleSelection_t>;
  }) {
    this.reg = args.reg;
    this.fn = this.reg.use(
      'yaml.create',
      'persist.get',
      'persist.set',
      'persist.validateDefault',
      'utils.templateDictReplace',
      'utils.htmlEscape',
      'uimenumgr.getValueOfMenuItemIdSelected',
      'uimenumgr.getMenuById'
    );
    this.dx = this.fn.dx.sub({ name: 'UIMenu' });

    // Validate args using dx.require
    if (
      !this.dx.require(args, [
        'reg',
        'id',
        'displayName',
        'iconSlotTriad',
        'menuItems',
        'selectionHandler',
      ])
    ) {
      throw new Error('UIMenu constructor: invalid arguments');
    }

    const {
      id,
      displayName,
      iconSlotTriad,
      isFlyout = false,
      menuItems,
      flyoutMenuItemIds = [],
      selectionHandler,
    } = args;

    this._id = id;
    this._displayName = displayName;
    this._iconSlotTriad = iconSlotTriad;
    this._isFlyout = isFlyout;
    this._menuItems = menuItems;
    this._flyoutMenuItemIds = flyoutMenuItemIds;
    this._selectionHandler = selectionHandler;
    this._yaml = this.fn.yaml.create({ filePath: 'src/UIMenu.yaml', dataStruct: UIMenu.kYaml });
  }

  yaml() {
    return this._yaml.get();
  }

  // Getters for private properties
  get displayName(): string {
    return this._displayName;
  }
  get flyoutMenuItemIds(): string[] {
    return this._flyoutMenuItemIds;
  }
  get isFlyout(): boolean {
    return this._isFlyout;
  }

  // Get the menu items from the injected listBuilder
  getMenuItems(): UIMenuItem_t[] {
    return this._menuItems();
  }

  // Static method to get the default selection ID
  static defaultId(): MenuItemId_t {
    const defaultMenuItemId: MenuItemId_t = 'default';
    return defaultMenuItemId;
  }

  // Instance method to get the default selection ID
  defaultId(): MenuItemId_t {
    return UIMenu.defaultId();
  }

  // Dispatch a selection to this menu's handler
  async dispatchSelection(
    menuItemId: MenuItemId_t,
    contextDict: contextDict_t = {}
  ): Promise<HandleSelection_t> {
    return this._selectionHandler(this._id, menuItemId, contextDict);
  }

  // Get the default item ID for this menu (for default icon 📝)
  async getDefaultItemId(): Promise<string> {
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
  async getSelectedItemId(): Promise<string> {
    // Get the current persisted value (user's selection)
    let menuItemId = this.fn.persist.get(this._id) || '';
    if (!menuItemId) {
      menuItemId = await this.getDefaultItemId();
    }
    return String(menuItemId);
  }

  // Generate a single menu item HTML
  async getItemHTML(args: {
    item: UIMenuItem_t;
    flyout: string;
    defaultItemId: string;
    selectedItemId: string;
  }): Promise<string> {
    const dx = this.dx.sub({ name: 'getItemHTML' });
    dx.require(args, ['item', 'flyout', 'defaultItemId', 'selectedItemId']);
    const { item, flyout, defaultItemId, selectedItemId } = args;
    const yaml = this.yaml(); // This will load and validate automatically

    // Check if this item has a flyout by checking if its ID is in flyoutMenuItemIds
    const menuItemId = item.id;
    // Flyout menu IDs are already in full format (e.g., "header_begin") in flyoutMenuItemIds
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
  private buildButtonContent(): string {
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
  private handleIconSlotTypes_main_constrain(
    iconSlotTriadMain: iconSlotTriad_main_t
  ): string | undefined {
    let result: string | undefined = undefined;

    if (iconSlotTriadMain.constrain) {
      // Validate regex pattern
      try {
        void new RegExp(iconSlotTriadMain.constrain.regex);
        // Build data attributes from constrain object (all three work together)
        result = [
          ` data-{{ns_}}constrain_regex="${iconSlotTriadMain.constrain.regex}"`,
          ` data-{{ns_}}constrain_min="${iconSlotTriadMain.constrain.min}"`,
          ` data-{{ns_}}constrain_max="${iconSlotTriadMain.constrain.max}"`,
        ].join('');
      } catch (regexError) {
        const message = `ERROR: ${regexError} - Invalid constrain.regex: ${iconSlotTriadMain.constrain.regex}`;
        this.dx.error(message);
        throw new Error(message);
      }
    }

    return result;
  }

  /**
   * Calculate width style from iconSlotTriad.main.width or auto-calculate from constrain.max
   * Returns undefined if no width or constrain present
   */
  private handleIconSlotTypes_main_width(
    iconSlotTriadMain: iconSlotTriad_main_t
  ): string | undefined {
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
  private handleIconSlotTypes_main_transform(
    iconSlotTriadMain: iconSlotTriad_main_t
  ): string | undefined {
    const dx = this.dx.sub({ name: 'handleIconSlotTypes_main_transform' });
    let value: string | undefined = undefined;

    try {
      const persistedValue = this.fn.uimenumgr.getValueOfMenuItemIdSelected(this._id);

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
        } catch (error) {
          dx.error(`Failed to evaluate transform.display: ${String(error)}`);
          // On error, preserve exactly what was persisted
          value = String(persistedValue);
        }
      } else {
        // No transform.display: display == persisted representation
        value = String(persistedValue);
        dx.out(`Transform value (no display): ${value}`);
      }
    } catch (error) {
      // If menu lookup fails (e.g., in test scenarios), just return undefined
      dx.out(`Could not get value for ${this._id}: ${String(error)}`);
    }

    dx.done();
    return value;
  }

  /**
   * Render text_edit type with constrain, width, and value
   */
  private handleIconSlotTypes_main_text_edit(
    itemId: string,
    constrain: string | undefined,
    width: string | undefined,
    value: string | undefined
  ): {
    html: string;
    cssClass: string;
    configAttr: string;
  } {
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
      // Security: HTML-escape value to prevent XSS in webview
      const escapedValue = value ? this.fn.utils.htmlEscape(String(value)) : '';
      const html = this.fn.utils.templateDictReplace(yaml.uimenu_text_edit, {
        itemId,
        constrain,
        width: width ?? '',
        value: value ? ` value="${escapedValue}"` : '',
      });
      dx.done();
      return {
        html,
        cssClass: 'text-edit',
        configAttr: constrain,
      };
    } catch (error) {
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
  private handleIconSlotTypes(
    iconSlotTriadMain: string | iconSlotTriad_main_t,
    itemId: string
  ): {
    html: string;
    cssClass: string;
    configAttr: string;
  } {
    const dx = this.dx.sub({ name: 'handleIconSlotTypes' });

    try {
      // Default return for regular icon content
      let returnVals = {
        html:
          typeof iconSlotTriadMain === 'string' && iconSlotTriadMain
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
    } finally {
      dx.done();
    }
  }

  // Generate the complete HTML for this menu using YAML template
  // Recursively generates flyouts on-demand
  async getHTML(visited: Set<string> = new Set()): Promise<string> {
    // Prevent infinite loops
    if (visited.has(this._id)) {
      this.dx.out(`Cycle detected for menu ${this._id}, skipping`);
      return `<!-- Cycle detected: ${this._id} -->`;
    }
    visited.add(this._id);

    try {
      const yaml = this.yaml(); // This will load and validate automatically

      // Generate flyout HTML for any menu items that have flyouts
      const flyoutCache: Record<string, string> = {};
      for (const flyoutMenuItemId of this.flyoutMenuItemIds) {
        const flyoutMenu = this.fn.uimenumgr.getMenuById(flyoutMenuItemId);
        const flyoutHtml = await flyoutMenu.getHTML(visited);
        flyoutCache[flyoutMenuItemId] = flyoutHtml;
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
      const processedMenuItemsHtml = await Promise.all(
        menuItemsList.map(item =>
          this.getItemHTML({
            item,
            flyout: flyoutCache[item.id] || '',
            defaultItemId,
            selectedItemId,
          })
        )
      );
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
      const menuConst = kMenus.find(m => m.id === this._id);
      const shortcutCode = (menuConst as { shortcutCode?: string })?.shortcutCode;
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
    } catch (error) {
      visited.delete(this._id); // Always remove from visited set on error
      throw error;
    }
  }

  done(): void {
    this.dx.done();
  }
}

// end, UIMenu.ts
