import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UIMenu } from '../src/UIMenu.js';
import type { UIMenuItem } from '../src/types/UIMenuItem.js';

describe('UIMenu', () => {
  let menu: UIMenu;

  // Create menu for testing
  menu = new UIMenu('testMenu', '🔧', 'Test Menu');

  describe('Constructor and Properties', () => {
    it('should create menu with correct properties', () => {
      assert.strictEqual(menu.id, 'testMenu');
      assert.strictEqual(menu.icon, '🔧');
      assert.strictEqual(menu.title, 'Test Menu');
    });

    it('should handle empty string properties', () => {
      const emptyMenu = new UIMenu('', '', '');
      assert.strictEqual(emptyMenu.id, '');
      assert.strictEqual(emptyMenu.icon, '');
      assert.strictEqual(emptyMenu.title, '');
    });
  });

  describe('ID Generation Methods', () => {
    it('should generate correct picker ID', () => {
      assert.strictEqual(menu.getPickerId(), 'testMenu-picker');
    });

    it('should generate correct button ID', () => {
      assert.strictEqual(menu.getButtonId(), 'testMenu-btn');
    });

    it('should generate correct group ID', () => {
      assert.strictEqual(menu.getGroupId(), 'testMenu');
    });

    it('should handle special characters in ID', () => {
      const specialMenu = new UIMenu('menu-with-dashes', '🔧', 'Special Menu');
      assert.strictEqual(specialMenu.getPickerId(), 'menu-with-dashes-picker');
      assert.strictEqual(specialMenu.getButtonId(), 'menu-with-dashes-btn');
      assert.strictEqual(specialMenu.getGroupId(), 'menu-with-dashes');
    });
  });

  describe('Method Name Generation', () => {
    it('should generate correct picker list method name', () => {
      assert.strictEqual(menu.getPickerListMethodName(), 'generatePickerList_TestMenu');
    });

    it('should generate correct pick handler method name', () => {
      assert.strictEqual(menu.getPickHandlerMethodName(), 'handlePick_TestMenu');
    });

    it('should handle single character ID', () => {
      const singleMenu = new UIMenu('a', '🔧', 'Single');
      assert.strictEqual(singleMenu.getPickerListMethodName(), 'generatePickerList_A');
      assert.strictEqual(singleMenu.getPickHandlerMethodName(), 'handlePick_A');
    });

    it('should handle ID starting with number', () => {
      const numMenu = new UIMenu('1menu', '🔧', 'Number');
      assert.strictEqual(numMenu.getPickerListMethodName(), 'generatePickerList_1menu');
      assert.strictEqual(numMenu.getPickHandlerMethodName(), 'handlePick_1menu');
    });
  });

  describe('HTML Generation', () => {
    it('should generate correct HTML structure', () => {
      const pickerList = '<div class="item">Test Item</div>';
      const html = menu.generateHTML(pickerList);

      assert.ok(html.includes('id="testMenu"'), 'Should have correct group ID');
      assert.ok(html.includes('id="testMenu-btn"'), 'Should have correct button ID');
      assert.ok(html.includes('id="testMenu-picker"'), 'Should have correct picker ID');
      assert.ok(html.includes('data-target="testMenu-picker"'), 'Should have correct data-target');
      assert.ok(html.includes('data-group="testMenu"'), 'Should have correct data-group');
      assert.ok(html.includes('title="Test Menu"'), 'Should have correct title');
      assert.ok(html.includes('🔧'), 'Should include icon');
      assert.ok(html.includes(pickerList), 'Should include picker list content');
    });

    it('should handle empty picker list', () => {
      const html = menu.generateHTML('');
      assert.ok(
        html.includes('id="testMenu-picker"'),
        'Should have picker div even with empty content'
      );
    });

    it('should handle HTML in picker list', () => {
      const pickerList = '<div class="item" data-value="test">Test</div><span>More content</span>';
      const html = menu.generateHTML(pickerList);
      assert.ok(html.includes(pickerList), 'Should preserve HTML in picker list');
    });

    it('should trim whitespace from generated HTML', () => {
      const html = menu.generateHTML('test');
      assert.strictEqual(html, html.trim(), 'Generated HTML should be trimmed');
    });
  });

  describe('JavaScript Generation', () => {
    it('should generate correct JavaScript structure', () => {
      const js = menu.generateJavaScript();

      assert.ok(
        js.includes("const testMenuPicker = document.getElementById('testMenu-picker')"),
        'Should declare picker variable'
      );
      assert.ok(js.includes("document.getElementById('testMenu-btn')"), 'Should reference button');
      assert.ok(js.includes('testMenu-picker'), 'Should reference picker ID');
      assert.ok(js.includes('testMenu'), 'Should reference group ID');
      assert.ok(js.includes('hideAll()'), 'Should call hideAll function');
      assert.ok(js.includes('handlePick_TestMenu'), 'Should reference correct handler method');
    });

    it('should handle click event properly', () => {
      const js = menu.generateJavaScript();
      assert.ok(js.includes("addEventListener('click'"), 'Should add click listener');
      assert.ok(js.includes('e.stopPropagation()'), 'Should stop event propagation');
    });

    it('should handle display toggle correctly', () => {
      const js = menu.generateJavaScript();
      assert.ok(
        js.includes("picker.style.display = shown ? 'none' : 'block'"),
        'Should toggle display'
      );
    });

    it('should handle positioning correctly', () => {
      const js = menu.generateJavaScript();
      assert.ok(js.includes("picker.style.top = (r.height + 4) + 'px'"), 'Should set top position');
      assert.ok(js.includes("picker.style.left = '0px'"), 'Should set left position');
    });

    it('should handle item selection correctly', () => {
      const js = menu.generateJavaScript();
      assert.ok(js.includes("e.target.closest('.item')"), 'Should find closest item');
      assert.ok(js.includes("getAttribute('data-id')"), 'Should get data-id attribute');
      assert.ok(js.includes('hideAll()'), 'Should hide all after selection');
    });
  });

  describe('Template Variable Names', () => {
    it('should generate correct template variable name', () => {
      assert.strictEqual(menu.getTemplateVariableName(), 'TESTMENU_PICKER_LIST');
    });

    it('should handle mixed case ID', () => {
      const mixedMenu = new UIMenu('MixedCase', '🔧', 'Mixed');
      assert.strictEqual(mixedMenu.getTemplateVariableName(), 'MIXEDCASE_PICKER_LIST');
    });

    it('should handle ID with numbers', () => {
      const numMenu = new UIMenu('menu123', '🔧', 'Number');
      assert.strictEqual(numMenu.getTemplateVariableName(), 'MENU123_PICKER_LIST');
    });
  });

  describe('Data Attributes', () => {
    it('should return correct data attributes', () => {
      const attributes = menu.getDataAttributes();

      assert.strictEqual(attributes['data-target'], 'testMenu-picker');
      assert.strictEqual(attributes['data-group'], 'testMenu');
    });

    it('should return object with correct structure', () => {
      const attributes = menu.getDataAttributes();

      assert.ok(typeof attributes === 'object', 'Should return an object');
      assert.ok('data-target' in attributes, 'Should have data-target key');
      assert.ok('data-group' in attributes, 'Should have data-group key');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long ID', () => {
      const longId = 'a'.repeat(100);
      const longMenu = new UIMenu(longId, '🔧', 'Long Menu');

      assert.strictEqual(longMenu.getPickerId(), `${longId}-picker`);
      assert.strictEqual(longMenu.getButtonId(), `${longId}-btn`);
      assert.strictEqual(longMenu.getGroupId(), longId);
    });

    it('should handle ID with special characters', () => {
      const specialMenu = new UIMenu('menu_$#@!', '🔧', 'Special');

      assert.strictEqual(specialMenu.getPickerId(), 'menu_$#@!-picker');
      assert.strictEqual(specialMenu.getButtonId(), 'menu_$#@!-btn');
      assert.strictEqual(specialMenu.getGroupId(), 'menu_$#@!');
    });

    it('should handle unicode characters in ID', () => {
      const unicodeMenu = new UIMenu('ménu', '🔧', 'Unicode');

      assert.strictEqual(unicodeMenu.getPickerId(), 'ménu-picker');
      assert.strictEqual(unicodeMenu.getButtonId(), 'ménu-btn');
      assert.strictEqual(unicodeMenu.getGroupId(), 'ménu');
    });
  });

  describe('Integration', () => {
    it('should generate consistent HTML and JavaScript', () => {
      const html = menu.generateHTML('<div>test</div>');
      const js = menu.generateJavaScript();

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

    it('should generate valid HTML structure', () => {
      const html = menu.generateHTML('<div>test</div>');

      // Basic HTML structure validation
      assert.ok(html.includes('<div'), 'Should start with div');
      assert.ok(html.includes('</div>'), 'Should end with div');
      assert.ok(html.includes('<button'), 'Should have button element');
      assert.ok(html.includes('</button>'), 'Should have closing button tag');
    });
  });
});
