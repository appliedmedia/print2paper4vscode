import type { App } from '../src/App.js';
import type { FnImport_t } from '../src/types/Registry_t.js';

/**
 * Installs header/footer menu stubs to prevent "Menu not found" errors in tests.
 * 
 * This helper mocks the uimenumgr.getMenuItemIdSelected to return 'none' for all
 * header_ and footer_ menu items, while falling back to the original implementation
 * for other menus.
 * 
 * @param app - Application instance to install stubs on
 */
export function installHeaderFooterMenuStubs(app: App): void {
  const fn = app.reg.use('uimenumgr.getMenuItemIdSelected');
  const uimenumgr = app.reg.getInstance('uimenumgr') as any;
  const originalGetMenuItemIdSelected = uimenumgr.getMenuItemIdSelected.bind(uimenumgr);
  uimenumgr.getMenuItemIdSelected = (menuId: any) => {
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
