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
    displayName: string,
    icon: string,
    isFlyout: boolean = false,
    menuItems: () => UIMenuItem[],
    flyoutMenuItemIds: string[] = [],
    selectionHandler: (selectedId: string) => Promise<string>,
    getDefaultValue?: () => any
  ): UIMenu {
    return new UIMenu(
      this.app,
      id,
      displayName,
      icon,
      isFlyout,
      menuItems,
      flyoutMenuItemIds,
      selectionHandler,
      getDefaultValue
    );
  }

  // Get all menus
  getAllMenus(): UIMenu[] {
    return [...this.menus];
  }

  // Handle menu item selection
  async handleMenuItemSelected(menuId: string, itemId: string): Promise<void> {
    const dx = this.dx.sub('handleMenuItemSelected');
    
    try {
      const menu = this.getMenu(menuId);
      if (menu) {
        await menu.dispatchSelection(itemId);
        dx.out(`Menu item selected: ${menuId}.${itemId}`);
      } else {
        dx.out(`No menu found for menuId: ${menuId}`);
      }
    } finally {
      dx.done();
    }
  }

  // Get a specific menu by ID
  getMenu(id: string): UIMenu | undefined {
    return this.getAllMenus().find(menu => menu.id === id);
  }

  // Add a menu to the list (called by PaperPrinter)
  addMenu(menu: UIMenu): void {
    if (this.menus.some(m => m.id === menu.id)) {
      this.dx.out(`addMenu: Duplicate id ${menu.id} ignored`);
      return;
    }
    this.menus.push(menu);
    this.dx.out(`addMenu: Added menu ${menu.id}, total menus: ${this.menus.length}`);
  }

  // Generate all HTML at once using two-pass flyout strategy
  async getAllUIMenuHTML(): Promise<string> {
    const allMenus = this.getAllMenus();
    this.dx.out(`getAllUIMenuHTML: Found ${allMenus.length} menus`);
    const flyoutCache: Record<string, string> = {};

    // Process flyout menus first
    for (const menu of allMenus.filter(menu => !menu.icon?.length)) {
      // flyout menus only (don't have an icon)
      this.dx.out(`Caching flyout HTML for: ${menu.id}`);
      try {
        const html = await menu.getHTML();
        flyoutCache[menu.id] = html;
        this.dx.out(`Cached flyout for ${menu.id}: ${html.substring(0, 100)}...`);
      } catch (error) {
        this.dx.out(`ERROR generating flyout for ${menu.id}: ${String(error)}`);
        flyoutCache[menu.id] = `<!-- ERROR: ${error} -->`;
      }
    }

    // Rest of menus
    let result = '';
    for (const menu of allMenus.filter(menu => menu.icon?.length)) {
      this.dx.out(`Generating HTML for menu: ${menu.id}`);
      try {
        const html = await menu.getHTML(flyoutCache);
        this.dx.out(`Generated HTML for menu ${menu.id}: ${html.substring(0, 100)}...`);
        result += (result ? '\n' : '') + html;
      } catch (error) {
        this.dx.out(`ERROR generating HTML for menu ${menu.id}: ${String(error)}`);
        result += (result ? '\n' : '') + `<!-- ERROR generating menu ${menu.id}: ${error} -->`;
      }
    }

    this.dx.out(`Total generated HTML length: ${result.length}`);
    this.dx.out(`Final HTML preview: ${result.substring(0, 200)}...`);
    return result;
  }

  // Generate all JavaScript at once
  getAllUIMenuJS(): string {
    // All menus share the same generic handlers - get from any menu's cached YAML
    const allMenus = this.getAllMenus();
    this.dx.out(`getAllUIMenuJS: Found ${allMenus.length} menus`);
    const anyMenu = allMenus[0];
    if (!anyMenu) {
      this.dx.out('getAllUIMenuJS: No menus available, returning empty JS');
      return '';
    }

    // Get the generic handlers - yaml getter handles loading automatically
    const js = anyMenu.yaml?.ui_menu_generic_handlers ?? '';
    if (!js) {
      this.dx.out('getAllUIMenuJS: JS is undefined/empty, YAML loading failed or no handlers present');
      return '';
    }
    this.dx.out(`getAllUIMenuJS: Generated ${js.length} characters of JS`);
    return js;
  }

  // Get all UIMenu CSS
  getAllUIMenuCSS(): string {
    const anyMenu = this.getAllMenus()[0];
    if (!anyMenu) {
      this.dx.out('getAllUIMenuCSS: No menus available');
      return '';
    }

    // Get the CSS - yaml getter handles loading automatically
    const css = anyMenu.yaml.ui_menu_css;
    if (!css) {
      this.dx.out('getAllUIMenuCSS: CSS is undefined, YAML loading failed');
      return '';
    }
    this.dx.out(`getAllUIMenuCSS: Generated ${css.length} characters of CSS`);

    return css;
  }

  // Get all template variable mappings
  async getTemplateVariableMappings(): Promise<Record<string, string>> {
    const mappings: Record<string, string> = {};

    // Add the main UIMenu placeholders
    mappings['UIMENU_HTML'] = await this.getAllUIMenuHTML();
    mappings['UIMENU_JS'] = this.getAllUIMenuJS();
    mappings['UIMENU_CSS'] = this.getAllUIMenuCSS();

    return mappings;
  }

  // Get menu components for generic toolbar integration
  async getMenuComponents(): Promise<{ html: string; css: string; js: string }> {
    this.dx.out('UIMenuMgr.getMenuComponents: Getting menu components for toolbar integration');

    const html = await this.getAllUIMenuHTML();
    const css = this.getAllUIMenuCSS();
    const js = this.getAllUIMenuJS();

    this.dx.out(
      `UIMenuMgr.getMenuComponents: HTML=${html.length}, CSS=${css.length}, JS=${js.length} characters`
    );
    return { html, css, js };
  }

  // Get menu configuration for debugging
  getMenuConfiguration(): Array<{
    id: string;
    icon: string;
    displayName: string;
    templateVariable: string;
  }> {
    return this.getAllMenus().map(menu => ({
      id: menu.id,
      icon: menu.icon,
      displayName: menu.displayName,
      templateVariable: menu.getTemplateVariableName(),
    }));
  }
}
