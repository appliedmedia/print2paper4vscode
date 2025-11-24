import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { UIMenu } from '../src/UIMenu.js';
import { App } from '../src/App.js';
import type { MenuId_t, iconSlotTriad_main_t } from '../src/UIMenu.js';
import { mockContext, mockVSCode } from './test-utils.js';

describe('UIMenu - Text Edit Codec', () => {
  let app: App;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    app.init();
  });

  afterEach(() => {
    app.done();
  });

  it('should convert persisted value to display value using persistToDisplay codec', async () => {
    // Create a menu with text_edit that has a transform (like zoom level)
    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{0,3}$',
        min: 10,
        max: 300,
      },
      transform: {
        display: (persist: string | number | undefined) => {
          const val = typeof persist === 'number' ? persist : parseFloat(String(persist));
          return isNaN(val) ? undefined : Math.round(val * 100);
        },
        persist: (display: string | number | undefined) => {
          const val = typeof display === 'number' ? display : parseFloat(String(display));
          return isNaN(val) ? undefined : val / 100;
        },
      },
    };

    const menu = new UIMenu(
      app,
      'testZoom' as MenuId_t,
      'Test Zoom',
      { begin: '', main: textEditConfig, end: '%' },
      false,
      () => [],
      [],
      async (menuId, itemId) => ({ id: itemId, value: itemId })
    );

    // Register and set a persisted value (scale format: 1.50)
    menu.persist.register('testZoom');
    (menu.persist as unknown as Record<string, string>).testZoom = '1.50';

    // Generate HTML
    const html = await menu.getHTML();

    // Check that the input has value="150" (converted from scale 1.50 to percentage 150)
    assert.ok(html.includes('value="150"'), 'Should convert scale 1.50 to percentage 150');
    assert.ok(
      html.includes('data-transform-display="Math.round({{persist}}*100)"'),
      'Should include transform.display in data attribute'
    );
    assert.ok(
      html.includes('data-transform-persist="{{display}}/100"'),
      'Should include transform.persist in data attribute'
    );
  });

  it('should handle text_edit without transform (display = persist)', async () => {
    // Create a menu with text_edit that has NO transform
    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{1,2}$',
        min: 8,
        max: 48,
      },
      // No transform - display value = persisted value
    };

    const menu = new UIMenu(
      app,
      'testFont' as MenuId_t,
      'Test Font',
      { begin: '', main: textEditConfig, end: 'px' },
      false,
      () => [],
      [],
      async (menuId, itemId) => ({ id: itemId, value: itemId })
    );

    // Register and set a persisted value (font size: 14)
    menu.persist.register('testFont');
    (menu.persist as unknown as Record<string, string>).testFont = '14';

    // Generate HTML
    const html = await menu.getHTML();

    // Check that the input has value="14" (no conversion)
    assert.ok(html.includes('value="14"'), 'Should use persisted value directly without conversion');
    assert.ok(
      !html.includes('data-transform-display'),
      'Should not include transform attributes when no transform defined'
    );
  });

  it('should handle missing persisted value gracefully', async () => {
    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{0,3}$',
        min: 10,
        max: 300,
      },
      transform: {
        display: (persist: string | number | undefined) => {
          const val = typeof persist === 'number' ? persist : parseFloat(String(persist));
          return isNaN(val) ? undefined : Math.round(val * 100);
        },
        persist: (display: string | number | undefined) => {
          const val = typeof display === 'number' ? display : parseFloat(String(display));
          return isNaN(val) ? undefined : val / 100;
        },
      },
    };

    const menu = new UIMenu(
      app,
      'testEmpty' as MenuId_t,
      'Test Empty',
      { begin: '', main: textEditConfig, end: '%' },
      false,
      () => [],
      [],
      async (menuId, itemId) => ({ id: itemId, value: itemId })
    );

    // Don't set any persisted value

    // Generate HTML
    const html = await menu.getHTML();

    // Check that the input has no value attribute (empty)
    assert.ok(!html.includes('value="'), 'Should not include value attribute when no persisted value');
  });

  it('should handle transform evaluation errors gracefully', async () => {
    // Create a transform with an invalid expression
    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{0,3}$',
        min: 10,
        max: 300,
      },
      transform: {
        display: (persist: string | number | undefined) => { throw new Error('Invalid transform'); }, // Will cause error
        persist: (display: string | number | undefined) => {
          const val = typeof display === 'number' ? display : parseFloat(String(display));
          return isNaN(val) ? undefined : val / 100;
        },
      },
    };

    const menu = new UIMenu(
      app,
      'testBadCodec' as MenuId_t,
      'Test Bad Codec',
      { begin: '', main: textEditConfig, end: '%' },
      false,
      () => [],
      [],
      async (menuId, itemId) => ({ id: itemId, value: itemId })
    );

    // Register and set a persisted value
    menu.persist.register('testBadCodec');
    (menu.persist as unknown as Record<string, string>).testBadCodec = '1.50';

    // Generate HTML (should not throw, should use persisted value as fallback)
    const html = await menu.getHTML();

    // Check that it falls back to the persisted value
    assert.ok(html.includes('value="1.50"'), 'Should fall back to persisted value on transform error');
  });

  it('should round percentage values correctly', async () => {
    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{0,3}$',
        min: 10,
        max: 300,
      },
      transform: {
        display: (persist: string | number | undefined) => {
          const val = typeof persist === 'number' ? persist : parseFloat(String(persist));
          return isNaN(val) ? undefined : Math.round(val * 100);
        },
        persist: (display: string | number | undefined) => {
          const val = typeof display === 'number' ? display : parseFloat(String(display));
          return isNaN(val) ? undefined : val / 100;
        },
      },
    };

    const menu = new UIMenu(
      app,
      'testRound' as MenuId_t,
      'Test Round',
      { begin: '', main: textEditConfig, end: '%' },
      false,
      () => [],
      [],
      async (menuId, itemId) => ({ id: itemId, value: itemId })
    );

    // Register and set a persisted value that would result in a decimal percentage
    menu.persist.register('testRound');
    (menu.persist as unknown as Record<string, string>).testRound = '1.255'; // Should round to 126

    const html = await menu.getHTML();

    assert.ok(
      html.includes('value="126"'),
      'Should round 1.255 * 100 = 125.5 to 126 using Math.round'
    );
  });

  it('should convert display value back to persist value in blur handler', async () => {
    // This tests the webview-side transform logic (simulated)
    const transformPersist = '{{display}}/100';
    const displayValue = '150';

    // Simulate what the blur handler does
    const expression = transformPersist.replace(/\{\{display\}\}/g, displayValue);
    // eslint-disable-next-line no-eval
    const persistValue = eval(expression);

    assert.strictEqual(persistValue, 1.5, 'Should convert percentage 150 to scale 1.5');
    assert.strictEqual(String(persistValue), '1.5', 'Should stringify to "1.5"');
  });

  it('should handle various zoom scale conversions', async () => {
    const testCases = [
      { scale: '0.10', expected: '10' }, // 10%
      { scale: '0.25', expected: '25' }, // 25%
      { scale: '0.50', expected: '50' }, // 50%
      { scale: '1.00', expected: '100' }, // 100%
      { scale: '1.50', expected: '150' }, // 150%
      { scale: '2.00', expected: '200' }, // 200%
      { scale: '3.00', expected: '300' }, // 300%
    ];

    const textEditConfig: iconSlotTriad_main_t = {
      constrain: {
        regex: '^\\d{0,3}$',
        min: 10,
        max: 300,
      },
      transform: {
        display: (persist: string | number | undefined) => {
          const val = typeof persist === 'number' ? persist : parseFloat(String(persist));
          return isNaN(val) ? undefined : Math.round(val * 100);
        },
        persist: (display: string | number | undefined) => {
          const val = typeof display === 'number' ? display : parseFloat(String(display));
          return isNaN(val) ? undefined : val / 100;
        },
      },
    };

    for (const testCase of testCases) {
      const menu = new UIMenu(
        app,
        `testZoom${testCase.scale}` as MenuId_t,
        'Test Zoom',
        { begin: '', main: textEditConfig, end: '%' },
        false,
        () => [],
        [],
        async (menuId, itemId) => ({ id: itemId, value: itemId })
      );

      const persistKey = `testZoom${testCase.scale.replace('.', '_')}`;
      menu.persist.register(persistKey);
      (menu.persist as unknown as Record<string, string>)[persistKey] = testCase.scale;

      const html = await menu.getHTML();

      assert.ok(
        html.includes(`value="${testCase.expected}"`),
        `Scale ${testCase.scale} should convert to percentage ${testCase.expected}`
      );
    }
  });
});

