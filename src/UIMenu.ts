import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import { Persist, type Persist_t } from './Persist';
import { Yaml } from './Yaml';

// UIMenuItem type - menu item structure
export interface UIMenuItem_t {
  id: string;
  displayName: string;
  icon?: string;
  attributes?: Record<string, string>;
}

// Menu ID types - UI component identifiers
export const kMenuId = [
  'print',
  'page',
  'pageSizeId',
  'orient',
  'marginId',
  'theme',
  'fontSizeId',
] as const;

export type MenuId_t = (typeof kMenuId)[number];

// Menu Item ID types - Individual menu item identifiers
export const kMenuItemId = [
  'default', // Special sentinel for requesting default selection
  'preview',
  'direct',
  'save',
  'size',
  'orient',
  'margin',
  'portrait',
  'landscape',
  'none',
  'minimal',
  'normal',
  'wide',
  '8',
  '9',
  '10',
  '12',
  '14',
  '18',
  '24',
] as const;

export type MenuItemId_t = (typeof kMenuItemId)[number];

// Selection handler return type - id is what's selected, value is what to use
export interface HandleSelection_t {
  id: string;
  value: string | number | boolean;
}

// Type guards for runtime validation
export function isMenuId(id: string): id is MenuId_t {
  return kMenuId.includes(id as MenuId_t);
}

export function isMenuItemId(id: string): id is MenuItemId_t {
  return kMenuItemId.includes(id as MenuItemId_t);
}

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
    ui_menu_html: '',
    ui_menu_item: '',
    ui_flyout: '',
    ui_menu_generic_handlers: '',
    ui_menu_css: '',
  } as const;

  private dx: Diagnostics;
  public persist: Persist & Persist_t;
  private _yaml: Yaml<typeof UIMenu.kYaml>;

  // Public getter for id
  get id(): MenuId_t {
    return this._id;
  }

  constructor(
    private app: App,
    private _id: MenuId_t,
    private _displayName: string,
    private _icon: string,
    private _isFlyout: boolean = false,
    private _menuItems: () => UIMenuItem_t[],
    private _flyoutMenuItemIds: string[] = [],
    private _selectionHandler: (id: MenuItemId_t) => Promise<HandleSelection_t>
  ) {
    this.persist = new Persist(app) as Persist & Persist_t;
    this.dx = this.app.dx.create('UIMenu');
    this._yaml = new Yaml(app, 'src/UIMenu.yaml', UIMenu.kYaml);

    // Register persist property (no value set yet)
    this.persist.register(this._id);
  }

  get yaml() {
    return this._yaml.get();
  }

  init(): void {
    // No initialization needed
  }

  // Getters for private properties
  get icon(): string {
    return this._icon;
  }
  get displayName(): string {
    return this._displayName;
  }
  get flyoutMenuItemIds(): string[] {
    return this._flyoutMenuItemIds;
  }
  get isFlyout(): boolean {
    return this._isFlyout;
  }

  // Get the menu element ID for JavaScript
  getId_Menu(): string {
    return this.id;
  }

  // Get the button ID for JavaScript
  getId_Button(): string {
    return `${this.id}-btn`;
  }

  // Get the template variable name for this menu's items
  getTemplateVariableName(): string {
    return `${this.id.toUpperCase()}_MENU_ITEMS`;
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
  async dispatchSelection(id: MenuItemId_t): Promise<HandleSelection_t> {
    return this._selectionHandler(id);
  }

  // Get the default item ID for this menu (for UI highlighting)
  async getDefaultItemId(): Promise<MenuItemId_t> {
    // Check if we have a stored default value
    const storedDefault = this.persist.getDefault(this._id);

    if (storedDefault !== undefined) {
      return String(storedDefault) as MenuItemId_t;
    }

    // No stored default, dispatch to selection handler to compute default
    const { id: defaultItemId } = await this.dispatchSelection(this.defaultId());

    // Store the computed default
    this.persist.setDefault(this._id, defaultItemId);

    return defaultItemId as MenuItemId_t;
  }

  // Generate a single menu item HTML
  async getItemHTML(item: UIMenuItem_t, flyout: string, defaultItemId: string): Promise<string> {
    const dx = this.dx.sub('getItemHTML');
    const yaml = this.yaml; // This will load and validate automatically

    // Check if this item has a flyout by checking if its ID is in flyoutMenuItemIds
    const id = item.id;
    const isFlyout = this.flyoutMenuItemIds.includes(id);
    const flyoutMenuIdRef = isFlyout ? ` flyout-menu-id-ref="${id}"` : '';
    const isDefault = id === defaultItemId;

    // Individual items only need these classes
    const itemClasses = [
      isFlyout ? 'is-flyout' : '',
      isDefault ? 'selected' : '',
      isDefault ? 'default-item' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const itemId = isFlyout ? `flyout-${id}` : id;

    // DisplayName already contains processed SVG content from PaperPrinter
    const processedDisplayName = item.displayName;

    const replacementDict = {
      ITEM_ID: itemId,
      ITEM_DISPLAY_NAME: processedDisplayName,
      ITEM_CLASSES: itemClasses,
      CONTENT_GUTTER_BEFORE: '', // Content handled by CSS
      CONTENT_GUTTER_AFTER: '', // Content handled by CSS
      FLYOUT: flyout,
      FLYOUT_MENU_ID_REF: flyoutMenuIdRef,
    };

    dx.done();
    return this.app.templateDictReplace(yaml.ui_menu_item, replacementDict);
  }

  // Generate the complete HTML for this menu using YAML template
  async getHTML(flyoutCache: Record<string, string> = {}): Promise<string> {
    this.dx.out(`UIMenu.getHTML called for ${this.id}`);
    this.dx.out(`Icon: "${this.icon}", DisplayName: "${this.displayName}"`);

    const yaml = this.yaml; // This will load and validate automatically
    this.dx.out(`YAML loaded, ui_menu_html length: ${yaml.ui_menu_html.length}`);

    // Generate menu items HTML using the new getItemHTML function
    const menuItems = this.getMenuItems();
    const defaultItemId = await this.getDefaultItemId(); // Get default item once
    const hasDefaultItem = !!defaultItemId;

    // Use explicit properties instead of calculated values
    const isFlyout = this.isFlyout;
    const hasFlyout = this.flyoutMenuItemIds.length > 0;

    // Determine gutter states upfront - this is all we need for CSS
    const hasGutterBefore = hasDefaultItem; // Only if there's a default item
    const hasGutterAfter = hasFlyout || hasDefaultItem; // Menus with flyout items OR default items get gutter-after
    const processedMenuItemsHtml = await Promise.all(
      menuItems.map(item => this.getItemHTML(item, flyoutCache[item.id] || '', defaultItemId))
    );
    const menuItemsHtml = processedMenuItemsHtml.join('\n');

    // Build CSS classes for menu container - only what we need
    const menuClasses = [
      isFlyout ? 'is-flyout' : '',
      hasGutterBefore ? 'has-gutter-before' : '',
      hasGutterAfter ? 'has-gutter-after' : '',
    ]
      .filter(Boolean)
      .join(' ');
    // Use the main template for all menus
    const template = yaml.ui_menu_html;

    const replacementDict = {
      MENU_ID: this.getId_Menu(),
      BUTTON_ID: this.getId_Button(),
      DISPLAY_NAME: this.displayName,
      ICON: this.icon,
      MENU_ITEMS: menuItemsHtml,
      MENU_CLASSES: menuClasses,
    };

    const result = this.app.templateDictReplace(template, replacementDict);

    this.dx.out(`Generated HTML for ${this.id}: ${result.substring(0, 100)}...`);
    return result;
  }

  done(): void {
    this.dx.done();
  }
}

// end, UIMenu.ts
