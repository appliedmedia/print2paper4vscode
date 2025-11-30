import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Registry } from '../src/Registry';
import { Diagnostics } from '../src/Diagnostics';
import { App } from '../src/App';
import type { ExtensionContext } from 'vscode';
import * as vscode from 'vscode';

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
  extensionPath: '/test/path',
  extensionUri: vscode.Uri.parse('file:///test/path'),
  storagePath: '/test/storage',
  globalStoragePath: '/test/global-storage',
  logPath: '/test/log',
  extensionMode: vscode.ExtensionMode.Test,
  secrets: {} as any,
  environmentVariableCollection: {} as any,
} as unknown as ExtensionContext;

describe('Registry', () => {
  test('should create Registry instance', () => {
    // Create a minimal App instance for testing
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    assert.ok(reg instanceof Registry);
    assert.strictEqual(Registry.id, 'reg');
  });

  test('should have Diagnostics instance available', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Registry should have its own Diagnostics instance
    assert.ok(reg['dx'] instanceof Diagnostics);

    // Should be able to get Diagnostics via use()
    const fn = reg.use('dx.sub');
    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
  });

  test('should register existing instances', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Verify instances are registered
    assert.ok(reg['_instances'].has('dx'));
    assert.ok(reg['_instances'].has('ui'));
    assert.ok(reg['_instances'].has('pdf'));
  });

  test('should resolve methods via use()', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Request methods from registered components
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should always include dx.sub from always array', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Request nothing - should still get dx.sub from always array
    const fn = reg.use();

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
  });

  test('should resolve methods with component prefix', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Request with explicit component prefix
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should bind methods correctly', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    const fn = reg.use('dx.sub');
    const subDx = fn.dx.sub('TestComponent');

    assert.ok(subDx instanceof Diagnostics);
  });

  test('should handle multiple component methods', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Request methods from multiple components
    const fn = reg.use('dx.sub', 'dx.out');

    assert.ok(fn.dx);
    assert.ok(typeof fn.dx.sub === 'function');
    assert.ok(typeof fn.dx.out === 'function');
  });

  test('should create placeholder structure for intellisense', () => {
    const app = new App({ context: mockContext, vscode });
    const reg = app.reg;

    // Check that placeholder properties exist
    assert.ok('dx' in reg);
    assert.ok('ui' in reg);
    assert.ok('pdf' in reg);
  });
});
