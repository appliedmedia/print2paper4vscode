import type { App } from './App';
import { UIMenu } from './UIMenu';
import type { UIMenuItem } from './types/UIMenuItem';

export class UIMenuMgr {
  private app: App;
  private menus: UIMenu[] = [];

  constructor(app: App) {
    this.app = app;
    // No initialization needed - menus are created on-demand by PaperPrinter
  }

  init(): void {
    // No initialization needed - menus are created on-demand by PaperPrinter
  }

  done(): void {
    // Cleanup any resources if needed
    this.menus = [];
  }

  createMenu(
    id: string,
    icon: string,
    title: string,
    listBuilder: () => UIMenuItem[],
    selectionHandler: (selectedId: string) => Promise<void>
  ): UIMenu {
    return new UIMenu(id, icon, title, this.app, listBuilder, selectionHandler);
  }

  // Get all menus
  getAllMenus(): UIMenu[] {
    return this.menus;
  }

  // Get a specific menu by ID
  getMenu(id: string): UIMenu | undefined {
    return this.menus.find(menu => menu.id === id);
  }

  // Add a menu to the list (called by PaperPrinter)
  addMenu(menu: UIMenu): void {
    this.menus.push(menu);
  }

  // Generate all HTML at once
  generateAllHTML(): string {
    return this.menus
      .map(menu => {
        const menuItems = menu.getMenuItems();
        const yaml = this.app.os.readExtensionYaml<{ ui_menu_item: string }>('src/UIMenu.yaml');
        const html = menuItems
          .map(item =>
            this.app.templateDictReplace(yaml.ui_menu_item, {
              ITEM_ID: item.id,
              ITEM_LABEL: item.label,
            })
          )
          .join('\n');
        return menu.generateHTML(html);
      })
      .join('\n');
  }

  // Generate all JavaScript at once
  generateAllJavaScript(): string {
    // All menus share the same generic handlers
    const yaml = this.app.os.readExtensionYaml<{ ui_menu_generic_handlers: string }>(
      'src/UIMenu.yaml'
    );
    return yaml.ui_menu_generic_handlers;
  }

  // Generate template with UIMENU_HTML placeholder
  generateTemplateWithUIMenuHTML(): string {
    return this.generateAllHTML();
  }

  // Generate template with UIMENU_JS placeholder
  generateTemplateWithUIMenuJS(): string {
    return this.generateAllJavaScript();
  }

  // Get all template variable mappings
  getTemplateVariableMappings(): Record<string, string> {
    const mappings: Record<string, string> = {};

    // Add the new UIMenu placeholders
    mappings['UIMENU_HTML'] = this.generateTemplateWithUIMenuHTML();
    mappings['UIMENU_JS'] = this.generateTemplateWithUIMenuJS();

    // Keep the old individual menu mappings for backward compatibility
    this.menus.forEach(menu => {
      const menuItems = menu.getMenuItems();
      const yaml = this.app.os.readExtensionYaml<{ ui_menu_item: string }>('src/UIMenu.yaml');
      const html = menuItems
        .map(item =>
          this.app.templateDictReplace(yaml.ui_menu_item, {
            ITEM_ID: item.id,
            ITEM_LABEL: item.label,
          })
        )
        .join('\n');
      mappings[menu.getTemplateVariableName()] = html;
    });

    return mappings;
  }

  // Get menu configuration for debugging
  getMenuConfiguration(): Array<{
    id: string;
    icon: string;
    title: string;
    templateVariable: string;
  }> {
    return this.menus.map(menu => ({
      id: menu.id,
      icon: menu.icon,
      title: menu.title,
      templateVariable: menu.getTemplateVariableName(),
    }));
  }
}
