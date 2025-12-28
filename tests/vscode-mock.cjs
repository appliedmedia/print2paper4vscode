/**
 * Mock vscode module for Node.js tests
 * 
 * This file provides a minimal mock of the vscode API for running tests in Node.js.
 * The real vscode module only exists when code runs inside VS Code.
 */

class Range {
  constructor(startLine, startCharacter, endLine, endCharacter) {
    this.start = { line: startLine, character: startCharacter };
    this.end = { line: endLine, character: endCharacter };
  }
  
  get isEmpty() {
    return this.start.line === this.end.line && 
           this.start.character === this.end.character;
  }
}

class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
}

class WorkspaceEdit {
  constructor() {
    this.edits = [];
  }
  
  insert(uri, position, text) {
    this.edits.push({ type: 'insert', uri, position, text });
  }
  
  replace(uri, range, text) {
    this.edits.push({ type: 'replace', uri, range, text });
  }
}

const Uri = {
  file: (path) => ({ 
    fsPath: path, 
    scheme: 'file', 
    path,
    toString: () => `file://${path}`
  }),
  parse: (str) => ({ 
    fsPath: str, 
    scheme: 'untitled', 
    path: str,
    toString: () => `untitled:${str}`
  }),
};

const ViewColumn = {
  Active: 1,
  Beside: 2,
  One: 1,
  Two: 2,
  Three: 3,
};

module.exports = {
  Range,
  Position,
  WorkspaceEdit,
  Uri,
  ViewColumn,
  // Add other exports as needed
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
  },
  window: {
    showInformationMessage: (...args) => Promise.resolve(args[1]),
    showWarningMessage: (...args) => Promise.resolve(args[1]),
    showErrorMessage: (...args) => Promise.resolve(args[1]),
    showSaveDialog: () => Promise.resolve(undefined),
    setStatusBarMessage: () => ({ dispose: () => {} }),
    activeTextEditor: {
      document: {
        uri: Uri.file('/test/file.js'),
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
    createWebviewPanel: () => ({
      webview: {
        html: '',
        asWebviewUri: (uri) => uri,
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true),
      },
      title: '',
      reveal: () => {},
      onDidDispose: () => ({ dispose: () => {} }),
      dispose: () => {},
    }),
    showTextDocument: () => Promise.resolve(),
  },
  workspace: {
    getConfiguration: () => ({
      get: (key) => {
        if (key === 'fontSize') return 14;
        if (key === 'lineHeight') return 1.5;
        if (key === 'fontFamily') return 'Monaco';
        return undefined;
      },
    }),
    openTextDocument: () => Promise.resolve({
      uri: Uri.parse('untitled:untitled'),
      fileName: 'untitled',
      languageId: 'plaintext',
      getText: () => '',
      lineCount: 0,
    }),
    applyEdit: () => Promise.resolve(true),
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
  l10n: {
    uri: undefined,
  },
};
