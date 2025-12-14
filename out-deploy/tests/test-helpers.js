"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installHeaderFooterMenuStubs = installHeaderFooterMenuStubs;
/**
 * Installs header/footer menu stubs to prevent "Menu not found" errors in tests.
 *
 * This helper mocks app.uimenumgr.getMenuItemIdSelected to return 'none' for all
 * header_ and footer_ menu items, while falling back to the original implementation
 * for other menus.
 *
 * @param app - Application instance to install stubs on
 */
function installHeaderFooterMenuStubs(app) {
    const originalGetMenuItemIdSelected = app.uimenumgr.getMenuItemIdSelected.bind(app.uimenumgr);
    app.uimenumgr.getMenuItemIdSelected = (menuId) => {
        if (typeof menuId === 'string' && (menuId.startsWith('header_') || menuId.startsWith('footer_'))) {
            return 'none';
        }
        try {
            return originalGetMenuItemIdSelected(menuId);
        }
        catch {
            return undefined;
        }
    };
}
//# sourceMappingURL=test-helpers.js.map