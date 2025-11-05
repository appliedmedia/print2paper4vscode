import type { ExtensionContext } from 'vscode';

// Mock VS Code context and APIs
export const mockContext = {
  subscriptions: [],
  globalState: {
    get: () => undefined,
    update: () => {},
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

export const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
} as any;
