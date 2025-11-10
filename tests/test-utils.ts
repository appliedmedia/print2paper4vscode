import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
export const mockContext = {
  subscriptions: [],
  extensionPath: process.cwd(),
  globalState: {
    get: () => undefined,
    update: () => Promise.resolve(),
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

export const mockVSCode = {
  commands: { registerCommand: () => ({ dispose: () => {} }) },
  window: {
    showErrorMessage: () => Promise.resolve(),
    showInformationMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    setStatusBarMessage: () => ({ dispose: () => {} }),
    createWebviewPanel: () => ({
      webview: {
        html: '',
        asWebviewUri: (uri: any) => uri,
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
        activeTab: {
          label: 'test-file.js',
        },
      },
    },
  },
  workspace: {
    getConfiguration: () => ({
      get: (key: string) => {
        if (key === 'fontSize') return 14;
        if (key === 'lineHeight') return 1.5;
        if (key === 'fontFamily') return 'Monaco';
        return undefined;
      },
    }),
  },
  Uri: { 
    file: (path: string) => ({ fsPath: path, path, toString: () => `file://${path}` }),
    parse: (str: string) => ({ fsPath: str, path: str, toString: () => str }),
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  ViewColumn: {
    Active: 1,
    Beside: 2,
    One: 1,
    Two: 2,
    Three: 3,
  },
  extensions: {
    all: [],
    getExtension: () => ({
      extensionPath: process.cwd(),
      packageJSON: { name: 'test-extension' },
    }),
  },
  env: {
    language: 'en',
  },
} as any;
