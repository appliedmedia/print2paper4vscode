import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// State for tracking
const osState2 = {
  tempDir: '',
};

// -- Given steps ---------------------------------------------------------

Given('fileRead will encounter invalid YAML', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Create a temp file with invalid YAML content
  osState2.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2p-test-'));
  const badYamlPath = path.join(osState2.tempDir, 'bad.yaml');
  fs.writeFileSync(badYamlPath, '{{{{invalid yaml: [[[', { mode: 0o644 });
});

Given('shiki themes dir exists with no light themes', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  // Set extensionRoot to a temp dir with shiki themes dir that has no light themes
  osState2.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2p-test-'));
  const themesDir = path.join(osState2.tempDir, 'node_modules', 'shiki', 'themes');
  fs.mkdirSync(themesDir, { recursive: true });
  // Add only dark theme files
  fs.writeFileSync(path.join(themesDir, 'monokai-dark.json'), '{}', { mode: 0o644 });
  fs.writeFileSync(path.join(themesDir, 'dracula-dark.json'), '{}', { mode: 0o644 });
  (world.app.os as any).extensionRoot = osState2.tempDir;
});

Given('extensionRoot and webview panel are configured', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  (world.app.os as any).extensionRoot = process.cwd();
  (world.app.os as any).fn.vscodeapis.getPanelForUriConversion = () => ({
    webview: {
      asWebviewUri: (uri: any) => ({ toString: () => `vscode-webview://test/${uri.fsPath || uri.path || uri}` }),
    },
  });
  (world.app.os as any).fn.vscodeapis.uriFromPath = (p: string) => ({
    fsPath: p,
    path: p,
    toString: () => `file://${p}`,
  });
});

// -- When steps ----------------------------------------------------------

When('I read a file with bad YAML content', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const badYamlPath = path.join(osState2.tempDir, 'bad.yaml');
  world.result = world.app.os.fileRead({ path: badYamlPath });
});

When('I delete a non-existent file path', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  try {
    world.app.os.fileDelete('/tmp/nonexistent-file-p2p-test-12345.txt');
    world.error = null;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I convert HTML with src attributes to URI', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.result = world.app.os.htmlSrcPathToURI({
    html: '<img src="images/logo.png"><script src="http://cdn.example.com/lib.js"></script><div>{{as_uri:styles/main.css}}</div>',
    webviewPanelId: 'test-panel' as any,
  });
});

// -- Then steps ----------------------------------------------------------

Then('the file read result should be undefined', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, undefined, 'Should return undefined');
});

Then('the result should contain converted URIs', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const result = world.result as string;
  assert.ok(result, 'Result should exist');
  // The relative src should have been converted
  assert.ok(
    result.includes('vscode-webview://') || result.includes('file://'),
    `Result should contain converted URIs, got: ${result}`
  );
  // The http URL should remain unchanged
  assert.ok(
    result.includes('http://cdn.example.com/lib.js'),
    'HTTP URLs should remain unchanged'
  );
});
