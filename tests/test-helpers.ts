import type { App } from '../src/App.js';

/**
 * Installs header/footer menu stubs to prevent "Menu not found" errors in tests.
 * 
 * This helper mocks app.uimenumgr.getMenuItemIdSelected to return 'none' for all
 * header_ and footer_ menu items, while falling back to the original implementation
 * for other menus.
 * 
 * @param app - Application instance to install stubs on
 */
export function installHeaderFooterMenuStubs(app: App): void {
  const originalGetMenuItemIdSelected = app.uimenumgr.getMenuItemIdSelected.bind(app.uimenumgr);
  app.uimenumgr.getMenuItemIdSelected = (menuId: any) => {
    if (typeof menuId === 'string' && (menuId.startsWith('header_') || menuId.startsWith('footer_'))) {
      return 'none';
    }
    try {
      return originalGetMenuItemIdSelected(menuId);
    } catch {
      return undefined;
    }
  };
}
