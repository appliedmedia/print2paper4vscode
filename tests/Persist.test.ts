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
  let persist: Persist;

  beforeEach(() => {
    mockGlobalState = {}; // Reset state before each test
    app = new App({ context: mockContext, vscode: mockVSCode });
    persist = app.reg.getInstance<Persist>('persist')!;
  });

  afterEach(() => {
    app.done();
  });

  it('should register and retrieve a property', () => {
    persist.set('testKey', 'testValue');
    assert.strictEqual(persist.get('testKey'), 'testValue');
  });

  it('should use default value when no value is set', async () => {
    await persist.validateDefault({ name: 'theme', computeFn: async () => 'github-light' });
    
    assert.strictEqual(persist.get('theme'), 'github-light');
  });

  it('should persist values to global state', () => {
    persist.set('testKey', 'persistedValue');
    
    assert.strictEqual(mockGlobalState['testKey'], 'persistedValue');
  });

  it('should retrieve from global state on second access', () => {
    // Set value in global state directly
    mockGlobalState['existingKey'] = 'existingValue';
    
    const value = persist.get('existingKey');
    
    assert.strictEqual(value, 'existingValue');
  });

  it('should use default when value is not in global state or cache', async () => {
    await persist.validateDefault({ name: 'newKey', computeFn: async () => 'defaultValue' });
    
    assert.strictEqual(persist.get('newKey'), 'defaultValue');
    // Should also be persisted to global state
    assert.strictEqual(mockGlobalState['newKey'], 'defaultValue');
  });

  it('should not update global state for empty string values', () => {
    persist.set('emptyKey', '');
    
    // Empty string should not persist to global state
    assert.strictEqual(mockGlobalState['emptyKey'], undefined);
    // But should be in memory cache
    assert.strictEqual(persist.get('emptyKey'), '');
  });

  it('should return same default on multiple validateDefault calls', async () => {
    const default1 = await persist.validateDefault({ name: 'key', computeFn: async () => 'default' });
    const default2 = await persist.validateDefault({ name: 'key', computeFn: async () => 'different' });
    
    assert.strictEqual(default1, 'default');
    assert.strictEqual(default2, 'default'); // Should return cached default
  });

  it('should handle multiple registered properties', () => {
    persist.set('key1', 'value1');
    persist.set('key2', 'value2');
    
    assert.strictEqual(persist.get('key1'), 'value1');
    assert.strictEqual(persist.get('key2'), 'value2');
  });

  it('should update global state when value changes', () => {
    persist.set('changeable', 'value1');
    assert.strictEqual(mockGlobalState['changeable'], 'value1');
    
    persist.set('changeable', 'value2');
    assert.strictEqual(mockGlobalState['changeable'], 'value2');
  });

  it('should not update global state when value does not change', () => {
    persist.set('unchanged', 'same');
    
    const callCountBefore = Object.keys(mockGlobalState).length;
    persist.set('unchanged', 'same'); // Set same value again
    
    // Global state should not be updated (no new keys)
    const callCountAfter = Object.keys(mockGlobalState).length;
    assert.strictEqual(callCountBefore, callCountAfter);
  });

  it('should handle different value types', () => {
    persist.set('stringKey', 'string');
    persist.set('numberKey', 42);
    
    assert.strictEqual(persist.get('stringKey'), 'string');
    assert.strictEqual(persist.get('numberKey'), 42);
  });

  it('should clear persist state', async () => {
    // Import kMenuId to know what keys clear() actually clears
    const { kMenuId } = await import('../src/UIMenu.js');
    
    // Set actual menu keys that clear() will remove
    const menuKey1 = kMenuId[0];
    const menuKey2 = kMenuId.length > 1 ? kMenuId[1] : 'toolbar_pos';
    
    persist.set(menuKey1, 'value1');
    persist.set(menuKey2, 'value2');
    
    assert.strictEqual(mockGlobalState[menuKey1], 'value1');
    
    await Persist.clear({ reg: app.reg });
    
    // State should be cleared from memory for menu keys
    assert.strictEqual(persist.get(menuKey1), undefined);
    assert.strictEqual(persist.get(menuKey2), undefined);
  });
});
