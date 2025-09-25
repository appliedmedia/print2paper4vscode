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
    private _id: string,
    private _icon: string,
    private _title: string,
    private app: App,
    private _menuItems: () => UIMenuItem[],
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
  get title(): string {
    return this._title;
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

  // Dispatch a selection to this menu's handler
  async dispatchSelection(id: string): Promise<string> {
    return this._selectionHandler(id);
  }

  // Get the default item ID for this menu
  async defaultItem(): Promise<string> {
    return this.dispatchSelection('0');
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

    // Check if this item has a flyout by looking if its ID matches a main menu
    const flyoutMenu = this.app.uimenumgr.getMenu(item.id);
    const isFlyout = !!flyoutMenu;
    const isDefault = item.id === defaultItemId;
    const itemClasses = isFlyout ? 'flyout' : isDefault ? 'default-item selected' : '';

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
      ITEM_ID: item.id,
      ITEM_LABEL: processedDisplayName,
      ITEM_CLASSES: itemClasses,
      CONTENT_GUTTER_BEFORE: '', // Content handled by CSS
      CONTENT_GUTTER_AFTER: '', // Content handled by CSS
      FLYOUT: flyout,
    };

    return this.app.templateDictReplace(yaml.ui_menu_item, replacementDict);
  }

  // Generate the complete HTML for this menu using YAML template
  async getHTML(flyoutCache: Record<string, string> = {}): Promise<string> {
    this.dx.out(`UIMenu.getHTML called for ${this.id}`);
    this.dx.out(`Icon: "${this.icon}", Title: "${this.title}"`);

    const yaml = this.yaml; // This will load and validate automatically
    this.dx.out(`YAML loaded, ui_menu_html length: ${yaml.ui_menu_html.length}`);

    // Generate menu items HTML using the new getItemHTML function
    const menuItems = this.getMenuItems();
    const defaultItemId = await this.defaultItem(); // Get default once

    // Check if menu has selection and default for CSS class
    const haveSelectionAndDefault = !!defaultItemId;
    const isFlyout = !this.icon?.length;

    // Determine gutter content from semaphores
    const hasGutterAfter = isFlyout || haveSelectionAndDefault;
    const processedMenuItemsHtml = await Promise.all(
      menuItems.map(item => this.getItemHTML(item, flyoutCache[item.id] || '', defaultItemId))
    );
    const menuItemsHtml = processedMenuItemsHtml.join('\n');

    // Build CSS classes for menu container
    const menuClasses = [
      haveSelectionAndDefault ? 'has-selected' : '',
      hasGutterAfter ? 'has-gutter-after' : '',
    ]
      .filter(Boolean)
      .join(' ');
    // Choose template based on whether this menu has an icon
    const template = isFlyout ? yaml.ui_flyout : yaml.ui_menu_html;

    const replacementDict = {
      MENU_ID: this.getId_Menu(),
      BUTTON_ID: this.getId_Button(),
      TITLE: this.title,
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
