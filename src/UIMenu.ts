import type { App } from './App';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class UIMenu {
  private dx: Diagnostics;
  private _yaml: {
    ui_menu_html: string;
    ui_menu_item: string;
    ui_flyout: string;
    ui_menu_generic_handlers: string;
    ui_menu_css: string;
  } = {
    ui_menu_html: '',
    ui_menu_item: '',
    ui_flyout: '',
    ui_menu_generic_handlers: '',
    ui_menu_css: '',
  };

  constructor(
    private app: App,
    private _id: string,
    private _displayName: string,
    private _icon: string,
    private _isFlyout: boolean = false,
    private _menuItems: () => UIMenuItem[],
    private _flyoutMenuItemIds: string[] = [],
    private _selectionHandler: (id: string) => Promise<string>
  ) {
    this.dx = this.app.dx.create('UIMenu');
  }

  init(): void {
    // No initialization needed
  }

  // Getters for private properties
  get id(): string {
    return this._id;
  }
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
  getMenuItems(): UIMenuItem[] {
    return this._menuItems();
  }

  // Static method to get the default selection ID
  static defaultId(): string {
    return 'default';
  }

  // Instance method to get the default selection ID
  defaultId(): string {
    return UIMenu.defaultId();
  }

  // Dispatch a selection to this menu's handler
  async dispatchSelection(id: string): Promise<string> {
    return this._selectionHandler(id);
  }

  // Get the default item ID for this menu
  async defaultItem(): Promise<string> {
    return this.dispatchSelection(this.defaultId());
  }

  // Getter for the YAML data - handles loading and validation automatically
  get yaml() {
    // If already loaded, return it
    if (this._yaml.ui_menu_html) {
      return this._yaml;
    }

    // Load and cache the YAML
    const yaml = this.app.os.fileRead<{
      ui_menu_html: string;
      ui_menu_item: string;
      ui_flyout: string;
      ui_menu_generic_handlers: string;
      ui_menu_css: string;
    }>('src/UIMenu.yaml');

    if (!yaml) {
      throw new Error('Failed to load UIMenu yaml');
    }

    // Cache it
    this._yaml = yaml;
    return this._yaml;
  }

  // Generate a single menu item HTML
  async getItemHTML(item: UIMenuItem, flyout: string, defaultItemId: string): Promise<string> {
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

    // Handle SVG template replacement for displayName
    let processedDisplayName = item.displayName;
    if (processedDisplayName.includes('{{svg:')) {
      // Load PaperPrinter YAML for SVG icons
      const paperPrinterYaml = this.app.os.fileRead<{
        portrait_icon: string;
        landscape_icon: string;
      }>('src/PaperPrinter.yaml');

      if (paperPrinterYaml) {
        processedDisplayName = processedDisplayName
          .replace(/\{\{svg:portrait_icon\}\}/g, paperPrinterYaml.portrait_icon)
          .replace(/\{\{svg:landscape_icon\}\}/g, paperPrinterYaml.landscape_icon);
      }
    }

    const replacementDict = {
      ITEM_ID: itemId,
      ITEM_DISPLAY_NAME: processedDisplayName,
      ITEM_CLASSES: itemClasses,
      CONTENT_GUTTER_BEFORE: '', // Content handled by CSS
      CONTENT_GUTTER_AFTER: '', // Content handled by CSS
      FLYOUT: flyout,
      FLYOUT_MENU_ID_REF: flyoutMenuIdRef,
    };

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
    const defaultItemId = await this.defaultItem(); // Get default once

    // Use explicit properties instead of calculated values
    const isFlyout = this.isFlyout;
    const hasFlyout = this.flyoutMenuItemIds.length > 0;

    // Determine gutter states upfront - this is all we need for CSS
    const hasGutterBefore = defaultItemId !== ''; // Only if there's a default selection
    const hasGutterAfter = hasFlyout; // Only menus with flyout items get gutter-after
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
