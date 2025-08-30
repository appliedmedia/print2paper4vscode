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
    return this.getAllMenus().find(menu => menu.id === id);
  }

  // Add a menu to the list (called by PaperPrinter)
  addMenu(menu: UIMenu): void {
    this.menus.push(menu);
  }

  // Generate all HTML at once
  getAllUIMenuHTML(): string {
    this.app.ui.debugOut(
      `Generating HTML for ${this.getAllMenus().length} menus`,
      'info',
      'UIMenuMgr'
    );

    const result = this.getAllMenus()
      .map(menu => {
        this.app.ui.debugOut(`Generating HTML for menu: ${menu.id}`, 'info', 'UIMenuMgr');
        const menuHTML = menu.getHTML();
        this.app.ui.debugOut(
          `Generated HTML for menu ${menu.id}: ${menuHTML.substring(0, 100)}...`,
          'info',
          'UIMenuMgr'
        );
        return menuHTML;
      })
      .join('\n');

    this.app.ui.debugOut(`Total generated HTML length: ${result.length}`, 'info', 'UIMenuMgr');
    return result;
  }

  // Generate all JavaScript at once
  getAllUIMenuJS(): string {
    // All menus share the same generic handlers
    const yaml = this.app.os.readExtensionYaml<{ ui_menu_generic_handlers: string }>(
      'src/UIMenu.yaml'
    );
    return yaml.ui_menu_generic_handlers;
  }

  // Get all template variable mappings
  getTemplateVariableMappings(): Record<string, string> {
    const mappings: Record<string, string> = {};

    // Add the new UIMenu placeholders
    mappings['UIMENU_HTML'] = this.getAllUIMenuHTML();
    mappings['UIMENU_JS'] = this.getAllUIMenuJS();

    // Keep the old individual menu mappings for backward compatibility
    this.getAllMenus().forEach(menu => {
      const menuItems = menu.getMenuItems();
      const yaml = this.app.os.readExtensionYaml<{ ui_menu_item: string }>('src/UIMenu.yaml');
      const html = menuItems
        .map(item =>
          this.app.templateDictReplace(yaml.ui_menu_item, {
            ITEM_ID: item.id,
            ITEM_LABEL: item.displayName,
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
    return this.getAllMenus().map(menu => ({
      id: menu.id,
      icon: menu.icon,
      title: menu.title,
      templateVariable: menu.getTemplateVariableName(),
    }));
  }
}
