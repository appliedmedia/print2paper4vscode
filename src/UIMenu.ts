import type { App } from './App';
import type { UIMenuItem } from './types/UIMenuItem';

export class UIMenu {
  constructor(
    private _id: string,
    private _icon: string,
    private _title: string,
    private _app: App,
    private _listBuilder: () => UIMenuItem[],
    private _selectionHandler: (id: string) => Promise<void>
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
  generateHTML(menuItems: string): string {
    const yaml = this._app.os.readExtensionYaml<{ ui_menu_html: string }>('src/UIMenu.yaml');
    return this._app.templateDictReplace(yaml.ui_menu_html, {
      MENU_ID: this.getId_Menu(),
      BUTTON_ID: this.getId_Button(),
      TITLE: this.title,
      ICON: this.icon,
      MENU_ITEMS: menuItems,
    });
  }

  // Generate JavaScript for this menu using YAML template
  generateJavaScript(): string {
    // All menus share the same generic handlers - no need to generate specific JS
    // The generic handlers are provided by UIMenuMgr.generateAllJavaScript()
    return '';
  }
}
