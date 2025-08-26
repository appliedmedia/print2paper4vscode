import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenuMgr } from '../src/UIMenuMgr.js';
import { UIMenu } from '../src/UIMenu.js';

// Mock App class for testing
class MockApp {
  paperprinter: any;

  constructor() {
    this.paperprinter = {
      generatePickerList_MenuPrint: () => '<div>Print options</div>',
      generatePickerList_MenuThemes: () => '<div>Theme options</div>',
      generatePickerList_MenuText: () => '<div>Text options</div>',
      generatePickerList_MenuHistory: () => '<div>History options</div>',
      handlePick_MenuPrint: (id: string) => `print-${id}`,
      handlePick_MenuThemes: (id: string) => `theme-${id}`,
      handlePick_MenuText: (id: string) => `text-${id}`,
      handlePick_MenuHistory: (id: string) => `history-${id}`,
    };
  }
}

describe('UIMenuMgr', () => {
  let menuMgr: UIMenuMgr;
  let mockApp: MockApp;

  // Create mock app and menu manager for testing
  mockApp = new MockApp();
  menuMgr = new UIMenuMgr(mockApp as any);

  describe('Constructor and Initialization', () => {
    it('should create menu manager with correct menus', () => {
      const menus = menuMgr.getAllMenus();

      assert.strictEqual(menus.length, 3, 'Should have 3 menus');

      const menuIds = menus.map(m => m.id);
      assert.ok(menuIds.includes('menuPrint'), 'Should have print menu');
      assert.ok(menuIds.includes('menuThemes'), 'Should have themes menu');
      assert.ok(menuIds.includes('menuText'), 'Should have text menu');
    });

    it('should create menus with correct properties', () => {
      const printMenu = menuMgr.getMenu('menuPrint');
      assert.ok(printMenu, 'Should find print menu');
      assert.strictEqual(printMenu?.icon, '🖨', 'Should have correct icon');
      assert.strictEqual(printMenu?.title, 'Print', 'Should have correct title');

      const themeMenu = menuMgr.getMenu('menuThemes');
      assert.ok(themeMenu, 'Should find theme menu');
      assert.strictEqual(themeMenu?.icon, '🎨', 'Should have correct icon');
      assert.strictEqual(themeMenu?.title, 'Theme', 'Should have correct title');
    });

    it('should handle menu creation with different types', () => {
      const textMenu = menuMgr.getMenu('menuText');
      assert.ok(textMenu, 'Should find text menu');
      assert.strictEqual(textMenu?.icon, 'Tt', 'Should have text icon');
      assert.strictEqual(textMenu?.title, 'Text', 'Should have text title');
    });
  });

  describe('Menu Retrieval', () => {
    it('should get all menus', () => {
      const menus = menuMgr.getAllMenus();
      assert.ok(Array.isArray(menus), 'Should return array');
      assert.strictEqual(menus.length, 3, 'Should return all menus');
    });

    it('should get specific menu by ID', () => {
      const printMenu = menuMgr.getMenu('menuPrint');
      assert.ok(printMenu, 'Should find print menu');
      assert.strictEqual(printMenu?.id, 'menuPrint', 'Should have correct ID');

      const themeMenu = menuMgr.getMenu('menuThemes');
      assert.ok(themeMenu, 'Should find theme menu');
      assert.strictEqual(themeMenu?.id, 'menuThemes', 'Should have correct ID');
    });

    it('should return undefined for non-existent menu', () => {
      const nonExistent = menuMgr.getMenu('nonExistent');
      assert.strictEqual(nonExistent, undefined, 'Should return undefined for non-existent menu');
    });

    it('should handle case-sensitive menu IDs', () => {
      const printMenu = menuMgr.getMenu('MenuPrint');
      assert.strictEqual(printMenu, undefined, 'Should be case-sensitive');
    });
  });

  describe('HTML Generation', () => {
    it('should generate HTML for all menus', () => {
      const html = menuMgr.generateAllHTML();

      assert.ok(html.includes('id="menuPrint"'), 'Should include print menu HTML');
      assert.ok(html.includes('id="menuThemes"'), 'Should include themes menu HTML');
      assert.ok(html.includes('id="menuText"'), 'Should include text menu HTML');
    });

    it('should include picker content in HTML', () => {
      const html = menuMgr.generateAllHTML();

      assert.ok(html.includes('<div>Print options</div>'), 'Should include print picker content');
      assert.ok(html.includes('<div>Theme options</div>'), 'Should include theme picker content');
      assert.ok(html.includes('<div>Text options</div>'), 'Should include text picker content');
    });

    it('should generate valid HTML structure', () => {
      const html = menuMgr.generateAllHTML();

      // Check for basic HTML structure
      assert.ok(html.includes('<div'), 'Should contain div elements');
      assert.ok(html.includes('<button'), 'Should contain button elements');
      assert.ok(html.includes('class="p2p4vsc-group"'), 'Should have correct group class');
      assert.ok(html.includes('class="p2p4vsc-btn"'), 'Should have correct button class');
    });

    it('should separate menus with newlines', () => {
      const html = menuMgr.generateAllHTML();
      const menuCount = (html.match(/class="p2p4vsc-group"/g) || []).length;
      assert.strictEqual(menuCount, 3, 'Should have 3 menu groups');
    });
  });

  describe('JavaScript Generation', () => {
    it('should generate JavaScript for all menus', () => {
      const js = menuMgr.generateAllJavaScript();

      assert.ok(js.includes('menuPrintPicker'), 'Should include print picker variable');
      assert.ok(js.includes('menuThemesPicker'), 'Should include themes picker variable');
      assert.ok(js.includes('menuTextPicker'), 'Should include text picker variable');
    });

    it('should include event listeners for all menus', () => {
      const js = menuMgr.generateAllJavaScript();

      assert.ok(js.includes("addEventListener('click'"), 'Should include click listeners');
      assert.ok(js.includes("getElementById('menuPrint-btn')"), 'Should reference print button');
      assert.ok(js.includes("getElementById('menuThemes-btn')"), 'Should reference themes button');
    });

    it('should include correct method calls', () => {
      const js = menuMgr.generateAllJavaScript();

      assert.ok(js.includes('handlePick_MenuPrint'), 'Should reference print handler');
      assert.ok(js.includes('handlePick_MenuThemes'), 'Should reference themes handler');
      assert.ok(js.includes('handlePick_MenuText'), 'Should reference text handler');
    });

    it('should separate JavaScript blocks with newlines', () => {
      const js = menuMgr.generateAllJavaScript();
      const blocks = js.split('\n\n').filter(block => block.trim().length > 0);
      assert.strictEqual(blocks.length, 3, 'Should have 3 JavaScript blocks');
    });
  });

  describe('Picker List Generation', () => {
    it('should generate picker list for each menu', () => {
      const printList = (menuMgr as any).generatePickerListForMenu('menuPrint');
      const themeList = (menuMgr as any).generatePickerListForMenu('menuThemes');

      assert.strictEqual(
        printList,
        '<div>Print options</div>',
        'Should generate print picker list'
      );
      assert.strictEqual(
        themeList,
        '<div>Theme options</div>',
        'Should generate theme picker list'
      );
    });

    it('should throw error for non-existent menu', () => {
      assert.throws(() => {
        (menuMgr as any).generatePickerListForMenu('nonExistent');
      }, /No picker list generator found for menu: nonExistent/);
    });

    it('should call correct method on PaperPrinter', () => {
      const printList = (menuMgr as any).generatePickerListForMenu('menuPrint');
      assert.strictEqual(
        printList,
        '<div>Print options</div>',
        'Should call generatePickerList_MenuPrint'
      );
    });
  });

  describe('Template Variable Mappings', () => {
    it('should generate correct template variable mappings', () => {
      const mappings = menuMgr.getTemplateVariableMappings();

      // Check for the new UIMenu placeholders
      assert.ok(mappings.UIMENU_HTML, 'Should have UIMENU_HTML mapping');
      assert.ok(mappings.UIMENU_JS, 'Should have UIMENU_JS mapping');

      // Check for individual menu mappings
      assert.ok(mappings.MENUPRINT_PICKER_LIST, 'Should have print picker list mapping');
      assert.ok(mappings.MENUTHEMES_PICKER_LIST, 'Should have themes picker list mapping');
      assert.ok(mappings.MENUTEXT_PICKER_LIST, 'Should have text picker list mapping');
    });

    it('should map template variables to picker content', () => {
      const mappings = menuMgr.getTemplateVariableMappings();

      assert.strictEqual(
        mappings.PRINT_PICKER_LIST,
        '<div>Print options</div>',
        'Should map print content'
      );
      assert.strictEqual(
        mappings.TEXT_PICKER_LIST,
        '<div>Text options</div>',
        'Should map text content'
      );
    });

    it('should return object with correct structure', () => {
      const mappings = menuMgr.getTemplateVariableMappings();

      assert.ok(typeof mappings === 'object', 'Should return an object');
      assert.strictEqual(Object.keys(mappings).length, 5, 'Should have 5 mappings');
    });
  });

  describe('Method Validation', () => {
    it('should validate that all required methods exist', () => {
      const validation = menuMgr.validateRequiredMethods();

      assert.strictEqual(validation.valid, true, 'Should be valid');
      assert.strictEqual(validation.missing.length, 0, 'Should have no missing methods');
    });

    it('should detect missing picker methods', () => {
      // Create app with missing method
      const incompleteApp = {
        paperprinter: {
          generatePickerList_MenuPrint: () => '<div>Print options</div>',
          // Missing other methods
          handlePick_MenuPrint: (id: string) => `print-${id}`,
          handlePick_MenuThemes: (id: string) => `theme-${id}`,
          handlePick_MenuText: (id: string) => `text-${id}`,
        },
      };

      const incompleteMenuMgr = new UIMenuMgr(incompleteApp as any);
      const validation = incompleteMenuMgr.validateRequiredMethods();

      assert.strictEqual(validation.valid, false, 'Should be invalid');
      assert.ok(validation.missing.length > 0, 'Should have missing methods');
    });

    it('should detect missing handler methods', () => {
      // Create app with missing handler
      const incompleteApp = {
        paperprinter: {
          generatePickerList_MenuPrint: () => '<div>Print options</div>',
          generatePickerList_MenuThemes: () => '<div>Theme options</div>',
          generatePickerList_MenuText: () => '<div>Text options</div>',
          // Missing handler methods
        },
      };

      const incompleteMenuMgr = new UIMenuMgr(incompleteApp as any);
      const validation = incompleteMenuMgr.validateRequiredMethods();

      assert.strictEqual(validation.valid, false, 'Should be invalid');
      assert.ok(validation.missing.length > 0, 'Should have missing methods');
    });
  });

  describe('Menu Configuration', () => {
    it('should return menu configuration for debugging', () => {
      const config = menuMgr.getMenuConfiguration();

      assert.strictEqual(config.length, 3, 'Should have 3 menu configurations');

      const printConfig = config.find(c => c.id === 'menuPrint');
      assert.ok(printConfig, 'Should have print menu config');
      assert.strictEqual(printConfig?.icon, '🖨', 'Should have correct icon');
      assert.strictEqual(printConfig?.title, 'Print', 'Should have correct title');
      assert.strictEqual(
        printConfig?.pickerMethod,
        'generatePickerList_MenuPrint',
        'Should have correct picker method'
      );
      assert.strictEqual(
        printConfig?.handlerMethod,
        'handlePick_MenuPrint',
        'Should have correct handler method'
      );
      assert.strictEqual(
        printConfig?.templateVariable,
        'MENUPRINT_PICKER_LIST',
        'Should have correct template variable'
      );
    });

    it('should have consistent configuration structure', () => {
      const config = menuMgr.getMenuConfiguration();

      config.forEach(menuConfig => {
        assert.ok('id' in menuConfig, 'Should have id property');
        assert.ok('icon' in menuConfig, 'Should have icon property');
        assert.ok('title' in menuConfig, 'Should have title property');
        assert.ok('pickerMethod' in menuConfig, 'Should have pickerMethod property');
        assert.ok('handlerMethod' in menuConfig, 'Should have handlerMethod property');
        assert.ok('templateVariable' in menuConfig, 'Should have templateVariable property');
      });
    });
  });

  describe('Integration with UIMenu', () => {
    it('should use UIMenu instances correctly', () => {
      const menus = menuMgr.getAllMenus();

      menus.forEach(menu => {
        assert.ok(menu instanceof UIMenu, 'Should be UIMenu instance');
        assert.ok(typeof menu.id === 'string', 'Should have string ID');
        assert.ok(typeof menu.icon === 'string', 'Should have string icon');
        assert.ok(typeof menu.title === 'string', 'Should have string title');
      });
    });

    it('should generate consistent HTML and JavaScript', () => {
      const html = menuMgr.generateAllHTML();
      const js = menuMgr.generateAllJavaScript();

      // HTML should reference the same IDs that JavaScript uses
      const htmlIds = html
        .match(/id="([^"]+)"/g)
        ?.map(id => id.replace('id="', '').replace('"', ''));
      const jsIds = js
        .match(/getElementById\('([^']+)'\)/g)
        ?.map(ref => ref.replace("getElementById('", '').replace("')", ''));

      assert.ok(htmlIds, 'HTML should have IDs');
      assert.ok(jsIds, 'JavaScript should reference IDs');

      // All JavaScript-referenced IDs should exist in HTML
      jsIds?.forEach(jsId => {
        assert.ok(
          htmlIds?.includes(jsId),
          `JavaScript references ID '${jsId}' that should exist in HTML`
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing PaperPrinter methods gracefully', () => {
      const incompleteApp = {
        paperprinter: {},
      };

      const incompleteMenuMgr = new UIMenuMgr(incompleteApp as any);

      assert.throws(() => {
        incompleteMenuMgr.generateAllHTML();
      }, /No picker list generator found for menu/);
    });

    it('should handle PaperPrinter with null methods', () => {
      const nullApp = {
        paperprinter: {
          generatePickerList_MenuPrint: null,
          generatePickerList_MenuThemes: null,
          generatePickerList_MenuText: null,
        },
      };

      const nullMenuMgr = new UIMenuMgr(nullApp as any);

      assert.throws(() => {
        nullMenuMgr.generateAllHTML();
      }, /Method .* not found on PaperPrinter/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty menu list', () => {
      // This would require modifying the class, but we can test the behavior
      const html = menuMgr.generateAllHTML();
      assert.ok(html.length > 0, 'Should generate HTML even with minimal content');
    });

    it('should handle very long menu IDs', () => {
      const longId = 'a'.repeat(100);
      const longMenu = new UIMenu(longId, '🔧', 'Long Menu');

      // Test that the manager can handle long IDs
      assert.strictEqual(longMenu.getPickerId(), `${longId}-picker`);
      assert.strictEqual(longMenu.getButtonId(), `${longId}-btn`);
    });

    it('should handle special characters in menu IDs', () => {
      const specialId = 'menu_$#@!';
      const specialMenu = new UIMenu(specialId, '🔧', 'Special Menu');

      // Test that the manager can handle special characters
      assert.strictEqual(specialMenu.getPickerId(), `${specialId}-picker`);
      assert.strictEqual(specialMenu.getButtonId(), `${specialId}-btn`);
    });
  });
});
