import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { exec as cpExec, execSync as cpExecSync } from 'child_process';
import { promisify } from 'util';
import { parse as yamlParse } from 'yaml';
import type { App } from './App';
import { Diagnostics } from './Diagnostics';

// Type definition for fileRead method
export type fileRead_t = <T = string>(path: string, key?: string) => T | undefined;

export abstract class OS {
  protected app: App;
  protected extensionRoot?: string;
  protected dx: Diagnostics;
  constructor(app: App) {
    this.app = app;
    this.extensionRoot = app.vscodeapis.getExtensionPath();
    this.dx = app.dx.create('OS');
  }

  init(): void {}

  done(): void {
    this.dx?.done();
  }

  protected execAsync(cmd: string): Promise<{ stdout: string; stderr: string }> {
    const execP = promisify(cpExec);
    return execP(cmd);
  }

  protected execSync(cmd: string): string {
    return cpExecSync(cmd, { encoding: 'utf8' }) as unknown as string;
  }

  static create(app: App): OS {
    // Using process.platform instead of os.platform() for robustness:
    // - process.platform is available immediately on Node.js startup
    // - os.platform() requires module loading and can throw errors
    // - process.platform is more commonly used in Node.js ecosystem
    // - Both return identical values, but process.platform is more reliable
    if (process?.platform === 'win32') {
      return new OSWin(app);
    } else if (process?.platform === 'linux') {
      return new OSLinux(app);
    } else {
      return new OSMac(app);
    }
  }

  abstract fileOpenInDefaultApp(path: string): Promise<void>;
  abstract fileReveal(path: string): Promise<void>;
  abstract filePrint(path: string): Promise<void>;
  abstract fileOpenPrintDialog(path: string): Promise<void>;

  // Clipboard operations - platform specific
  abstract copyToClipboard(): Promise<void>;
  abstract selectAllCopyDeselect(): Promise<void>;
  abstract getClipboardContent(): Promise<string | null>;

  // Platform-agnostic home directory
  getDir_Home(): string {
    return homedir();
  }

  // Common filesystem helpers consolidated here
  ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fileWrite(filePath: string, content: string | Buffer): void {
    fs.writeFileSync(filePath, content);
  }

  fileCopy(srcPath: string, destPath: string): void {
    fs.copyFileSync(srcPath, destPath);
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
  fileRead: fileRead_t = <T = string>(path: string, key?: string): T | undefined => {
    try {
      // Determine if this is an extension-relative path
      const isExtensionPath = !path.startsWith('/') && !path.includes(':\\');

      // Resolve the absolute path
      const absPath = isExtensionPath
        ? this.extensionRoot
          ? this.pathJoin(this.extensionRoot, path)
          : undefined
        : path;

      if (!absPath || !fs.existsSync(absPath)) return undefined;

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
        return content as T;
      }

      const parsed = parser(content);

      // If key specified, return just that key
      if (key && typeof parsed === 'object' && parsed !== null) {
        return (parsed as Record<string, unknown>)[key] as T;
      }

      return parsed as T;
    } catch {
      return undefined;
    }
  };

  // Convert relative src attributes and as_uri patterns in HTML to webview URIs
  htmlSrcPathToURI(html: string, webviewPanel: any): string {
    if (!this.extensionRoot || !webviewPanel?.webview) return html;

    const dx = this.dx.sub('htmlSrcPathToURI');

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
      const uri = this.app?.vscodeapis.uriFromPath(fullPath);
      const webviewUri = webviewPanel.webview.asWebviewUri(uri).toString();
      return webviewUri;
    };

    // Convert src attributes (case-insensitive) - only match HTML src attributes, not JS assignments
    let result = html.replace(
      /<[^>]*\s+\bsrc\b\s*=\s*["']([^"']+)["'][^>]*>/gi,
      (match, srcPath) => {
        const webviewUri = convertPathToURI(srcPath);
        return match.replace(srcPath, webviewUri);
      }
    );

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
    const ampm = hh < 12 ? 'am' : 'pm';

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
  pathJoin(...parts: Array<string | undefined>): string {
    return path.join(...(parts.filter(Boolean) as string[]));
  }

  pathBasename(p: string): string {
    return path.basename(p);
  }
}

// Import platform-specific classes at the end to avoid circular dependency
import { OSMac } from './OSMac';
import { OSWin } from './OSWin';
import { OSLinux } from './OSLinux';
