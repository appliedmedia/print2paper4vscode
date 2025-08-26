import type { App } from './App';
import { UIMenu } from './UIMenu';
import type { UIMenuItem } from './types/UIMenuItem';

export class UIMenuMgr {
  private menus: UIMenu[] = [];

  constructor(private app: App) {
    this.initializeMenus();
  }

  init(): void {
    // Validate that all required methods exist on PaperPrinter
    const validation = this.validateRequiredMethods();
    if (!validation.valid) {
      throw new Error(
        `UIMenuMgr validation failed. Missing methods: ${validation.missing.join(', ')}`
      );
    }
  }

  done(): void {
    // Cleanup any resources if needed
    this.menus = [];
  }

  createMenu(id: string, icon: string, title: string): UIMenu {
    let listBuilder: () => UIMenuItem[];
    let selectionHandler: (selectedId: string) => Promise<void>;

    switch (id) {
      case 'print':
        listBuilder = () => this.printBuildList();
        selectionHandler = async (selectedId: string) =>
          await this.handleSelection_Print(selectedId);
        break;
      case 'theme':
        listBuilder = () => this.themesBuildList();
        selectionHandler = async (selectedId: string) =>
          await this.handleSelection_Theme(selectedId);
        break;
      case 'text':
        listBuilder = () => this.textBuildList();
        selectionHandler = async (selectedId: string) =>
          await this.handleSelection_Text(selectedId);
        break;
      default:
        throw new Error(`No builder/handler found for menu: ${id}`);
    }

    return new UIMenu(id, icon, title, this.app, listBuilder, selectionHandler);
  }

  private initializeMenus(): void {
    // Define all menus once - easy to add/remove/modify
    this.menus = [
      this.createMenu('print', '🖨', 'Print'),
      this.createMenu('theme', '🎨', 'Theme'),
      this.createMenu('text', 'Tt', 'Text'),
    ];
  }

  // Get all menus
  getAllMenus(): UIMenu[] {
    return this.menus;
  }

  // Get a specific menu by ID
  getMenu(id: string): UIMenu | undefined {
    return this.menus.find(menu => menu.id === id);
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

  // Build list methods for each menu type
  private printBuildList(): UIMenuItem[] {
    return [
      { id: 'preview', label: 'Print with Preview' },
      { id: 'direct', label: 'Print' },
      { id: 'save', label: 'Save as PDF' },
    ];
  }

  private themesBuildList(): UIMenuItem[] {
    return [
      { id: 'editor', label: 'Editor Theme' },
      ...this.app.stylize.getThemes().map(theme => ({
        id: theme.id,
        label: theme.label,
      })),
    ];
  }

  private textBuildList(): UIMenuItem[] {
    const editorTypo = this.app.vscodeapis.getEditorTypography();
    return [
      { id: 'editor', label: `Editor (${editorTypo.fontSize}px)` },
      { id: '9', label: '9 px' },
      { id: '10', label: '10 px' },
      { id: '12', label: '12 px' },
      { id: '14', label: '14 px' },
      { id: '18', label: '18 px' },
      { id: '24', label: '24 px' },
    ];
  }

  // Handle selection methods for each menu type
  private async handleSelection_Print(selectedId: string): Promise<void> {
    this.app.ui.debugOut(`Print menu selection: ${selectedId}`, 'info', 'UIMenuMgr');

    // Get the current HTML content from PaperPrinter
    const htmlContent = (this.app.paperprinter as any).lastPrintPrepHtml;
    if (!htmlContent) {
      this.app.ui.showErrorMessage('No content available to print. Please run Print2Paper first.');
      return;
    }

    const tabName = (this.app.paperprinter as any).currentPrintableLabel || 'Print Output';

    try {
      switch (selectedId) {
        case 'preview':
          await this.app.pdf.printWithPreview(htmlContent, tabName);
          break;
        case 'direct':
          await this.app.pdf.printDirectly(htmlContent, tabName);
          break;
        case 'save':
          await this.app.pdf.saveAsPDF(htmlContent, tabName);
          break;
        default:
          this.app.ui.showErrorMessage(`Unknown print action: ${selectedId}`);
      }
    } catch (error) {
      this.app.ui.showErrorMessage(
        `Print failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleSelection_Theme(selectedId: string): Promise<void> {
    this.app.ui.debugOut(`Theme menu selection: ${selectedId}`, 'info', 'UIMenuMgr');

    // For theme changes, we need to trigger the main print handler to show the webview
    // The webview will handle the theme change via message handling
    this.app.paperprinter.handlePrint();
  }

  private async handleSelection_Text(selectedId: string): Promise<void> {
    this.app.ui.debugOut(`Text menu selection: ${selectedId}`, 'info', 'UIMenuMgr');

    // For font size changes, we need to trigger the main print handler to show the webview
    // The webview will handle the font size change via message handling
    this.app.paperprinter.handlePrint();
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

  // Validate that all required methods exist on PaperPrinter
  validateRequiredMethods(): { valid: boolean; missing: string[] } {
    // No validation needed with new generic system
    return { valid: true, missing: [] };
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
