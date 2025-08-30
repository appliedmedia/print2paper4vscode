import type { App } from './App';
import type { UIMenuItem } from './types/UI_t';

export class UIMenu {
  constructor(
    private _id: string,
    private _icon: string,
    private _title: string,
    private _app: App,
    private _listBuilder: () => UIMenuItem[],
    private _selectionHandler: (id: string) => Promise<string>
  ) {}

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

  // Generate the complete HTML for this menu using YAML template
  async getHTML(): Promise<string> {
    this._app.ui.debugOut(`UIMenu.getHTML called for ${this.id}`, 'info', 'UIMenu');
    this._app.ui.debugOut(`Icon: "${this.icon}", Title: "${this.title}"`, 'info', 'UIMenu');

    let yaml: { ui_menu_html: string; ui_menu_item: string };
    try {
      yaml = this._app.os.readExtensionYaml<{ ui_menu_html: string; ui_menu_item: string }>(
        'src/UIMenu.yaml'
      );
      this._app.ui.debugOut(
        `YAML loaded, ui_menu_html length: ${yaml.ui_menu_html.length}`,
        'info',
        'UIMenu'
      );
    } catch (error) {
      this._app.ui.debugOut(`ERROR reading YAML: ${error}`, 'error', 'UIMenu');
      throw error;
    }

    // Generate menu items HTML with dynamic checkmarks and edit icons
    const menuItems = this.getMenuItems();

    // Get the default selection to determine which item should be checked
    let defaultSelection = '';
    try {
      defaultSelection = await this._selectionHandler('0');
    } catch (error) {
      this._app.ui.debugOut(`Error getting default selection: ${error}`, 'error', 'UIMenu');
    }

    const menuItemsHtml = menuItems
      .map(item => {
        const isDefault = item.id === defaultSelection;
        const itemClasses = isDefault ? 'default-item' : '';
        const itemPrefix = isDefault ? '✓' : ' ';
        const itemSuffix = isDefault ? '✏️' : '';

        return this._app.templateDictReplace(yaml.ui_menu_item, {
          ITEM_ID: item.id,
          ITEM_LABEL: item.displayName,
          ITEM_CLASSES: itemClasses,
          ITEM_PREFIX: itemPrefix,
          ITEM_SUFFIX: itemSuffix,
        });
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

    this._app.ui.debugOut(
      `Generated HTML for ${this.id}: ${result.substring(0, 100)}...`,
      'info',
      'UIMenu'
    );
    return result;
  }

  // Generate JavaScript for this menu using YAML template
  generateJavaScript(): string {
    // All menus share the same generic handlers - no need to generate specific JS
    // The generic handlers are provided by UIMenuMgr.generateAllJavaScript()
    return '';
  }
}
