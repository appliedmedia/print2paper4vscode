import type { App } from './App';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class UIMenu {
  private dx: Diagnostics;

  constructor(
    private _id: string,
    private _icon: string,
    private _title: string,
    private _app: App,
    private _listBuilder: () => UIMenuItem[],
    private _selectionHandler: (id: string) => Promise<string>
  ) {
    this.dx = this._app.dx.create('UIMenu');
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
    return this._listBuilder();
  }

  // Dispatch a selection to this menu's handler
  async dispatchSelection(id: string): Promise<string> {
    return this._selectionHandler(id);
  }

  // Generate the complete HTML for this menu using YAML template
  async getHTML(): Promise<string> {
    this.dx.out(`UIMenu.getHTML called for ${this.id}`);
    this.dx.out(`Icon: "${this.icon}", Title: "${this.title}"`);

    let yaml: { ui_menu_html: string; ui_menu_item: string };
    try {
      const yamlResult = this._app.os.fileRead<{
        ui_menu_html: string;
        ui_menu_item: string;
      }>('src/UIMenu.yaml');
      if (!yamlResult) throw new Error('Failed to load UIMenu template');
      yaml = yamlResult;
      this.dx.out(`YAML loaded, ui_menu_html length: ${yaml.ui_menu_html.length}`);
    } catch (error) {
      this.dx.out(`ERROR reading YAML: ${error}`);
      throw error;
    }

    // Generate menu items HTML with dynamic checkmarks and edit icons
    const menuItems = this.getMenuItems();

    // Get the default selection to determine which item should be checked
    let defaultSelection = '';
    try {
      defaultSelection = await this._selectionHandler('0');
    } catch (error) {
      this.dx.out(`Error getting default selection: ${error}`);
    }

    const menuItemsHtml = menuItems
      .map(async item => {
        const isDefault = item.id === defaultSelection;
        const itemClasses = isDefault ? 'default-item active' : '';

        // Only show gutter if there's a default selection (not empty string)
        const showGutter = !!defaultSelection;
        const itemPrefix = showGutter ? ' ' : '';
        const itemSuffix = showGutter ? ' ' : '';

        // Check if this item references a submenu
        let flyoutHtml = '';
        const submenu = this._app.uimenumgr.getMenu(item.id);
        if (submenu) {
          // This item represents a full menu - generate its items as a flyout
          const submenuItems = submenu.getMenuItems();
          const submenuDefault = await submenu.dispatchSelection('0');

          flyoutHtml = submenuItems
            .map(subItem => {
              const isSubDefault = subItem.id === submenuDefault;
              const subItemClasses = isSubDefault ? 'default-item active' : '';
              const subShowGutter = !!submenuDefault;
              const subItemPrefix = subShowGutter ? ' ' : '';
              const subItemSuffix = subShowGutter ? ' ' : '';

              const subReplacementDict = {
                ITEM_ID: subItem.id,
                ITEM_LABEL: subItem.displayName,
                ITEM_CLASSES: subItemClasses,
                ITEM_PREFIX: subItemPrefix,
                ITEM_SUFFIX: subItemSuffix,
              };

              return this._app.templateDictReplace(yaml.ui_menu_item, subReplacementDict);
            })
            .join('\n');
        }

        const replacementDict = {
          ITEM_ID: item.id,
          ITEM_LABEL: item.displayName,
          ITEM_CLASSES: itemClasses,
          ITEM_PREFIX: itemPrefix,
          ITEM_SUFFIX: itemSuffix,
          FLYOUT_ITEMS: flyoutHtml,
        };

        this.dx.out(
          `Menu item ${item.id}: prefix="${itemPrefix}", suffix="${itemSuffix}", showGutter=${showGutter}, hasSubmenu=${!!submenu}`
        );

        return this._app.templateDictReplace(yaml.ui_menu_item, replacementDict);
      })
      .join('\n');

    // Generate complete menu HTML using the template
    const result = this._app.templateDictReplace(yaml.ui_menu_html, {
      MENU_ID: this.getId_Menu(),
      BUTTON_ID: this.getId_Button(),
      TITLE: this.title,
      ICON: this.icon,
      MENU_ITEMS: menuItemsHtml,
    });

    this.dx.out(`Generated HTML for ${this.id}: ${result.substring(0, 100)}...`);

    // Debug: show the actual menu items HTML
    this.dx.out(`Menu items HTML for ${this.id}: ${menuItemsHtml.substring(0, 200)}...`);
    return result;
  }

  // Generate JavaScript for this menu using YAML template
  generateJavaScript(): string {
    // All menus share the same generic handlers - no need to generate specific JS
    // The generic handlers are provided by UIMenuMgr.generateAllJavaScript()
    return '';
  }

  done(): void {
    this.dx.done();
  }
}
