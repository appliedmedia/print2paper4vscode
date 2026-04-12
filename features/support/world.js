import { WorldCreator } from '@cucumber/node';
import { createTestApp } from '../../out/tests/test-utils.js';

/**
 * Custom World for Print2Paper Gherkin tests.
 * Holds TestApp state and bridges Gherkin scenarios to the application under test.
 *
 * @typedef {Object} P2PWorld
 * @property {import('../../out/tests/test-utils.js').TestApp} [app]
 * @property {Error} [error]
 */

/**
 * Create a fresh mockContext per call to avoid leaking subscriptions across scenarios.
 */
function createMockContext() {
  return /** @type {import('vscode').ExtensionContext} */ (/** @type {unknown} */ ({
    subscriptions: [],
    extensionPath: process.cwd(),
    globalState: {
      get: () => undefined,
      update: () => Promise.resolve(),
    },
    globalStorageUri: { fsPath: '/tmp' },
  }));
}

/**
 * Create a fresh mockVSCode per call to avoid leaking state across scenarios.
 */
function createMockVSCode() {
  return /** @type {typeof import('vscode')} */ (/** @type {unknown} */ ({
    commands: { registerCommand: () => ({ dispose: () => {} }) },
    window: {
      showErrorMessage: () => Promise.resolve(),
      showInformationMessage: () => Promise.resolve(),
      showWarningMessage: () => Promise.resolve(),
      showSaveDialog: () => Promise.resolve(undefined),
      showQuickPick: (/** @type {any[]} */ items) => Promise.resolve(items[0]),
      setStatusBarMessage: () => ({ dispose: () => {} }),
      createWebviewPanel: () => ({
        webview: {
          html: '',
          asWebviewUri: (/** @type {any} */ uri) => uri,
          onDidReceiveMessage: () => ({ dispose: () => {} }),
          postMessage: () => Promise.resolve(true),
        },
        title: '',
        reveal: () => {},
        onDidDispose: () => ({ dispose: () => {} }),
        dispose: () => {},
      }),
      activeTextEditor: {
        document: {
          uri: { fsPath: '/test/file.js', path: '/test/file.js', toString: () => 'file:///test/file.js' },
          fileName: '/test/file.js',
          languageId: 'javascript',
          getText: () => 'test code',
          lineCount: 1,
        },
        selection: {
          isEmpty: true,
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      },
      tabGroups: {
        activeTabGroup: {
          activeTab: { label: 'test-file.js' },
        },
      },
    },
    workspace: {
      getConfiguration: () => ({
        get: (/** @type {string} */ key) => {
          if (key === 'fontSize') return 14;
          if (key === 'lineHeight') return 1.5;
          if (key === 'fontFamily') return 'Monaco';
          return undefined;
        },
      }),
    },
    Uri: {
      file: (/** @type {string} */ p) => ({ fsPath: p, path: p, toString: () => `file://${p}` }),
      parse: (/** @type {string} */ str) => ({ fsPath: str, path: str, toString: () => str }),
    },
    Range: class Range {
      constructor(/** @type {any} */ start, /** @type {any} */ end) { this.start = start; this.end = end; }
    },
    ViewColumn: { Active: 1, Beside: 2, One: 1, Two: 2, Three: 3 },
    extensions: {
      all: [],
      getExtension: () => ({
        extensionPath: process.cwd(),
        packageJSON: { name: 'test-extension' },
      }),
    },
    env: { language: 'en' },
  }));
}

WorldCreator(() => {
  /** @type {P2PWorld} */
  const world = {};
  return world;
});

export { createTestApp, createMockContext, createMockVSCode };
