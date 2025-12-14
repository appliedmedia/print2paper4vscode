"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OS = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
const child_process_1 = require("child_process");
const util_1 = require("util");
const yaml_1 = require("yaml");
const node_perf_hooks_1 = require("node:perf_hooks");
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
class OS {
    static id = 'os';
    // Performance timing from Node.js perf_hooks
    static performance = node_perf_hooks_1.performance;
    reg;
    extensionRoot;
    dx;
    fn;
    // Getter for extension root
    getExtensionRoot() {
        return this.extensionRoot;
    }
    constructor(args) {
        this.reg = args.reg;
        // Request methods via Registry
        this.fn = this.reg.use('vscodeapis.getExtensionPath', 'vscodeapis.getPanelForUriConversion', 'vscodeapis.uriFromPath', 'utils.templateDictReplace');
        this.dx = this.fn.dx.sub({ name: 'OS' });
        this.extensionRoot = this.fn.vscodeapis.getExtensionPath();
    }
    done() {
        this.dx?.done();
    }
    execAsync(cmd) {
        const execP = (0, util_1.promisify)(child_process_1.exec);
        return execP(cmd);
    }
    execSync(cmd) {
        return (0, child_process_1.execSync)(cmd, { encoding: 'utf8' });
    }
    static create(args) {
        // Using process.platform instead of os.platform() for robustness:
        // - process.platform is available immediately on Node.js startup
        // - os.platform() requires module loading and can throw errors
        // - process.platform is more commonly used in Node.js ecosystem
        // - Both return identical values, but process.platform is more reliable
        if (process?.platform === 'win32') {
            return new OSWin_1.OSWin(args);
        }
        else if (process?.platform === 'linux') {
            return new OSLinux_1.OSLinux(args);
        }
        else if (process?.platform === 'darwin') {
            return new OSMac_1.OSMac(args);
        }
        else {
            const platform = process?.platform || 'unknown';
            const msg = `Cannot determine operating system. Platform "${platform}" is not supported. ` +
                `Supported platforms: win32, linux, darwin.`;
            // Cannot use dx.error here - static factory method, no dx available yet
            console.error(`❌ ERROR: ${msg}`);
            throw new Error(msg);
        }
    }
    // Get system locale with region (e.g., "en-US", "fr-FR")
    // Uses Intl API which actually provides region codes unlike vscode.env.language
    getLocale() {
        return Intl.DateTimeFormat().resolvedOptions().locale || '';
    }
    // Platform-agnostic home directory
    getDir_Home() {
        return (0, os_1.homedir)();
    }
    /**
     * Replace OS-specific template variables in a string
     * Composes template variables with OS-specific replacements and calls templateDictReplace
     * @param source - String containing template variables like {{os-ctrl-cmd}}
     * @returns String with all template variables replaced with OS-specific values
     *
     * @example
     * os.dictReplace('{{os-ctrl-cmd}}+0') // Returns '⌘+0' on Mac, 'Ctrl+0' on Win/Linux
     */
    dictReplace(source) {
        const osKeys = this.getOSKeys();
        // Use the app's templateDictReplace method via reg.app
        return this.fn.utils.templateDictReplace(source, osKeys);
    }
    // Common filesystem helpers consolidated here
    ensureDir(dirPath) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    fileWrite(args) {
        const dx = this.dx.sub({ name: 'fileWrite' });
        dx.require(args, ['filePath', 'content']);
        const { filePath, content } = args;
        try {
            fs.writeFileSync(filePath, content);
        }
        catch (err) {
            dx.error(`Failed to write ${filePath}: ${err}`);
            throw err; // Re-throw to preserve existing behavior
        }
        finally {
            dx.done();
        }
    }
    fileDelete(targetPath) {
        try {
            if (fs.existsSync(targetPath))
                fs.unlinkSync(targetPath);
        }
        catch {
            // ignore
        }
    }
    pathDirname(filePath) {
        return path.dirname(filePath);
    }
    exists(targetPath) {
        return fs.existsSync(targetPath);
    }
    // Smart file reader that handles everything
    fileRead(args) {
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
            const extFxnMap = {
                yaml: yaml_1.parse,
                yml: yaml_1.parse,
                json: JSON.parse,
            };
            const parser = extFxnMap[ext || ''];
            if (!parser) {
                // No parsing, return raw content
                dx.done();
                return content;
            }
            const parsed = parser(content);
            // If key specified, return just that key
            if (key && typeof parsed === 'object' && parsed !== null) {
                dx.done();
                return parsed[key];
            }
            dx.done();
            return parsed;
        }
        catch (err) {
            dx.error(`Failed to load ${path}: ${err}`);
            return undefined;
        }
    }
    // Convert relative src attributes and as_uri patterns in HTML to webview URIs
    htmlSrcPathToURI(args) {
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
        const convertPathToURI = (path) => {
            // Skip absolute URLs and data URLs
            if (path.startsWith('http') ||
                path.startsWith('data:') ||
                path.startsWith('vscode-webview:')) {
                return path;
            }
            // Convert relative path to webview URI
            const fullPath = this.pathJoin(this.extensionRoot, path);
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
    sanitizeFileName(name) {
        // Remove invalid chars cross-platform and constrain length
        const cleaned = name
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/__+/g, '_')
            .replace(/^_|_$/g, '');
        // Cap to 120 chars to leave headroom for path components
        return cleaned.substring(0, 120) || 'output';
    }
    dateAsYYYYMMDDHHMMSS() {
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
    readShikiLightThemes() {
        if (!this.extensionRoot)
            return [];
        try {
            const themesDir = this.pathJoin(this.extensionRoot, 'node_modules', 'shiki', 'themes');
            if (!fs.existsSync(themesDir))
                return [];
            const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
            return files.map(f => f.replace(/\.json$/, '')).filter(name => /light/i.test(name));
        }
        catch {
            return [];
        }
    }
    // Path helpers to centralize path operations
    pathJoin(...parts) {
        return path.join(...parts.filter(Boolean));
    }
    pathBasename(p) {
        return path.basename(p);
    }
}
exports.OS = OS;
// Import platform-specific classes at the end to avoid circular dependency
const OSMac_1 = require("./OSMac");
const OSWin_1 = require("./OSWin");
const OSLinux_1 = require("./OSLinux");
// end, OS.ts
//# sourceMappingURL=OS.js.map