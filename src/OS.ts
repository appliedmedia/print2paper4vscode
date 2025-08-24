import * as fs from 'fs';
import * as path from 'path';
import { exec as cpExec, execSync as cpExecSync } from 'child_process';
import { promisify } from 'util';
import { parse as yamlParse } from 'yaml';
import type { App } from './App.js';

export abstract class OS {
	protected app?: App;
	protected extensionRoot?: string;
	constructor(app?: App) {
		this.app = app;
		this.extensionRoot = app ? app.vscodeapis.getExtensionPath() : undefined;
	}

	init(): void {}

	done(): void {}

	protected execAsync(cmd: string): Promise<{ stdout: string; stderr: string }>{
		const execP = promisify(cpExec);
		return execP(cmd);
	}

	protected execSync(cmd: string): string {
		return cpExecSync(cmd, { encoding: 'utf8' }) as unknown as string;
	}

	static create(app: App): OS {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		if (process.platform === 'win32') { const { OSWin } = require('./OSWin'); return new OSWin(app); }
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { OSMac } = require('./OSMac'); return new OSMac(app);
	}

	abstract fileOpen(path: string): Promise<void>;
	abstract fileReveal(path: string): Promise<void>;
	abstract filePrint(path: string): Promise<void>;
	abstract getDownloadsDirectory(): string;
	abstract fileOpenPrintDialog(path: string): Promise<void>;

	// Execute Chrome with provided parameters (macOS default path). Platform-specific fallbacks can override.
	async execChrome(params: string): Promise<void> {
		const chrome = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
		const cmd = `${chrome} ${params}`;
		await this.execAsync(cmd);
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

	exists(targetPath: string): boolean {
		return fs.existsSync(targetPath);
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
		const hh = String(ts.getHours()).padStart(2, '0');
		const mm = String(ts.getMinutes()).padStart(2, '0');
		const ss = String(ts.getSeconds()).padStart(2, '0');
		return `${y}-${m}-${d}_${hh}${mm}${ss}`;
	}

	// YAML utilities
	readYamlFile<T = unknown>(absPath: string): T {
		const content = fs.readFileSync(absPath, 'utf8');
		return yamlParse(content) as T;
	}

	readJsonFile<T = unknown>(absPath: string): T | undefined {
		try {
			if (!fs.existsSync(absPath)) return undefined;
			const text = fs.readFileSync(absPath, 'utf8');
			return JSON.parse(text) as T;
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
			return files
				.map(f => f.replace(/\.json$/, ''))
				.filter(name => /light/i.test(name));
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

	// Unified logging sink
	debugOut(message: unknown, level: 'debug' | 'info' | 'warn' | 'error' = 'info', context?: string, data?: unknown): void {
		OS.debugOut(message, level, context, data);
	}

	static debugOut(message: unknown, level: 'debug' | 'info' | 'warn' | 'error' = 'info', context?: string, data?: unknown): void {
		const ts = new Date().toISOString();
		const ctx = context ? `[${context}] ` : '';
		const base = typeof message === 'string' ? message : JSON.stringify(message);
		const extra = (data === undefined) ? '' : ` | ${typeof data === 'string' ? data : (() => { try { return JSON.stringify(data); } catch { return String(data); } })()}`;
		const line = `${ts} ${level.toUpperCase()} ${ctx}${base}${extra}`;
		if (level === 'error') console.error(line);
		else if (level === 'warn') console.warn(line);
		else if (level === 'debug') {
			if (console.debug) console.debug(line);
			else console.log(line);
		} else {
			console.log(line);
		}
	}
}


