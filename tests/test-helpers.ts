import type { TestApp } from './test-utils.js';

/**
 * Installs header/footer menu stubs to prevent "Menu not found" errors in tests.
 * 
 * This helper mocks the uimenumgr.getMenuItemIdSelected to return 'none' for all
 * header_ and footer_ menu items, while falling back to the original implementation
 * for other menus.
 * 
 * @param app - Test application instance to install stubs on
 */
export function installHeaderFooterMenuStubs(app: TestApp): void {
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

/**
 * Get fn (function imports) from app for use in tests.
 * This exercises the same Registry code path as production.
 */
export function getFn(app: App): FnImport_t {
  return app.reg.use();
}
