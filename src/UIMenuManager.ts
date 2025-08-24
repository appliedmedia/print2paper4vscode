import type { App } from './App.js';
import { UIMenu, type UIMenuItem } from './UIMenu.js';

export class UIMenuManager {
    private menus: UIMenu[] = [];

    constructor(private app: App) {
        this.initializeMenus();
    }

    private initializeMenus(): void {
        // Define all menus once - easy to add/remove/modify
        this.menus = [
            new UIMenu('menuPrint', '🖨', 'Print'),
            new UIMenu('menuThemes', '🎨', 'Theme'),
            new UIMenu('menuText', 'Tt', 'Text'),
            new UIMenu('menuHistory', '📄', 'History')
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
        return this.menus.map(menu => {
            const pickerList = this.generatePickerListForMenu(menu.id);
            return menu.generateHTML(pickerList);
        }).join('\n');
    }

    // Generate all JavaScript at once
    generateAllJavaScript(): string {
        return this.menus.map(menu => menu.generateJavaScript()).join('\n\n');
    }

    // Generate the picker list for a specific menu
    private generatePickerListForMenu(menuId: string): string {
        const methodName = this.getMenu(menuId)?.getPickerListMethodName();
        if (!methodName) {
            throw new Error(`No picker list generator found for menu: ${menuId}`);
        }

        // Call the appropriate method on PaperPrinter
        const method = (this.app.paperprinter as any)[methodName];
        if (typeof method === 'function') {
            return method.call(this.app.paperprinter);
        }

        throw new Error(`Method ${methodName} not found on PaperPrinter`);
    }

    // Get all template variable mappings
    getTemplateVariableMappings(): Record<string, string> {
        const mappings: Record<string, string> = {};
        
        this.menus.forEach(menu => {
            const pickerList = this.generatePickerListForMenu(menu.id);
            mappings[menu.getTemplateVariableName()] = pickerList;
        });

        return mappings;
    }

    // Validate that all required methods exist on PaperPrinter
    validateRequiredMethods(): { valid: boolean; missing: string[] } {
        const missing: string[] = [];
        
        this.menus.forEach(menu => {
            const pickerMethod = menu.getPickerListMethodName();
            const handlerMethod = menu.getPickHandlerMethodName();
            
            if (!(this.app.paperprinter as any)[pickerMethod]) {
                missing.push(pickerMethod);
            }
            
            if (!(this.app.paperprinter as any)[handlerMethod]) {
                missing.push(handlerMethod);
            }
        });

        return {
            valid: missing.length === 0,
            missing
        };
    }

    // Get menu configuration for debugging
    getMenuConfiguration(): Array<{
        id: string;
        icon: string;
        title: string;
        pickerMethod: string;
        handlerMethod: string;
        templateVariable: string;
    }> {
        return this.menus.map(menu => ({
            id: menu.id,
            icon: menu.icon,
            title: menu.title,
            pickerMethod: menu.getPickerListMethodName(),
            handlerMethod: menu.getPickHandlerMethodName(),
            templateVariable: menu.getTemplateVariableName()
        }));
    }
}