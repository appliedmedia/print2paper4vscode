import type * as vscode from 'vscode';
import { App } from '../src/App.js';
import type { VSCodeAPIs } from '../src/VSCodeAPIs.js';
import type { UI } from '../src/UI.js';
import type { PDF } from '../src/PDF.js';
import type { PaperPrinter } from '../src/PaperPrinter.js';
import type { Stylize } from '../src/Stylize.js';
import type { TabInspector } from '../src/TabInspector.js';
import type { OS } from '../src/OS.js';
import type { UIMenuMgr } from '../src/UIMenuMgr.js';
import type { Coords } from '../src/Coords.js';
import type { UIWebView } from '../src/UIWebView.js';

// Mock VS Code context and APIs
export const mockContext = {
  subscriptions: [],
  extensionPath: process.cwd(),
  globalState: {
    get: () => undefined,
    update: () => Promise.resolve(),
  },
  globalStorageUri: { fsPath: '/tmp' },
  extension: {
    id: 'appliedmedia.print2paper4vscode',
    packageJSON: { name: 'test-extension', contributes: {} },
  },
} as unknown as vscode.ExtensionContext;

interface MockVSCode {
  commands: {
    registerCommand: () => vscode.Disposable;
  };
  window: {
    showErrorMessage: () => Promise<void>;
    showInformationMessage: () => Promise<void>;
    showWarningMessage: () => Promise<void>;
    showQuickPick: (items: any[]) => Promise<any>;
    setStatusBarMessage: () => vscode.Disposable;
    createWebviewPanel: () => {
      webview: {
        html: string;
        asWebviewUri: (uri: vscode.Uri) => vscode.Uri;
        onDidReceiveMessage: () => vscode.Disposable;
        postMessage: () => Promise<boolean>;
      };
      title: string;
      reveal: () => void;
      onDidDispose: () => vscode.Disposable;
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
  Range: typeof vscode.Range;
  ViewColumn: typeof vscode.ViewColumn;
  extensions: {
    all: vscode.Extension<unknown>[];
    getExtension: () => {
      extensionPath: string;
      packageJSON: { name: string };
    };
  };
  env: {
    language: string;
    appName: string;
  };
}

export const mockVSCode = {
  commands: { registerCommand: () => ({ dispose: () => {} }) },
  window: {
    showErrorMessage: () => Promise.resolve(),
    showInformationMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    showSaveDialog: () => Promise.resolve(undefined),
    showQuickPick: (items: any[]) => Promise.resolve(items[0]),
    setStatusBarMessage: () => ({ dispose: () => {} }),
    createWebviewPanel: () => ({
      webview: {
        html: '',
        asWebviewUri: (uri: vscode.Uri) => uri,
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
  } as unknown as typeof vscode.Range,
  ViewColumn: {
    Active: 1,
    Beside: 2,
    One: 1,
    Two: 2,
    Three: 3,
  } as unknown as typeof vscode.ViewColumn,
  extensions: {
    all: [],
    getExtension: () => ({
      extensionPath: process.cwd(),
      packageJSON: { name: 'test-extension' },
    }),
  },
  env: {
    language: 'en',
    appName: 'Visual Studio Code',
  },
} as unknown as typeof vscode;

/**
 * Test-only App wrapper that adds component getters for convenience.
 * Production code uses this.fn.component.method() pattern.
 * Tests need direct instance access for checking state.
 */
export interface TestApp extends App {
  readonly vscodeapis: VSCodeAPIs;
  readonly ui: UI;
  readonly pdf: PDF;
  readonly paperprinter: PaperPrinter;
  readonly stylize: Stylize;
  readonly tabinspector: TabInspector;
  readonly os: OS;
  readonly uimenumgr: UIMenuMgr;
  readonly coords: Coords;
  readonly uiwebview: UIWebView;
}

/**
 * Create App instance with test-only component getters.
 * Use this instead of `new App()` in tests.
 */
export function createTestApp(args: { context: vscode.ExtensionContext; vscode: typeof import('vscode') }): TestApp {
  const app = new App(args);
  const reg = app.reg;
  
  // Add test-only getters for component access
  Object.defineProperties(app, {
    vscodeapis: {
      get() { 
        const c = reg.getInstance('vscodeapis');
        if (!c) throw new Error("Component 'vscodeapis' not registered");
        return c as VSCodeAPIs;
      }
    },
    ui: {
      get() { 
        const c = reg.getInstance('ui');
        if (!c) throw new Error("Component 'ui' not registered");
        return c as UI;
      }
    },
    pdf: {
      get() { 
        const c = reg.getInstance('pdf');
        if (!c) throw new Error("Component 'pdf' not registered");
        return c as PDF;
      }
    },
    paperprinter: {
      get() { 
        const c = reg.getInstance('paperprinter');
        if (!c) throw new Error("Component 'paperprinter' not registered");
        return c as PaperPrinter;
      }
    },
    stylize: {
      get() { 
        const c = reg.getInstance('stylize');
        if (!c) throw new Error("Component 'stylize' not registered");
        return c as Stylize;
      }
    },
    tabinspector: {
      get() { 
        const c = reg.getInstance('tabinspector');
        if (!c) throw new Error("Component 'tabinspector' not registered");
        return c as TabInspector;
      }
    },
    os: {
      get() { 
        const c = reg.getInstance('os');
        if (!c) throw new Error("Component 'os' not registered");
        return c as OS;
      }
    },
    uimenumgr: {
      get() { 
        const c = reg.getInstance('uimenumgr');
        if (!c) throw new Error("Component 'uimenumgr' not registered");
        return c as UIMenuMgr;
      }
    },
    coords: {
      get() { 
        const c = reg.getInstance('coords');
        if (!c) throw new Error("Component 'coords' not registered");
        return c as Coords;
      }
    },
    uiwebview: {
      get() { 
        const c = reg.getInstance('uiwebview');
        if (!c) throw new Error("Component 'uiwebview' not registered");
        return c as UIWebView;
      }
    },
  });
  
  return app as TestApp;
}
