import { Given, When, Then, After } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import type { P2PWorld } from '../world.js';
import type { Yaml, YamlInstance } from '../../../out/src/Yaml.js';

interface YamlWorld extends P2PWorld {
  tempDir: string;
  yamlPath: string;
  yamlInstance: YamlInstance<Record<string, unknown>>;
  yamlResult: Record<string, unknown>;
  previousResult: Record<string, unknown>;
}

// Creates a unique temp directory for one scenario and sets world.tempDir /
// world.yamlPath. Uses fs.mkdtempSync so uniqueness does not depend on
// millisecond granularity of Date.now().
function initTempYamlPath(world: YamlWorld, fileName = 'test.yaml'): void {
  world.tempDir = fs.mkdtempSync(path.join(tmpdir(), 'yaml-test-'));
  world.yamlPath = path.join(world.tempDir, fileName);
}

// Returns the `yaml` factory registered on the app registry, or fails with an
// explicit error if the wiring is broken. Replaces a non-null-assert that
// would otherwise throw a vague "Cannot read properties of undefined" error.
function getYamlFactory(world: YamlWorld): Yaml {
  const yamlFactory = world.app.reg.getInstance<Yaml>('yaml');
  assert.ok(yamlFactory, 'Registry component "yaml" is not registered');
  return yamlFactory;
}

// -- Given steps ----------------------------------------------------------

Given('a temp YAML file containing {string}', (t: TestCaseContext, content: string) => {
  const world = t.world as YamlWorld;
  initTempYamlPath(world);
  // Unescape the \n in the string from Gherkin
  fs.writeFileSync(world.yamlPath, content.replace(/\\n/g, '\n'));
});

Given('a temp YAML file with nested content', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  initTempYamlPath(world);
  const content = `nested:\n  key1: value1\n  key2: value2\narray:\n  - item1\n  - item2\n`;
  fs.writeFileSync(world.yamlPath, content);
});

Given('a nonexistent YAML file path', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  initTempYamlPath(world, 'nonexistent.yaml');
});

Given('an invalid YAML file path', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  world.yamlPath = '/invalid/path/that/does/not/exist.yaml';
});

// -- When steps -----------------------------------------------------------

When('I create a Yaml instance with defaults \\{key1: {string}, key2: {string}}', (t: TestCaseContext, val1: string, val2: string) => {
  const world = t.world as YamlWorld;
  const yamlFactory = getYamlFactory(world);
  world.yamlInstance = yamlFactory.create({ filePath: world.yamlPath, dataStruct: { key1: val1, key2: val2 } });
});

When('I create a Yaml instance with defaults \\{key1: {string}}', (t: TestCaseContext, val: string) => {
  const world = t.world as YamlWorld;
  const yamlFactory = getYamlFactory(world);
  world.yamlInstance = yamlFactory.create({ filePath: world.yamlPath, dataStruct: { key1: val } });
});

When('I create a Yaml instance with empty defaults', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  const yamlFactory = getYamlFactory(world);
  world.yamlInstance = yamlFactory.create<Record<string, unknown>>({ filePath: world.yamlPath, dataStruct: {} });
});

When('I call get\\()', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  world.yamlResult = world.yamlInstance.get() as Record<string, unknown>;
});

When('I call get\\() again', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  world.previousResult = world.yamlResult;
  world.yamlResult = world.yamlInstance.get() as Record<string, unknown>;
});

When('I call done\\() on the Yaml instance', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  world.yamlInstance.done();
});

When('I update the temp YAML file to {string}', (t: TestCaseContext, content: string) => {
  const world = t.world as YamlWorld;
  fs.writeFileSync(world.yamlPath, content.replace(/\\n/g, '\n'));
});

// -- Then steps -----------------------------------------------------------

Then('the YAML result key {string} should be {string}', (t: TestCaseContext, key: string, expected: string) => {
  const world = t.world as YamlWorld;
  assert.strictEqual(world.yamlResult[key], expected);
});

Then('the cached result should be the same object reference', (t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  assert.strictEqual(world.yamlResult, world.previousResult);
});

Then('the YAML result should have nested key {string} equal to {string}', (t: TestCaseContext, dotPath: string, expected: string) => {
  const world = t.world as YamlWorld;
  const keys = dotPath.split('.');
  let value: unknown = world.yamlResult;
  for (const k of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      assert.fail(`Expected nested path "${dotPath}" to exist but hit ${value === null ? 'null' : typeof value} at segment "${k}"`);
    }
    value = (value as Record<string, unknown>)[k];
  }
  assert.strictEqual(value, expected);
});

Then('the YAML result should have an array {string} with {int} items', (t: TestCaseContext, key: string, count: number) => {
  const world = t.world as YamlWorld;
  const arr = world.yamlResult[key];
  assert.ok(Array.isArray(arr), `Expected "${key}" to be an array`);
  assert.strictEqual((arr as unknown[]).length, count);
});

// -- Teardown -------------------------------------------------------------

// Cleans up the per-scenario temp directory created under os.tmpdir(). Without
// this hook repeated local runs accumulate orphaned `yaml-test-*` dirs.
After((t: TestCaseContext) => {
  const world = t.world as YamlWorld;
  if (world && world.tempDir && fs.existsSync(world.tempDir)) {
    fs.rmSync(world.tempDir, { recursive: true, force: true });
    world.tempDir = '';
  }
});
