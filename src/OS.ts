import * as fs from 'fs';
import * as path from 'path';
import { homedir, tmpdir } from 'os';
import { exec as cpExec, execSync as cpExecSync, execFile as cpExecFile } from 'child_process';
import { promisify } from 'util';
import { parse as yamlParse } from 'yaml';
import { performance } from 'node:perf_hooks';
import type { WebviewPanelId_t } from './VSCodeAPIs';
import type { FnImport_t } from './types/Registry_t';
import { Diagnostics } from './Diagnostics';
import type { Registry } from './Registry';
import type { Dir_t, Filename_t, Path_t, FileRead_t } from './types/OS_t';

// Re-export FileRead_t for backward compatibility
export type { FileRead_t };

/**
 * OS - Abstract base class for operating system operations
 *
 * Provides cross-platform abstractions for file system operations, path handling,
 * printing, and platform-specific operations. Factory method creates appropriate
 * platform implementation (OSMac, OSWin, OSLinux). Handles file I/O, YAML/JSON
 * parsing, URI conversion for webviews, and timestamp generation.
 *
 * @input app - Application instance for accessing shared services
 * @output Platform-agnostic file operations, path utilities, print dialogs, webview URIs
 *
 * @example
 * const os = OS.create(app);
 * const content = os.fileRead('src/config.yaml');
 * await os.fileOpenPrintDialog('/path/to/file.pdf');
 * os.fileWrite('/tmp/output.txt', 'content');
 */
export abstract class OS {
  static readonly id = 'os';
  // Performance timing from Node.js perf_hooks
  static performance = performance;
  protected reg: Registry;
  protected extensionRoot?: string;
  protected dx: Diagnostics;
  protected fn: FnImport_t;

  // Getter for extension root
  getExtensionRoot(): string | undefined {
    return this.extensionRoot;
  }

  constructor(args: { reg: Registry }) {
    this.reg = args.reg;
    // Request methods via Registry
    this.fn = this.reg.use(
      'vscodeapis.getExtensionPath',
      'vscodeapis.getPanelForUriConversion',
      'vscodeapis.uriFromPath',
      'ui.showErrorMessage',
      'utils.templateDictReplace'
    );
    this.dx = this.fn.dx.sub({ name: 'OS' });
    this.extensionRoot = this.fn.vscodeapis.getExtensionPath();
  }

  done(): void {
    this.dx?.done();
  }

  protected execAsync(cmd: string): Promise<{ stdout: string; stderr: string }> {
    const execP = promisify(cpExec);
    return execP(cmd);
  }

  protected execFileAsync(file: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    const execFileP = promisify(cpExecFile);
    return execFileP(file, args);
  }

  protected execSync(cmd: string): string {
    return cpExecSync(cmd, { encoding: 'utf8' }) as unknown as string;
  }

  static create(args: { reg: Registry }): OS {
    // Using process.platform instead of os.platform() for robustness:
    // - process.platform is available immediately on Node.js startup
    // - os.platform() requires module loading and can throw errors
    // - process.platform is more commonly used in Node.js ecosystem
    // - Both return identical values, but process.platform is more reliable
    if (process?.platform === 'win32') {
      return new OSWin(args);
    } else if (process?.platform === 'linux') {
      return new OSLinux(args);
    } else if (process?.platform === 'darwin') {
      return new OSMac(args);
    } else {
      const platform = process?.platform || 'unknown';
      const msg = `Cannot determine operating system. Platform "${platform}" is not supported. ` +
        `Supported platforms: win32, linux, darwin.`;
      // Cannot use dx.error here - static factory method, no dx available yet
      console.error(`❌ ERROR: ${msg}`);
      throw new Error(msg);
    }
  }

  abstract fileOpenInDefaultApp(path: string): Promise<void>;
  abstract fileReveal(path: string): Promise<void>;
  abstract filePrint(path: string): Promise<void>;
  abstract fileOpenPrintDialog(path: string): Promise<void>;

  /**
   * Escape file path for safe shell command execution
   * Platform-specific escaping for shell-special characters
   *
   * @param path - File path to escape
   * @returns Escaped path safe for shell command interpolation
   */
  protected abstract escapePath(path: string): string;

  // Get system locale with region (e.g., "en-US", "fr-FR")
  // Uses Intl API which actually provides region codes unlike vscode.env.language
  getLocale(): string {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  }

  // Platform-agnostic home directory
  getDir_Home(): string {
    return homedir();
  }

  // Platform-agnostic temp directory
  getDir_Temp(): string {
    return tmpdir();
  }

  // Platform-specific Documents directory - must be overridden by subclasses
  abstract getDir_Documents(): string;

  /**
   * Get OS-specific template variable replacements
   * Subclasses must implement this to return platform-specific key-value pairs
   * @returns Record of template variable names to their OS-specific values
   */
  protected abstract getOSKeys(): Record<string, string>;

  /**
   * Replace OS-specific template variables in a string
   * Composes template variables with OS-specific replacements and calls templateDictReplace
   * @param source - String containing template variables like {{os-ctrl-cmd}}
   * @returns String with all template variables replaced with OS-specific values
   * 
   * @example
   * os.dictReplace('{{os-ctrl-cmd}}+0') // Returns '⌘+0' on Mac, 'Ctrl+0' on Win/Linux
   */
  dictReplace(source: string): string {
    const osKeys = this.getOSKeys();
    // Use the app's templateDictReplace method via reg.app
    return this.fn.utils.templateDictReplace(source, osKeys);
  }

  // Common filesystem helpers consolidated here
  ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
  }

  /**
   * Resolve special directory constants to actual paths
   */
  private resolveDir(dir: Dir_t): string {
    let result = '';
    
    // Check if it's a resolver function (kDir constant)
    if (typeof dir === 'function') {
      result = dir(this);
    } else {
      // Literal path - validate security and structure
      const isBadPath = dir.includes('\0') || 
                        dir.trim().length === 0 || 
                        !path.isAbsolute(dir);
      
      if (isBadPath) {
        const msg = `Bad dir path: "${dir}"`;
        this.fn.ui.showErrorMessage(msg);
        throw new Error(msg);
      } else {
        this.dx.out(`Using dir: "${dir}"`);
        result = dir;
      }
    }
    
    return result;
  }

  fileWrite(args: { dir: Dir_t; filename: Filename_t; content: string | Buffer }): void {
    const dx = this.dx.sub({ name: 'fileWrite' });
    dx.require(args, ['dir', 'filename', 'content']);
    const { dir, filename, content } = args;
    try {
      const resolvedDir = this.resolveDir(dir);
      this.ensureDir(resolvedDir);
      const filePath = this.pathJoin(resolvedDir, filename);
      fs.writeFileSync(filePath, content, { mode: 0o644 });
    } catch (err) {
      const resolvedDir = this.resolveDir(dir);
      const filePath = this.pathJoin(resolvedDir, filename);
      dx.error(`Failed to write ${filePath}: ${err}`);
      throw err; // Re-throw to preserve existing behavior
    } finally {
      dx.done();
    }
  }


  fileDelete(targetPath: string): void {
    try {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    } catch {
      // ignore
    }
  }

  pathDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  // Smart file reader that handles everything
  fileRead<T = string>(args: { path: string; key?: string }): T | undefined {
    const dx = this.dx.sub({ name: 'fileRead' });
    dx.require(args, ['path']);
    const { path, key } = args;
    try {
      // Determine if this is an extension-relative path
      const isExtensionPath = !path.startsWith('/') && !path.includes(':\\');

      // Resolve the absolute path
      const absPath = isExtensionPath
        ? this.extensionRoot
          ? this.pathJoin(this.extensionRoot, path)
          : undefined
        : path;

      if (!absPath || !fs.existsSync(absPath)) {
        dx.error(`Failed to load ${path}: file not found`);
        return undefined;
      }

      // Read the raw content
      const content = fs.readFileSync(absPath, 'utf8');

      // Determine parser from file extension
      const ext = path.split('.').pop()?.toLowerCase();
      const extFxnMap: Record<string, (content: string) => unknown> = {
        yaml: yamlParse,
        yml: yamlParse,
        json: JSON.parse,
      };

      const parser = extFxnMap[ext || ''];
      if (!parser) {
        // No parsing, return raw content
        dx.done();
        return content as T;
      }

      const parsed = parser(content);

      // If key specified, return just that key
      if (key && typeof parsed === 'object' && parsed !== null) {
        dx.done();
        return (parsed as Record<string, unknown>)[key] as T;
      }

      dx.done();
      return parsed as T;
    } catch (err) {
      dx.error(`Failed to load ${path}: ${err}`);
      return undefined;
    }
  }

  // Convert relative src attributes and as_uri patterns in HTML to webview URIs
  htmlSrcPathToURI(args: { html: string; webviewPanelId: WebviewPanelId_t }): string {
    const dx = this.dx.sub({ name: 'htmlSrcPathToURI' });
    dx.require(args, ['html', 'webviewPanelId']);
    const { html, webviewPanelId } = args;
    let result = html;

    if (!this.extensionRoot) {
      dx.done();
      return result;
    }

    const webviewPanel = this.fn.vscodeapis.getPanelForUriConversion(webviewPanelId);
    if (!webviewPanel?.webview) {
      dx.done();
      return result;
    }

    // Helper function to convert a path to webview URI
    const convertPathToURI = (path: string): string => {
      // Skip absolute URLs and data URLs
      if (
        path.startsWith('http') ||
        path.startsWith('data:') ||
        path.startsWith('vscode-webview:')
      ) {
        return path;
      }

      // Convert relative path to webview URI
      const fullPath = this.pathJoin(this.extensionRoot!, path);
      const uri = this.fn.vscodeapis.uriFromPath(fullPath);
      const webviewUri = webviewPanel.webview.asWebviewUri(uri).toString();
      return webviewUri;
    };

    // Convert src attributes (case-insensitive) - only match HTML src attributes, not JS assignments
    result = result.replace(/<[^>]*\s+\bsrc\b\s*=\s*["']([^"']+)["'][^>]*>/gi, (match, srcPath) => {
      const webviewUri = convertPathToURI(srcPath);
      return match.replace(srcPath, webviewUri);
    });

    // Convert as_uri patterns (case-insensitive)
    const replaceRegex = new RegExp('\\{\\{as_uri:([^}]+)\\}\\}', 'gi');
    result = result.replace(replaceRegex, (match, path) => {
      const webviewUri = convertPathToURI(path.trim());
      return webviewUri;
    });

    dx.done();
    return result;
  }

  sanitizeFileName(name: string): string {
    // Remove invalid chars cross-platform and constrain length
    const cleaned = name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/__+/g, '_')
      .replace(/^_|_$/g, '');
    // Cap to 120 chars to leave headroom for path components
    return cleaned.substring(0, 120) || 'output';
  }

  dateAsYYYYMMDDHHMMSS(): string {
    const ts = new Date();
    const y = ts.getFullYear();
    const m = String(ts.getMonth() + 1).padStart(2, '0');
    const d = String(ts.getDate()).padStart(2, '0');
    const hh = ts.getHours();
    const mm = String(ts.getMinutes()).padStart(2, '0');
    const ss = String(ts.getSeconds()).padStart(2, '0');
    const ms = String(ts.getMilliseconds()).padStart(3, '0');
    const ampm = hh < 12 ? 'a' : 'p';

    // Convert to 12-hour format
    const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    const hourStr = String(hour12).padStart(2, '0');

    return `${y}-${m}-${d}_${hourStr}${mm}${ss}.${ms}${ampm}`;
  }

  readShikiLightThemes(): string[] {
    if (!this.extensionRoot) return [];
    try {
      const themesDir = this.pathJoin(this.extensionRoot, 'node_modules', 'shiki', 'themes');
      if (!fs.existsSync(themesDir)) return [];
      const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
      return files.map(f => f.replace(/\.json$/, '')).filter(name => /light/i.test(name));
    } catch {
      return [];
    }
  }

  // Path helpers to centralize path operations
  // Note: Node.js path.join() automatically handles OS-specific path separators
  // (Windows: \, Mac/Linux: /)
  pathJoin(...parts: Path_t[]): Path_t {
    return path.join(...parts);
  }

  pathBasename(p: string): string {
    return path.basename(p);
  }
}

// Import platform-specific classes at the end to avoid circular dependency
import { OSMac } from './OSMac';
import { OSWin } from './OSWin';
import { OSLinux } from './OSLinux';

// end, OS.ts
