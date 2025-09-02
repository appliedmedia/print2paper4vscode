import type { App } from './App';
import { UIMenu } from './UIMenu';
import type { UIMenuItem } from './types/UI_t';
import { Diagnostics } from './Diagnostics';

export class UIMenuMgr {
  private app: App;
  private menus: UIMenu[] = [];
  private dx: Diagnostics;

  constructor(app: App) {
    this.app = app;
    this.dx = app.dx.create('UIMenuMgr');
    // No initialization needed - menus are created on-demand by PaperPrinter
  }

  init(): void {
    // No initialization needed - menus are created on-demand by PaperPrinter
  }

  done(): void {
    // Cleanup any resources if needed
    this.menus = [];
    this.dx.done();
  }

  createMenu(
    id: string,
    icon: string,
    title: string,
    listBuilder: () => UIMenuItem[],
    selectionHandler: (selectedId: string) => Promise<string>
  ): UIMenu {
    return new UIMenu(id, icon, title, this.app, listBuilder, selectionHandler);
  }

  // Get all menus
  getAllMenus(): UIMenu[] {
    return [...this.menus];
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
  async getAllUIMenuHTML(): Promise<string> {
    this.dx.out(
      `Generating HTML for ${this.getAllMenus().length} menus`
    );

    const menuPromises = this.getAllMenus().map(async menu => {
      this.dx.out(`Generating HTML for menu: ${menu.id}`);
      try {
        const menuHTML = await menu.getHTML();
        this.dx.out(
          `Generated HTML for menu ${menu.id}: ${menuHTML.substring(0, 100)}...`
        );
        return menuHTML;
      } catch (error) {
        this.dx.print(
          `ERROR generating HTML for menu ${menu.id}: ${String(error)}`
        );
        return `<!-- ERROR generating menu ${menu.id}: ${error} -->`;
      }
    });

    const menuResults = await Promise.all(menuPromises);
    const result = menuResults.join('\n');

    this.dx.out(`Total generated HTML length: ${result.length}`);
    this.dx.out(`Final HTML preview: ${result.substring(0, 200)}...`);
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
  async getTemplateVariableMappings(): Promise<Record<string, string>> {
    const mappings: Record<string, string> = {};

    // Add the new UIMenu placeholders
    mappings['UIMENU_HTML'] = await this.getAllUIMenuHTML();
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
            ITEM_CLASSES: '',
            ITEM_PREFIX: '',
            ITEM_SUFFIX: '',
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
