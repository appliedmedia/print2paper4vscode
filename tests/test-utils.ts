import type * as vscode from 'vscode';
import type { ExtensionContext, Uri, Range, ViewColumn, Extension, Disposable } from 'vscode';

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

interface MockVSCode {
  commands: {
    registerCommand: () => Disposable;
  };
  window: {
    showErrorMessage: () => Promise<void>;
    showInformationMessage: () => Promise<void>;
    showWarningMessage: () => Promise<void>;
    setStatusBarMessage: () => Disposable;
    createWebviewPanel: () => {
      webview: {
        html: string;
        asWebviewUri: (uri: Uri) => Uri;
        onDidReceiveMessage: () => Disposable;
        postMessage: () => Promise<boolean>;
      };
      title: string;
      reveal: () => void;
      onDidDispose: () => Disposable;
      dispose: () => void;
    };
    activeTextEditor: {
      document: {
        uri: { fsPath: string; path: string; toString: () => string };
        fileName: string;
        languageId: string;
        getText: () => string;
        lineCount: number;
      };
      selection: {
        isEmpty: boolean;
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
    };
    tabGroups: {
      activeTabGroup: {
        activeTab: {
          label: string;
        };
      };
    };
  };
  workspace: {
    getConfiguration: () => {
      get: (key: string) => string | number | undefined;
    };
  };
  Uri: {
    file: (path: string) => { fsPath: string; path: string; toString: () => string };
    parse: (str: string) => { fsPath: string; path: string; toString: () => string };
  };
  Range: typeof Range;
  ViewColumn: typeof ViewColumn;
  extensions: {
    all: Extension<unknown>[];
    getExtension: () => {
      extensionPath: string;
      packageJSON: { name: string };
    };
  };
  env: {
    language: string;
  };
}

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
        asWebviewUri: (uri: Uri) => uri,
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
    constructor(public start: { line: number; character: number }, public end: { line: number; character: number }) {}
  } as unknown as typeof Range,
  ViewColumn: {
    Active: 1,
    Beside: 2,
    One: 1,
    Two: 2,
    Three: 3,
  } as unknown as typeof ViewColumn,
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
} as unknown as typeof vscode;
