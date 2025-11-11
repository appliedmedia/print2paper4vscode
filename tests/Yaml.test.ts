import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { Yaml } from '../src/Yaml.js';
import { App } from '../src/App.js';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import type * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
const mockContext = {
  subscriptions: [],
  globalState: {
    get: () => undefined,
    update: () => {},
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

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

describe('Yaml', () => {
  let app: App;
  let tempDir: string;
  let yamlPath: string;

  beforeEach(() => {
    app = new App(mockContext, mockVSCode);
    tempDir = path.join(tmpdir(), `yaml-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    yamlPath = path.join(tempDir, 'test.yaml');
  });

  afterEach(() => {
    app.done();
    // Cleanup temp files
    try {
      if (fs.existsSync(yamlPath)) {
        fs.unlinkSync(yamlPath);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should load and cache YAML file', () => {
    const yamlContent = 'key1: value1\nkey2: value2';
    fs.writeFileSync(yamlPath, yamlContent);

    const yaml = new Yaml<{ key1: string; key2: string }>(
      app,
      yamlPath,
      { key1: '', key2: '' }
    );
    yaml.init();

    const result = yaml.get();
    assert.strictEqual(result.key1, 'value1');
    assert.strictEqual(result.key2, 'value2');

    // Should return cached value on second call
    const result2 = yaml.get();
    assert.strictEqual(result, result2); // Same object reference
  });

  it('should return default structure when file does not exist', () => {
    const yaml = new Yaml<{ key1: string; key2: string }>(
      app,
      path.join(tempDir, 'nonexistent.yaml'),
      { key1: 'default1', key2: 'default2' }
    );
    yaml.init();

    const result = yaml.get();
    assert.strictEqual(result.key1, 'default1');
    assert.strictEqual(result.key2, 'default2');
  });

  it('should use default when file read fails', () => {
    const yaml = new Yaml<{ key1: string }>(
      app,
      '/invalid/path/that/does/not/exist.yaml',
      { key1: 'default' }
    );
    yaml.init();

    const result = yaml.get();
    assert.strictEqual(result.key1, 'default');
  });

  it('should clear cache on done()', () => {
    const yamlContent = 'key1: value1';
    fs.writeFileSync(yamlPath, yamlContent);

    const yaml = new Yaml<{ key1: string }>(
      app,
      yamlPath,
      { key1: '' }
    );
    yaml.init();

    const result1 = yaml.get();
    assert.strictEqual(result1.key1, 'value1');

    yaml.done();

    // Update file
    fs.writeFileSync(yamlPath, 'key1: newvalue');

    // After done(), should reload
    const result2 = yaml.get();
    assert.strictEqual(result2.key1, 'newvalue');
  });

  it('should handle complex YAML structures', () => {
    const yamlContent = `
nested:
  key1: value1
  key2: value2
array:
  - item1
  - item2
`;
    fs.writeFileSync(yamlPath, yamlContent);

    const yaml = new Yaml<any>(
      app,
      yamlPath,
      {}
    );
    yaml.init();

    const result = yaml.get();
    assert.ok(result.nested);
    assert.strictEqual(result.nested.key1, 'value1');
    assert.ok(Array.isArray(result.array));
    assert.strictEqual(result.array.length, 2);
  });
});
