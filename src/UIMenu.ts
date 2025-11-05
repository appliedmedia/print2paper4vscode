import type { App } from './App';
import { Diagnostics } from './Diagnostics';
import { Persist, type Persist_t } from './Persist';
import { Yaml } from './Yaml';
import {
  kPageSizeId,
  kOrient,
  kMarginId,
  kFontSizeId,
  kHeaderFooter,
  kHeaderFooterMenuIds,
  kPrint,
  kPage,
  kTheme,
  kHeader,
  kFooter,
  kZoomOut,
  kZoomIn,
  kZoomLevel,
} from './types/PaperPrinter_t';

// UIMenuItem type - menu item structure
export interface UIMenuItem_t {
  id: string;
  displayName: string;
  icon?: string;
  attributes?: Record<string, string>;
}

// Menu ID types - UI component identifiers
// Auto-constructed from PaperPrinter_t.ts _id constants
export const kMenuId = [
  // Top-level menus
  kPrint.id,
  kPage.id,
  kTheme.id,
  kFontSizeId.id,
  // Page submenus
  kPageSizeId.id,
  kOrient.id,
  kMarginId.id,
  // Header/Footer locations
  kHeader.id,
  kFooter.id,
  // Zoom menus
  kZoomOut.id,
  kZoomIn.id,
  kZoomLevel.id,
  // Composed from header/footer + kHeaderFooter positions
  ...kHeaderFooterMenuIds,
] as const;

export type MenuId_t = (typeof kMenuId)[number];

// Menu Item ID types - Individual menu item identifiers
// Auto-constructed from PaperPrinter_t.ts constants
export const kMenuItemId = [
  // System sentinel
  'default',
  // Print actions
  ...kPrint.menuItems.map(item => item.id),
  // From kPage menuItems
  ...kPage.menuItems.map(item => item.id),
  // From kOrient menuItems
  ...kOrient.menuItems.map(item => item.id),
  // From kHeaderFooter (for header/footer position menus)
  ...kHeaderFooterMenuIds,
  // From kHeaderFooter.subMenuItems (for header/footer content selections)
  ...kHeaderFooter.subMenuItems.map(item => item.id),
  // From kMarginId menuItems
  ...kMarginId.menuItems.map(item => item.id),
  // From kPageSizeId menuItems
  ...kPageSizeId.menuItems.map(item => item.id),
  // From kFontSizeId menuItems
  ...kFontSizeId.menuItems.map(item => item.id),
  // From kZoomLevel menuItems
  ...kZoomLevel.menuItems.map(item => item.id),
] as const;

export type MenuItemId_t = (typeof kMenuItemId)[number] | string;

// Selection handler return type - id is what's selected, value is what to use
export interface HandleSelection_t {
  id: string;
  value: string | number | boolean;
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
    uimenu_html: '',
    uimenu_item: '',
    uimenu_flyout: '',
    uimenu_generic_handlers: '',
    uimenu_css: '',
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
    private _selectionHandler: (
      menuId: MenuId_t,
      menuItemId: MenuItemId_t
    ) => Promise<HandleSelection_t>
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
  async dispatchSelection(menuItemId: MenuItemId_t): Promise<HandleSelection_t> {
    return this._selectionHandler(this._id, menuItemId);
  }

  // Get the default item ID for this menu (for default icon 📝)
  async getDefaultItemId(): Promise<string> {
    const defaultItemId = await this.persist.validateDefault(this._id, async () => {
      const { id } = await this.dispatchSelection(this.defaultId());
      return id;
    });

    return String(defaultItemId);
  }

  // Get the currently selected item ID for this menu (for highlighting ✓)
  async getSelectedItemId(): Promise<string> {
    // Get the current persisted value (user's selection)
    let menuItemId = this.persist[this._id as keyof typeof this.persist] || '';
    if (!menuItemId) {
      menuItemId = await this.getDefaultItemId();
    }
    return String(menuItemId);
  }

  // Generate a single menu item HTML
  async getItemHTML(
    item: UIMenuItem_t,
    flyout: string,
    defaultItemId: string,
    selectedItemId: string
  ): Promise<string> {
    const dx = this.dx.sub('getItemHTML');
    const yaml = this.yaml; // This will load and validate automatically

    // Check if this item has a flyout by checking if its ID is in flyoutMenuItemIds
    const menuItemId = item.id;
    const isFlyout = this.flyoutMenuItemIds.includes(menuItemId);
    const flyoutMenuIdRef = isFlyout ? ` flyout-menu-id-ref="${menuItemId}"` : '';
    const isDefault = menuItemId === defaultItemId;
    const isSelected = menuItemId === selectedItemId;

    // Individual items only need these classes
    const itemClasses = [
      isFlyout ? 'is-flyout' : '',
      isSelected ? 'selected' : '',
      isDefault ? 'default-item' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const itemId = isFlyout ? `flyout-${menuItemId}` : menuItemId;

    // DisplayName already contains processed SVG content from PaperPrinter
    const processedDisplayName = item.displayName;

    const replacementDict = {
      itemId,
      itemDisplayName: processedDisplayName,
      itemClasses,
      contentGutterBefore: '', // Content handled by CSS
      contentGutterAfter: '', // Content handled by CSS
      flyout,
      flyoutMenuIdRef,
    };

    dx.done();
    return this.app.templateDictReplace(yaml.uimenu_item, replacementDict);
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
      const yaml = this.yaml; // This will load and validate automatically

      // Generate flyout HTML for any menu items that have flyouts
      const flyoutCache: Record<string, string> = {};
      for (const flyoutMenuItemId of this.flyoutMenuItemIds) {
        try {
          const flyoutMenu = this.app.uimenumgr.getMenuById(flyoutMenuItemId);
          const flyoutHtml = await flyoutMenu.getHTML(visited);
          flyoutCache[flyoutMenuItemId] = flyoutHtml;
        } catch (error) {
          this.dx.out(
            `ERROR generating flyout ${flyoutMenuItemId} for menu ${this._id}: ${String(error)}`
          );
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
      const processedMenuItemsHtml = await Promise.all(
        menuItemsList.map(item =>
          this.getItemHTML(item, flyoutCache[item.id] || '', defaultItemId, selectedItemId)
        )
      );
      const menuItems = processedMenuItemsHtml.join('\n');
      const hasItems = menuItemsList.length > 0;

      // Build CSS classes for menu container - only what we need
      const menuClasses = [
        isFlyout ? 'is-flyout' : '',
        hasGutterBefore ? 'has-gutter-before' : '',
        hasGutterAfter ? 'has-gutter-after' : '',
      ]
        .filter(Boolean)
        .join(' ');
      // Use the main template for all menus
      const template = yaml.uimenu_html;

      const replacementDict = {
        menuId: this._id,
        displayName: this.displayName,
        icon: this.icon,
        menuItems: hasItems ? menuItems : '', // Empty string if no items
        menuItemsContainer: hasItems ? `<div class="p2p4vsc-menu-items" id="${this._id}-items">${menuItems}</div>` : '', // Only create container if there are items
        menuClasses,
      };

      const result = this.app.templateDictReplace(template, replacementDict);
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
