import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Given steps ---------------------------------------------------------

Given('getActiveTextEditor throws an error', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Mock at the fn level on TabInspector (eagerly-bound proxy bypass)
  (world.app.tabinspector as any).fn.vscodeapis.getActiveTextEditor = () => {
    throw new Error('Mock editor error');
  };
});

// -- When steps ----------------------------------------------------------

When('I detect the active tab category', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.tabinspector.detectActiveTabCategory();
});

When('I inspect the active tab', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = await world.app.tabinspector.inspectTab();
});

When('I inspect visible editors', async (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = await world.app.tabinspector.inspectVisibleEditors();
});

// -- Then steps ----------------------------------------------------------

Then('the tab metadata should be empty', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const meta = world.result as { code: string; language: string; fileName: string; filePath: string };
  assert.strictEqual(meta.code, '', 'Code should be empty');
  assert.strictEqual(meta.fileName, '', 'fileName should be empty');
  assert.strictEqual(meta.filePath, '', 'filePath should be empty');
});

Then('the result should be an empty array', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.ok(Array.isArray(world.result), 'Should return array');
  assert.strictEqual((world.result as unknown[]).length, 0, 'Array should be empty');
});
