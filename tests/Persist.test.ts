import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { Persist } from '../src/Persist.js';
import { App } from '../src/App.js';
import type * as vscode from 'vscode';

// Mock VS Code context and APIs with state tracking
let mockGlobalState: Record<string, any> = {};

const mockContext = {
  subscriptions: [],
  globalState: {
    get: (key: string) => mockGlobalState[key],
    update: async (key: string, value: any) => {
      if (value === undefined) {
        delete mockGlobalState[key];
      } else {
        mockGlobalState[key] = value;
      }
    },
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as vscode.ExtensionContext;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as unknown as typeof vscode;

describe('Persist', () => {
  let app: App;
  let persist: Persist & Record<string, any>;

  beforeEach(() => {
    mockGlobalState = {}; // Reset state before each test
    app = new App({ context: mockContext, vscode: mockVSCode });
    persist = Persist.create({ reg: app.reg }) as Persist & Record<string, any>;
  });

  afterEach(() => {
    app.done();
  });

  it('should register and retrieve a property', () => {
    persist.register('testKey');
    persist['testKey'] = 'testValue';
    assert.strictEqual(persist['testKey'], 'testValue');
  });

  it('should use default value when no value is set', async () => {
    persist.register('theme');
    await persist.validateDefault({ name: 'theme', computeFn: async () => 'github-light' });
    
    assert.strictEqual(persist['theme'], 'github-light');
  });

  it('should persist values to global state', () => {
    persist.register('testKey');
    persist['testKey'] = 'persistedValue';
    
    assert.strictEqual(mockGlobalState['testKey'], 'persistedValue');
  });

  it('should retrieve from global state on second access', () => {
    // Set value in global state directly
    mockGlobalState['existingKey'] = 'existingValue';
    
    persist.register('existingKey');
    const value = persist['existingKey'];
    
    assert.strictEqual(value, 'existingValue');
  });

  it('should use default when value is not in global state or cache', async () => {
    persist.register('newKey');
    await persist.validateDefault({ name: 'newKey', computeFn: async () => 'defaultValue' });
    
    assert.strictEqual(persist['newKey'], 'defaultValue');
    // Should also be persisted to global state
    assert.strictEqual(mockGlobalState['newKey'], 'defaultValue');
  });

  it('should not update global state for empty string values', () => {
    persist.register('emptyKey');
    persist['emptyKey'] = '';
    
    // Empty string should not persist to global state
    assert.strictEqual(mockGlobalState['emptyKey'], undefined);
    // But should be in memory cache
    assert.strictEqual(persist['emptyKey'], '');
  });

  it('should return same default on multiple validateDefault calls', async () => {
    persist.register('key');
    
    const default1 = await persist.validateDefault({ name: 'key', computeFn: async () => 'default' });
    const default2 = await persist.validateDefault({ name: 'key', computeFn: async () => 'different' });
    
    assert.strictEqual(default1, 'default');
    assert.strictEqual(default2, 'default'); // Should return cached default
  });

  it('should handle multiple registered properties', () => {
    persist.register('key1').register('key2');
    persist['key1'] = 'value1';
    persist['key2'] = 'value2';
    
    assert.strictEqual(persist['key1'], 'value1');
    assert.strictEqual(persist['key2'], 'value2');
  });

  it('should update global state when value changes', () => {
    persist.register('changeable');
    persist['changeable'] = 'value1';
    assert.strictEqual(mockGlobalState['changeable'], 'value1');
    
    persist['changeable'] = 'value2';
    assert.strictEqual(mockGlobalState['changeable'], 'value2');
  });

  it('should not update global state when value does not change', () => {
    persist.register('unchanged');
    persist['unchanged'] = 'same';
    
    const callCountBefore = Object.keys(mockGlobalState).length;
    persist['unchanged'] = 'same'; // Set same value again
    
    // Global state should not be updated (no new keys)
    const callCountAfter = Object.keys(mockGlobalState).length;
    assert.strictEqual(callCountBefore, callCountAfter);
  });

  it('should handle different value types', () => {
    persist.register('stringKey');
    persist.register('numberKey');
    persist.register('booleanKey');
    
    persist['stringKey'] = 'string';
    persist['numberKey'] = 42;
    persist['booleanKey'] = true;
    
    assert.strictEqual(persist['stringKey'], 'string');
    assert.strictEqual(persist['numberKey'], 42);
    assert.strictEqual(persist['booleanKey'], true);
  });

  it('should clear persist state', async () => {
    // Import kMenuId to know what keys clear() actually clears
    const { kMenuId } = await import('../src/UIMenu.js');
    
    // Register actual menu keys that clear() will remove
    const menuKey1 = kMenuId[0];
    const menuKey2 = kMenuId.length > 1 ? kMenuId[1] : 'toolbar_pos';
    
    persist.register(menuKey1);
    persist.register(menuKey2);
    persist[menuKey1] = 'value1';
    persist[menuKey2] = 'value2';
    
    assert.strictEqual(mockGlobalState[menuKey1], 'value1');
    
    await persist.clear();
    
    // State should be cleared from memory for menu keys
    assert.strictEqual(persist[menuKey1], undefined);
    assert.strictEqual(persist[menuKey2], undefined);
  });
});
