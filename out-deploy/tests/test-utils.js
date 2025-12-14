"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockVSCode = exports.mockContext = void 0;
// Mock VS Code context and APIs
exports.mockContext = {
    subscriptions: [],
    extensionPath: process.cwd(),
    globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
    },
    globalStorageUri: { fsPath: '/tmp' },
};
exports.mockVSCode = {
    commands: { registerCommand: () => ({ dispose: () => { } }) },
    window: {
        showErrorMessage: () => Promise.resolve(),
        showInformationMessage: () => Promise.resolve(),
        showWarningMessage: () => Promise.resolve(),
        showSaveDialog: () => Promise.resolve(undefined),
        showQuickPick: (items) => Promise.resolve(items[0]),
        setStatusBarMessage: () => ({ dispose: () => { } }),
        createWebviewPanel: () => ({
            webview: {
                html: '',
                asWebviewUri: (uri) => uri,
                onDidReceiveMessage: () => ({ dispose: () => { } }),
                postMessage: () => Promise.resolve(true),
            },
            title: '',
            reveal: () => { },
            onDidDispose: () => ({ dispose: () => { } }),
            dispose: () => { },
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
            get: (key) => {
                if (key === 'fontSize')
                    return 14;
                if (key === 'lineHeight')
                    return 1.5;
                if (key === 'fontFamily')
                    return 'Monaco';
                return undefined;
            },
        }),
    },
    Uri: {
        file: (path) => ({ fsPath: path, path, toString: () => `file://${path}` }),
        parse: (str) => ({ fsPath: str, path: str, toString: () => str }),
    },
    Range: class Range {
        start;
        end;
        constructor(start, end) {
            this.start = start;
            this.end = end;
        }
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
};
//# sourceMappingURL=test-utils.js.map