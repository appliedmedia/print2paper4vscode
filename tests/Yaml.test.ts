import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { Yaml } from '../src/Yaml.js';
import { App } from '../src/App.js';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { mockContext, mockVSCode } from './test-utils.js';

describe('Yaml', () => {
  let app: App;
  let tempDir: string;
  let yamlPath: string;

  beforeEach(() => {
    app = new App({ context: mockContext, vscode: mockVSCode });
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

    const yaml = Yaml.create(app, yamlPath, { key1: '', key2: '' });

    const result = yaml.get();
    assert.strictEqual(result.key1, 'value1');
    assert.strictEqual(result.key2, 'value2');

    // Should return cached value on second call
    const result2 = yaml.get();
    assert.strictEqual(result, result2); // Same object reference
  });

  it('should return default structure when file does not exist', () => {
    const yaml = Yaml.create(app, path.join(tempDir, 'nonexistent.yaml'), { key1: 'default1', key2: 'default2' });

    const result = yaml.get();
    assert.strictEqual(result.key1, 'default1');
    assert.strictEqual(result.key2, 'default2');
  });

  it('should use default when file read fails', () => {
    const yaml = Yaml.create(app, '/invalid/path/that/does/not/exist.yaml', { key1: 'default' });

    const result = yaml.get();
    assert.strictEqual(result.key1, 'default');
  });

  it('should clear cache on done()', () => {
    const yamlContent = 'key1: value1';
    fs.writeFileSync(yamlPath, yamlContent);

    const yaml = Yaml.create(app, yamlPath, { key1: '' });

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

    const yaml = Yaml.create<any>(app, yamlPath, {});

    const result = yaml.get();
    assert.ok(result.nested);
    assert.strictEqual(result.nested.key1, 'value1');
    assert.ok(Array.isArray(result.array));
    assert.strictEqual(result.array.length, 2);
  });
});
