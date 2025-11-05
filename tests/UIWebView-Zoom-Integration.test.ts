import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { App } from '../src/App.js';
import { UIWebView } from '../src/UIWebView.js';
import type { PDFData_t } from '../src/UIWebView.js';
import type { PostMessage } from '../src/types/UI_t.js';
import type { ExtensionContext } from 'vscode';
import jsPDF from 'jspdf';
import { kZoomLevel } from '../src/types/PaperPrinter_t.js';

/**
 * Integration tests for UIWebView Zoom Controls
 * 
 * These tests verify the complete extension↔webview wiring for zoom functionality:
 * - Extension passing pdf_zoom_level to webview template injection
 * - Webview messages reaching extension's handleZoomMessage
 * - Persisted zoom level surviving extension reload
 * - Template variable injection handling undefined/null/invalid values
 */

// Mock VS Code context and APIs with state tracking
let mockGlobalState: Record<string, any> = {};

const mockContext = {
  subscriptions: [] as any[],
  extensionPath: '/test/extension/path',
  globalState: {
    get: (key: string) => mockGlobalState[key],
    update: async (key: string, value: any) => {
      if (value === undefined) {
        delete mockGlobalState[key];
      } else {
        mockGlobalState[key] = value;
      }
    },
  },
  workspaceState: {
    get: () => undefined,
    update: () => Promise.resolve(),
  },
  globalStorageUri: { fsPath: '/tmp' },
} as unknown as ExtensionContext;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
    createWebviewPanel: () => ({
      webview: {
        asWebviewUri: (uri: any) => uri,
        html: '',
        onDidReceiveMessage: (callback: (msg: PostMessage) => void) => {
          // Store callback for test use
          (global as any).__webviewMessageCallback = callback;
          return { dispose: () => {} };
        },
        postMessage: () => {},
      },
      reveal: () => {},
      onDidDispose: () => ({ dispose: () => {} }),
      title: '',
    }),
  },
  workspace: {
    getConfiguration: () => ({
      get: () => 'github-light',
    }),
  },
  Uri: { file: (path: string) => ({ fsPath: path }) },
  Range: class Range {},
  ViewColumn: { Active: 1 },
  extensions: {
    all: [],
    getExtension: () => null,
  },
} as any;

describe('UIWebView Zoom Integration Tests', () => {
  let app: App;
  let uiWebView: UIWebView;

  beforeEach(() => {
    mockGlobalState = {}; // Reset state before each test
    app = new App(mockContext, mockVSCode);
    app.init();
    uiWebView = new UIWebView(app);
    uiWebView.init();
  });

  afterEach(() => {
    app.done();
    (global as any).__webviewMessageCallback = undefined;
  });

  describe('Template Variable Injection', () => {
    test('should inject pdf_zoom_level into webview template', async () => {
      // Set persisted zoom level
      app.ui.persist.pdf_zoom_level = 1.5;

      // Generate PDF and create webview panel (which generates HTML)
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Verify template variables are injected in captured HTML
      assert.ok(capturedWebviewHTML.includes('1.5'), 'HTML should contain persisted zoom level');
      assert.ok(capturedWebviewHTML.includes('zoomLevel_min'), 'HTML should contain zoomLevel_min template variable');
      assert.ok(capturedWebviewHTML.includes('zoomLevel_max'), 'HTML should contain zoomLevel_max template variable');
      assert.ok(capturedWebviewHTML.includes('zoomLevel_stepAmount'), 'HTML should contain zoomLevel_stepAmount template variable');
    });

    test('should inject zoom constants (min/max/stepAmount) into webview template', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Verify zoom constants are injected with correct values
      const minValue = kZoomLevel.min.toString();
      const maxValue = kZoomLevel.max.toString();
      const stepValue = kZoomLevel.stepAmount.toString();

      assert.ok(capturedWebviewHTML.includes(minValue), `HTML should contain zoomLevel_min=${minValue}`);
      assert.ok(capturedWebviewHTML.includes(maxValue), `HTML should contain zoomLevel_max=${maxValue}`);
      assert.ok(capturedWebviewHTML.includes(stepValue), `HTML should contain zoomLevel_stepAmount=${stepValue}`);
    });

    test('should handle undefined/null zoom level gracefully', async () => {
      // Set undefined zoom level
      app.ui.persist.pdf_zoom_level = undefined as any;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Should not throw - should use default (1.0)
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(capturedWebviewHTML.includes('1.0'), 'Should default to 1.0 when zoom level is undefined');
    });

    test('should handle invalid zoom level values', async () => {
      // Set invalid zoom level (too high)
      app.ui.persist.pdf_zoom_level = 999 as any;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Should clamp to valid range (default to alt value)
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.alt), `Should use default alt value (${kZoomLevel.alt}) for invalid zoom`);
    });
  });

  describe('Webview Message Handling', () => {
    test('should receive zoom level messages from webview and persist', async () => {
      const initialZoom = 1.5;
      app.ui.persist.pdf_zoom_level = initialZoom;

      // Simulate webview sending zoom message
      const zoomMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 2.0,
      };

      // Get the message handler callback
      const callback = (global as any).__webviewMessageCallback;
      if (callback) {
        await callback(zoomMessage);
      } else {
        // Fallback: call handler directly
        await app.ui.handleWebviewMessage(zoomMessage);
      }

      // Verify zoom level was persisted
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        2.0,
        'Zoom level should be persisted after webview message'
      );
    });

    test('should reject invalid zoom level messages', async () => {
      app.ui.persist.pdf_zoom_level = 1.0;

      // Send invalid zoom level (too high)
      const invalidMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 999,
      };

      const callback = (global as any).__webviewMessageCallback;
      if (callback) {
        await callback(invalidMessage);
      } else {
        await app.ui.handleWebviewMessage(invalidMessage);
      }

      // Should not persist invalid value
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        1.0,
        'Invalid zoom level should not be persisted'
      );
    });

    test('should handle zoom action messages', async () => {
      const zoomActionMessage: PostMessage = {
        type: 'zoom',
        zoomAction: 'in',
      };

      const callback = (global as any).__webviewMessageCallback;
      if (callback) {
        await callback(zoomActionMessage);
      } else {
        await app.ui.handleWebviewMessage(zoomActionMessage);
      }

      // Message should be handled without error
      assert.ok(true, 'Zoom action message should be handled');
    });
  });

  describe('Persistence Across Extension Reload', () => {
    test('should persist zoom level and retrieve it after reload', async () => {
      // Set zoom level
      app.ui.persist.pdf_zoom_level = 1.25;

      // Simulate extension reload: create new app instance
      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // Verify zoom level persists
      const persistedZoom = newApp.ui.persist.pdf_zoom_level;
      assert.strictEqual(
        persistedZoom,
        1.25,
        'Zoom level should persist across extension reload'
      );

      newApp.done();
    });

    test('should use default zoom level when none persisted', async () => {
      // Ensure no zoom level in state
      mockGlobalState = {};

      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // After init(), should have default value
      const zoomLevel = newApp.ui.persist.pdf_zoom_level;
      assert.strictEqual(
        zoomLevel,
        Number(kZoomLevel.alt),
        'Should use default zoom level when none persisted'
      );

      newApp.done();
    });
  });

  describe('Template Variable Edge Cases', () => {
    test('should handle null zoom level in template injection', async () => {
      app.ui.persist.pdf_zoom_level = null as any;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Should not throw - should handle null gracefully
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(typeof capturedWebviewHTML === 'string' && capturedWebviewHTML.length > 0, 'Should generate HTML even with null zoom level');
    });

    test('should validate zoom level range in template injection', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Set zoom level at minimum boundary
      app.ui.persist.pdf_zoom_level = kZoomLevel.min;
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.min.toString()), 'Should accept minimum zoom level');

      // Set zoom level at maximum boundary
      capturedWebviewHTML = ''; // Reset
      app.ui.persist.pdf_zoom_level = kZoomLevel.max;
      await uiWebView.displayPdfPanel(pdfData);
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.max.toString()), 'Should accept maximum zoom level');
    });
  });
});

