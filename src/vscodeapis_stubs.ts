// Stub definitions for VS Code APIs
// These are TypeScript interfaces that match the actual vscode API
// but we'll resolve to the real vscode module at runtime

export interface ExtensionContext {
  subscriptions: any[];
  extension: any;
  extensionPath: string;
  globalState: any;
  workspaceState: any;
  asAbsolutePath: (relativePath: string) => string;
  storagePath?: string;
  globalStoragePath: string;
  logPath: string;
  extensionUri: any;
  environmentVariableCollection: any;
  secrets: any;
  storageUri: any;
  globalStorageUri: any;
  logUri: any;
  extensionMode: any;
  extensionKind: any;
  languageModelAccessInformation: any;
}

export interface TextDocument {
  uri: any;
  fileName: string;
  isUntitled: boolean;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;
  save(): Promise<boolean>;
  getText(range?: any): string;
  getWordRangeAtPosition(position: any): any;
  validateRange(range: any): any;
  positionAt(offset: number): any;
  offsetAt(position: any): number;
  lineAt(lineOrPosition: number | any): any;
  getText(range?: any): string;
}

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Selection extends Range {
  anchor: Position;
  active: Position;
}

export interface TextEditor {
  document: TextDocument;
  selection: Selection;
  selections: Selection[];
  visibleRanges: Range[];
  options: any;
  viewColumn?: any;
  edit(callback: (editBuilder: any) => void): Promise<boolean>;
  insertSnippet(snippet: any, location?: any): Promise<boolean>;
  setDecorations(decorationType: any, rangesOrOptions: any): void;
  revealRange(range: Range, revealType?: any): void;
  show(column?: any): void;
  hide(): void;
}

export interface TextEditorEdit {
  replace(location: any, value: string): void;
  insert(location: any, value: string): void;
  delete(location: any): void;
  setEndOfLine(endOfLine: any): void;
}

export interface OutputChannel {
  name: string;
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(preserveFocus?: boolean): void;
  show(column?: any, preserveFocus?: boolean): void;
  hide(): void;
  dispose(): void;
}

export interface StatusBarItem {
  alignment: any;
  priority: number;
  name?: string;
  text: string;
  tooltip?: string;
  color?: string;
  backgroundColor?: any;
  command?: string;
  accessibilityInformation?: any;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface Disposable {
  dispose(): void;
}

export interface Command {
  command: string;
  title: string;
  category?: string;
  arguments?: any[];
}

export interface Uri {
  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;
  fsPath: string;
  with(change: any): Uri;
  toString(): string;
  toJSON(): any;
}

export interface WorkspaceFolder {
  uri: Uri;
  name: string;
  index: number;
}

export interface WorkspaceConfiguration {
  get(section: string): any;
  get(section: string, defaultValue: any): any;
  has(section: string): boolean;
  inspect(section: string): any;
  update(section: string, value: any, configurationTarget?: any): Promise<void>;
}

export interface FileSystemWatcher extends Disposable {
  ignoreCreateEvents: boolean;
  ignoreChangeEvents: boolean;
  ignoreDeleteEvents: boolean;
}

export interface FileSystem {
  readFile(uri: Uri): Promise<Uint8Array>;
  readFile(uri: Uri, encoding: any): Promise<string>;
  writeFile(uri: Uri, content: Uint8Array | string): Promise<void>;
  delete(uri: Uri): Promise<void>;
  rename(source: Uri, target: Uri, options?: any): Promise<void>;
  copy(source: Uri, target: Uri, options?: any): Promise<void>;
  createDirectory(uri: Uri): Promise<void>;
  readDirectory(uri: Uri): Promise<[string, any][]>;
  stat(uri: Uri): Promise<any>;
  watch(uri: Uri, options?: any): FileSystemWatcher;
}

export interface Window {
  activeTextEditor?: TextEditor;
  visibleTextEditors: TextEditor[];
  onDidChangeActiveTextEditor: any;
  onDidChangeVisibleTextEditors: any;
  onDidChangeTextEditorSelection: any;
  onDidChangeTextEditorVisibleRanges: any;
  showTextDocument(
    document: TextDocument,
    column?: any,
    preserveFocus?: boolean
  ): Promise<TextEditor>;
  showTextDocument(document: Uri, column?: any, preserveFocus?: boolean): Promise<TextEditor>;
  createTextEditorDecorationType(options: any): any;
  showInformationMessage(message: string, ...items: any[]): Promise<any>;
  showWarningMessage(message: string, ...items: any[]): Promise<any>;
  showErrorMessage(message: string, ...items: any[]): Promise<any>;
  showQuickPick(items: any[], options?: any): Promise<any>;
  showInputBox(options?: any): Promise<string | undefined>;
  showOpenDialog(options: any): Promise<Uri[] | undefined>;
  showSaveDialog(options: any): Promise<Uri | undefined>;
  setStatusBarMessage(text: string, hideAfterTimeout?: number): any;
  withProgress<R>(options: any, task: any): Promise<R>;
  createOutputChannel(name: string): OutputChannel;
  createStatusBarItem(alignment?: any, priority?: number): StatusBarItem;
  registerTreeDataProvider(viewId: string, treeDataProvider: any): Disposable;
  createTreeView(viewId: string, options: any): any;
  registerWebviewViewProvider(viewId: string, provider: any, options?: any): Disposable;
  registerWebviewPanelSerializer(viewType: string, serializer: any): Disposable;
  createWebviewPanel(viewType: string, title: string, showOptions: any, options?: any): any;
}

export interface Workspace {
  name?: string;
  rootPath: string | undefined;
  rootFolders: WorkspaceFolder[];
  onDidChangeWorkspaceFolders: any;
  onDidChangeConfiguration: any;
  getConfiguration(section?: string, resource?: Uri): WorkspaceConfiguration;
  findFiles(include: string, exclude?: string, maxResults?: number, token?: any): Promise<Uri[]>;
  saveAll(includeUntitled?: boolean): Promise<boolean>;
  applyEdit(edit: any): Promise<boolean>;
  openTextDocument(uri: Uri): Promise<TextDocument>;
  openTextDocument(fileName: string): Promise<TextDocument>;
  openTextDocument(options?: any): Promise<TextDocument>;
  registerTextDocumentContentProvider(scheme: string, provider: any): Disposable;
  registerFileSystemProvider(scheme: string, provider: any, options?: any): Disposable;
  createFileSystemWatcher(
    globPattern: string,
    ignoreCreateEvents?: boolean,
    ignoreChangeEvents?: boolean,
    ignoreDeleteEvents?: boolean
  ): FileSystemWatcher;
}

export interface Commands {
  registerCommand(command: string, callback: any, thisArg?: any): Disposable;
  registerTextEditorCommand(command: string, callback: any, thisArg?: any): Disposable;
  executeCommand(command: string, ...args: any[]): Promise<any | undefined>;
  getCommands(filterInternal?: boolean): Promise<string[]>;
}

export interface Languages {
  getLanguages(): Promise<string[]>;
  changeLanguage(document: TextDocument, languageId: string): Promise<TextDocument>;
  setLanguageConfiguration(language: string, configuration: any): Disposable;
  registerCompletionItemProvider(
    selector: any,
    provider: any,
    ...triggerCharacters: string[]
  ): Disposable;
  registerHoverProvider(selector: any, provider: any): Disposable;
  registerSignatureHelpProvider(
    selector: any,
    provider: any,
    ...triggerCharacters: string[]
  ): Disposable;
  registerDefinitionProvider(selector: any, provider: any): Disposable;
  registerImplementationProvider(selector: any, provider: any): Disposable;
  registerTypeDefinitionProvider(selector: any, provider: any): Disposable;
  registerCodeLensProvider(selector: any, provider: any): Disposable;
  registerCodeActionsProvider(selector: any, provider: any, metadata?: any): Disposable;
  registerDocumentFormattingEditProvider(selector: any, provider: any): Disposable;
  registerDocumentRangeFormattingEditProvider(selector: any, provider: any): Disposable;
  registerOnTypeFormattingEditProvider(
    selector: any,
    provider: any,
    firstTriggerCharacter: string,
    ...moreTriggerCharacters: string[]
  ): Disposable;
  registerRenameProvider(selector: any, provider: any): Disposable;
  registerDocumentHighlightProvider(selector: any, provider: any): Disposable;
  registerDocumentSymbolProvider(selector: any, provider: any, metadata?: any): Disposable;
  registerWorkspaceSymbolProvider(provider: any): Disposable;
  registerReferenceProvider(selector: any, provider: any): Disposable;
  registerFoldingRangeProvider(selector: any, provider: any): Disposable;
  registerSelectionRangeProvider(selector: any, provider: any): Disposable;
  setTextDocumentLanguage(document: TextDocument, languageId: string): Promise<TextDocument>;
}

export interface Debug {
  startDebugging(
    folder: WorkspaceFolder | undefined,
    nameOrConfiguration: string | any,
    parentSessionOrConfig?: any
  ): Promise<boolean>;
  onDidStartDebugSession: any;
  onDidReceiveDebugSessionCustomEvent: any;
  onDidTerminateDebugSession: any;
  onDidChangeActiveDebugSession: any;
  activeDebugSession: any;
  breakpoints: any[];
  onDidChangeBreakpoints: any;
}

export interface Ext {
  getExtension(extensionId: string): any | undefined;
  all: any[];
  onDidChange: any;
}

// Main vscode namespace
export interface VSCodeAPI {
  ExtensionContext: new (context: any) => ExtensionContext;
  TextDocument: new (document: any) => TextDocument;
  Position: new (line: number, character: number) => Position;
  Range: new (start: Position, end: Position) => Range;
  Selection: new (anchor: Position, active: Position) => Selection;
  TextEditor: new (editor: any) => TextEditor;
  Uri: {
    file(path: string): Uri;
    parse(value: string): Uri;
    joinPath(base: Uri, ...pathSegments: string[]): Uri;
  };
  window: Window;
  workspace: Workspace;
  commands: Commands;
  languages: Languages;
  debug: Debug;
  extensions: Ext;
  Disposable: {
    from(...disposables: Disposable[]): Disposable;
  };
}
