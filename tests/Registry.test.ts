import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { Registry } from '../src/Registry';
import { Diagnostics } from '../src/Diagnostics';
import { App } from '../src/App';
import { mockVSCode } from './test-utils.js';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context
const mockContext = {
  subscriptions: [],
  workspaceState: {
    get: () => undefined,
    update: () => Promise.resolve(),
    keys: () => [],
  },
  globalState: {
    get: () => undefined,
    update: () => Promise.resolve(),
    keys: () => [],
  },
  extensionPath: process.cwd(),
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

describe('Registry', () => {
  let app: App;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
  });

  afterEach(() => {
    app.done();
  });

  test('should create Registry instance', () => {
    const reg = app.reg;

    assert.ok(reg instanceof Registry);
    assert.strictEqual(Registry.id, 'reg');
  });

  test('should have Diagnostics instance available', () => {
    const reg = app.reg;

    // Should be able to get Diagnostics via use()
    const fn = reg.use('dx.sub', 'dx.out');
    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');

    // Verify Diagnostics works correctly
    const subDx = fn.dx.sub({ name: 'TestComponent' });
    assert.ok(subDx instanceof Diagnostics);
  });

  test('should register existing instances', () => {
    const reg = app.reg;

    // Verify we can access registered components via use()
    const fn = reg.use('dx.sub');
    assert.ok(fn.dx);
    
    // Verify UI is registered (can request its methods)
    const uiFn = reg.use('ui.showErrorMessage');
    assert.ok(uiFn.ui);
    assert.ok(typeof uiFn.ui.showErrorMessage === 'function');
  });

  test('should resolve methods via use()', () => {
    const reg = app.reg;

    // Request methods from registered components
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should always include dx.sub from always array', () => {
    const reg = app.reg;

    // Request nothing - should still get dx.sub from always array
    const fn = reg.use();

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
  });

  test('should resolve methods with component prefix', () => {
    const reg = app.reg;

    // Request with explicit component prefix
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should bind methods correctly', () => {
    const reg = app.reg;

    const fn = reg.use('dx.sub');
    const subDx = fn.dx.sub({ name: 'TestComponent' });

    assert.ok(subDx instanceof Diagnostics);
    assert.ok(subDx.name.includes('TestComponent'));
  });

  test('should handle multiple component methods', () => {
    const reg = app.reg;

    // Request methods from multiple components
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should create placeholder structure for intellisense', () => {
    const reg = app.reg;

    // Check that placeholder properties exist (for intellisense)
    assert.ok('dx' in reg);
    assert.ok('ui' in reg);
    assert.ok('pdf' in reg);
  });

  test('should verify Diagnostics is available via Registry', () => {
    const reg = app.reg;

    // Get Diagnostics methods via Registry
    const fn = reg.use('dx.sub', 'dx.out', 'dx.error');

    // Verify all Diagnostics methods are available
    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
    assert.ok(typeof fn.dx.error === 'function');

    // Verify Diagnostics works correctly
    const subDx = fn.dx.sub({ name: 'TestComponent' });
    assert.ok(subDx instanceof Diagnostics);
    
    // Test that methods work
    const result = subDx.out('Test message');
    assert.strictEqual(result, subDx); // Should return this for chaining
  });

  test('should resolve methods from registered component instances', () => {
    const reg = app.reg;

    // Request methods from components that were registered by App
    const fn = reg.use('ui.showErrorMessage', 'pdf.generatePdf');

    // Verify methods are available
    assert.ok(fn.ui);
    assert.ok(typeof fn.ui.showErrorMessage === 'function');
    assert.ok(fn.pdf);
    assert.ok(typeof fn.pdf.generatePdf === 'function');
  });
});
