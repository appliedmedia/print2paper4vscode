import * as fs from 'fs';
import * as path from 'path';
import { exec as cpExec, execSync as cpExecSync } from 'child_process';
import { promisify } from 'util';
import { parse as yamlParse } from 'yaml';
import type { App } from './App';
import { Diagnostics } from './Diagnostics';

export abstract class OS {
  protected app?: App;
  protected extensionRoot?: string;
  protected dx?: Diagnostics;
  constructor(app?: App) {
    this.app = app;
    this.extensionRoot = app ? app.vscodeapis.getExtensionPath() : undefined;
    this.dx = app ? app.dx.create('OS') : undefined;
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
    if (process?.platform === 'win32') {
      return new OSWin(app);
    } else {
      return new OSMac(app);
    }
  }

  abstract fileOpenInDefaultApp(path: string): Promise<void>;
  abstract fileReveal(path: string): Promise<void>;
  abstract filePrint(path: string): Promise<void>;
  abstract getDownloadsDirectory(): string;
  abstract fileOpenPrintDialog(path: string): Promise<void>;
  
  // Puppeteer configuration methods
  abstract getPuppeteerLaunchOptions(): any;
  abstract getPuppeteerPdfOptions(): any;


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

  exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  fileRead(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
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

  // YAML utilities
  readYamlFile<T = unknown>(absPath: string): T {
    const content = this.fileRead(absPath);
    return yamlParse(content) as T;
  }

  readJsonFile<T = unknown>(absPath: string, filter?: string): T | undefined {
    try {
      if (!fs.existsSync(absPath)) return undefined;
      const text = this.fileRead(absPath);
      const parsed = JSON.parse(text) as T;

      // If filter is provided, return only that specific key
      if (filter && typeof parsed === 'object' && parsed !== null) {
        return (parsed as Record<string, unknown>)[filter] as T;
      }

      return parsed;
    } catch {
      return undefined;
    }
  }

  readExtensionYaml<T = unknown>(relativePath: string): T {
    if (!this.extensionRoot) throw new Error('OS.extensionRoot not set');
    const abs = this.pathJoin(this.extensionRoot, relativePath);
    return this.readYamlFile<T>(abs);
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
