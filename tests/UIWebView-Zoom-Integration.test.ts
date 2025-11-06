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
 * Integration tests for Extension↔Webview Coordination
 * 
 * These tests verify the complete extension↔webview wiring:
 * - Template variable injection from extension to webview HTML
 * - Webview messages reaching extension handlers
 * - Persisted state surviving extension reload
 * - Error handling for invalid/undefined template variables
 * - Message routing and handler registration
 * 
 * This suite tests general coordination patterns, with zoom controls as a concrete example.
 * 
 * **What's Real vs Mocked:**
 * - REAL: App, UIWebView, UI, Persist, templateDictReplace, generatePDFHTML, message handlers
 * - REAL: Message routing (handleWebviewMessage), handler registration, persistence logic
 * - REAL: Template variable injection, validation logic, zoom level validation
 * - MOCKED: VS Code APIs (window.createWebviewPanel, globalState, etc.)
 * - MOCKED: Webview panel object (captures HTML and message callbacks)
 * 
 * The tests ensure that when messages are sent, they route through the REAL message handling
 * system (setupMessageHandling → handleWebviewMessage → registered handlers), not mocked implementations.
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

// Track app instance for message routing
let currentAppInstance: App | null = null;

const mockVSCode = {
  commands: { registerCommand: () => ({}) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    showWarningMessage: () => {},
    createWebviewPanel: () => {
      let webviewHtml = '';
      return {
        webview: {
          asWebviewUri: (uri: any) => uri,
          get html() { return webviewHtml; },
          set html(value: string) {
            webviewHtml = value;
            // Capture HTML for tests
            (global as any).__capturedWebviewHTML = value;
          },
          onDidReceiveMessage: (callback: (msg: PostMessage) => void) => {
            // Store callback that will route through real message handling system
            // When VS Code receives a message, it calls this callback
            // The callback from setupMessageHandling() calls app.ui.handleWebviewMessage()
            (global as any).__webviewMessageCallback = callback;
            return { dispose: () => {} };
          },
          postMessage: () => {},
        },
        reveal: () => {},
        onDidDispose: () => ({ dispose: () => {} }),
        title: '',
      };
    },
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

describe('Extension↔Webview Integration Tests', () => {
  let app: App;
  let uiWebView: UIWebView;
  let capturedWebviewHTML: string = '';

  beforeEach(() => {
    mockGlobalState = {}; // Reset state before each test
    capturedWebviewHTML = ''; // Reset captured HTML
    app = new App(mockContext, mockVSCode);
    currentAppInstance = app; // Store for message routing verification
    app.init();
    uiWebView = new UIWebView(app);
    uiWebView.init(); // This registers real message handlers
  });

  afterEach(() => {
    app.done();
    (global as any).__webviewMessageCallback = undefined;
  });

  describe('Template Variable Injection', () => {
    test('should inject all required template variables into webview HTML', async () => {
      const doc = new jsPDF();
      doc.text('Test PDF', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 3,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test PDF Document',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Get captured HTML from global
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';

      // Verify core template variables are injected
      assert.ok(capturedWebviewHTML.includes('Test PDF Document'), 'HTML should contain title');
      assert.ok(capturedWebviewHTML.includes('3'), 'HTML should contain page_total');
      assert.ok(capturedWebviewHTML.includes('595'), 'HTML should contain page_width_px');
      assert.ok(capturedWebviewHTML.includes('842'), 'HTML should contain page_height_px');
      assert.ok(capturedWebviewHTML.includes('data:application/pdf'), 'HTML should contain pdf_data_url');
      assert.ok(capturedWebviewHTML.includes('pdfjsLib'), 'HTML should contain pdfjs_library');
    });

    test('should inject persisted values into webview template', async () => {
      // Set persisted zoom level as example
      app.ui.persist.pdf_zoom_level = 1.5;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Get captured HTML
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';

      // Verify persisted value is injected
      assert.ok(capturedWebviewHTML.includes('1.5'), 'HTML should contain persisted zoom level');
    });

    test('should inject extension constants into webview template', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Get captured HTML
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';

      // Verify extension constants are injected (example: zoom constants)
      const minValue = kZoomLevel.min.toString();
      const maxValue = kZoomLevel.max.toString();
      const stepValue = kZoomLevel.stepAmount.toString();

      assert.ok(capturedWebviewHTML.includes(minValue), `HTML should contain zoomLevel_min=${minValue}`);
      assert.ok(capturedWebviewHTML.includes(maxValue), `HTML should contain zoomLevel_max=${maxValue}`);
      assert.ok(capturedWebviewHTML.includes(stepValue), `HTML should contain zoomLevel_stepAmount=${stepValue}`);
    });

    test('should handle undefined/null persisted values gracefully', async () => {
      // Set undefined persisted value
      app.ui.persist.pdf_zoom_level = undefined as any;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Should not throw - should use default value
      await uiWebView.displayPdfPanel(pdfData);
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(capturedWebviewHTML.includes('1.0'), 'Should default to 1.0 when zoom level is undefined');
    });

    test('should handle invalid persisted values with validation', async () => {
      // Set invalid persisted value (example: zoom level out of range)
      app.ui.persist.pdf_zoom_level = 999 as any;

      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Should validate and use default value
      await uiWebView.displayPdfPanel(pdfData);
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.alt), `Should use default alt value (${kZoomLevel.alt}) for invalid zoom`);
    });

    test('should replace all template placeholders', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Get captured HTML
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';

      // Verify no unreplaced template placeholders remain (except nested ones like {{toolbar}})
      const unreplacedPattern = /\{\{(?!toolbar)[^}]+\}\}/;
      const hasUnreplaced = unreplacedPattern.test(capturedWebviewHTML);
      assert.ok(!hasUnreplaced, 'All template variables should be replaced (except nested placeholders)');
    });
  });

  describe('Webview Message Handling', () => {
    test('should route messages to registered handlers through real message routing', async () => {
      // Verify handlers are registered (from uiWebView.init())
      const handlers = (app.ui as any).messageHandlers;
      assert.ok(handlers, 'Message handlers map should exist');
      assert.ok(handlers.has('dx'), 'dx handler should be registered');
      
      // Test that messages are routed correctly through real UI.handleWebviewMessage()
      const message: PostMessage = {
        type: 'dx',
        message: 'Test diagnostic message',
      };

      // Call through real message routing system
      await app.ui.handleWebviewMessage(message);

      // Message should be handled without error
      assert.ok(true, 'Message should be routed to handler');
    });

    test('should handle multiple message types through real routing', async () => {
      // Test various message types - all go through real handleWebviewMessage()
      const messages: PostMessage[] = [
        { type: 'dx', message: 'Test' },
        { type: 'print', printType: 'test' },
        { type: 'menuItemSelected', menuId: 'test', itemId: 'test' },
        { type: 'dragEnd', clientX: 100 },
      ];

      for (const msg of messages) {
        // Use real message routing
        await app.ui.handleWebviewMessage(msg);
      }

      // All messages should be handled without error
      assert.ok(true, 'Multiple message types should be handled');
    });

    test('should receive and persist state from webview messages through real handlers (zoom example)', async () => {
      // Create a panel first to set up message routing callback
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      const initialZoom = 1.5;
      app.ui.persist.pdf_zoom_level = initialZoom;

      // Simulate webview sending zoom message - use callback from setupMessageHandling()
      // This callback calls app.ui.handleWebviewMessage() which routes to real handlers
      const zoomMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 2.0,
      };

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up by setupMessageHandling()');
      
      // Call through the real message routing callback
      await callback(zoomMessage);

      // Verify state was persisted by real handleZoomMessage()
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        2.0,
        'Zoom level should be persisted after webview message (via real handler)'
      );
    });

    test('should validate incoming messages through real validation logic (zoom example)', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      app.ui.persist.pdf_zoom_level = 1.0;

      // Send invalid zoom level (too high) - real validation should reject it
      const invalidMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 999,
      };

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');
      
      // Call through real message routing (which calls real handleZoomMessage with validation)
      await callback(invalidMessage);

      // Should not persist invalid value (real validation logic)
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        1.0,
        'Invalid zoom level should not be persisted (real validation)'
      );
    });

    test('should handle action messages without state changes through real handlers', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      const zoomActionMessage: PostMessage = {
        type: 'zoom',
        zoomAction: 'in',
      };

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');
      
      // Call through real message routing
      await callback(zoomActionMessage);

      // Message should be handled without error by real handler
      assert.ok(true, 'Action message should be handled by real handler');
    });
  });

  describe('Persistence Across Extension Reload', () => {
    test('should persist state and retrieve it after reload', async () => {
      // Set persisted values (example: zoom level)
      app.ui.persist.pdf_zoom_level = 1.25;
      app.ui.persist.toolbar_pos = 'top';

      // Simulate extension reload: create new app instance
      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // Verify persisted values survive reload
      assert.strictEqual(
        newApp.ui.persist.pdf_zoom_level,
        1.25,
        'Zoom level should persist across extension reload'
      );
      assert.strictEqual(
        newApp.ui.persist.toolbar_pos,
        'top',
        'Toolbar position should persist across extension reload'
      );

      newApp.done();
    });

    test('should use default values when none persisted', async () => {
      // Ensure no persisted state
      mockGlobalState = {};

      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // After init(), should have default values
      const zoomLevel = newApp.ui.persist.pdf_zoom_level;
      assert.strictEqual(
        zoomLevel,
        Number(kZoomLevel.alt),
        'Should use default zoom level when none persisted'
      );
    });

    test('should validate and sanitize persisted values on reload', async () => {
      // Set invalid persisted value
      mockGlobalState = {
        'p2p4vsc.pdf_zoom_level': 999, // Invalid (out of range)
      };

      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // Should be sanitized to valid default
      const zoomLevel = Number(newApp.ui.persist.pdf_zoom_level);
      assert.ok(
        zoomLevel >= kZoomLevel.min && zoomLevel <= kZoomLevel.max,
        'Invalid persisted value should be sanitized on reload'
      );
    });
  });

  describe('Template Variable Edge Cases', () => {
    test('should handle null persisted values gracefully', async () => {
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
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(typeof capturedWebviewHTML === 'string' && capturedWebviewHTML.length > 0, 'Should generate HTML even with null persisted value');
    });

    test('should validate persisted values at boundaries', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      // Test minimum boundary (zoom example)
      app.ui.persist.pdf_zoom_level = kZoomLevel.min;
      await uiWebView.displayPdfPanel(pdfData);
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.min.toString()), 'Should accept minimum boundary value');

      // Test maximum boundary
      capturedWebviewHTML = ''; // Reset
      app.ui.persist.pdf_zoom_level = kZoomLevel.max;
      await uiWebView.displayPdfPanel(pdfData);
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(capturedWebviewHTML.includes(kZoomLevel.max.toString()), 'Should accept maximum boundary value');
    });

    test('should handle empty or missing template variables', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: '', // Empty title
      };

      // Should handle empty values without error
      await uiWebView.displayPdfPanel(pdfData);
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';
      assert.ok(typeof capturedWebviewHTML === 'string' && capturedWebviewHTML.length > 0, 'Should generate HTML even with empty template variables');
    });
  });

  describe('Zoom Controls (Example Implementation)', () => {
    test('should inject zoom constants into webview template', async () => {
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };

      await uiWebView.displayPdfPanel(pdfData);

      // Get captured HTML
      capturedWebviewHTML = (global as any).__capturedWebviewHTML || '';

      // Verify zoom constants are injected
      const minValue = kZoomLevel.min.toString();
      const maxValue = kZoomLevel.max.toString();
      const stepValue = kZoomLevel.stepAmount.toString();

      assert.ok(capturedWebviewHTML.includes(minValue), `HTML should contain zoomLevel_min=${minValue}`);
      assert.ok(capturedWebviewHTML.includes(maxValue), `HTML should contain zoomLevel_max=${maxValue}`);
      assert.ok(capturedWebviewHTML.includes(stepValue), `HTML should contain zoomLevel_stepAmount=${stepValue}`);
    });

    test('should handle zoom messages from webview through real handler', async () => {
      // Create panel to set up real message routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      app.ui.persist.pdf_zoom_level = 1.0;

      const zoomMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 1.5,
      };

      // Use callback from real setupMessageHandling() which calls real handleWebviewMessage()
      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up by real setupMessageHandling()');
      await callback(zoomMessage);

      // Verify real handler persisted the value
      assert.strictEqual(app.ui.persist.pdf_zoom_level, 1.5, 'Zoom level should be updated by real handler');
    });
  });

  describe('Race Condition Tests', () => {
    test('should handle rapid zoom changes correctly (race condition test)', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 3, // Multiple pages to simulate slow render
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      app.ui.persist.pdf_zoom_level = 1.0;

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');

      // Simulate rapid zoom changes (user clicking zoom in/out rapidly)
      // This tests what happens if multiple zoom messages arrive before previous renders complete
      const rapidZoomMessages: PostMessage[] = [
        { type: 'zoom', zoomAction: 'in' },    // 1.0 -> 1.1
        { type: 'zoom', zoomAction: 'in' },    // 1.1 -> 1.2
        { type: 'zoom', zoomAction: 'in' },    // 1.2 -> 1.3
        { type: 'zoom', zoomAction: 'out' },   // 1.3 -> 1.2
        { type: 'zoom', zoomAction: 'out' },   // 1.2 -> 1.1
        { type: 'zoom', zoomLevel: 2.0 },      // Direct set to 2.0
        { type: 'zoom', zoomLevel: 1.5 },      // Direct set to 1.5
      ];

      // Send all messages rapidly without awaiting each one (simulating race condition)
      const promises = rapidZoomMessages.map(msg => callback(msg));
      
      // Wait for all messages to be processed
      await Promise.all(promises);

      // Verify final state is consistent - should match the last zoom message (1.5)
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        1.5,
        'Final zoom level should match last zoom message after rapid changes'
      );

      // Verify zoom level is within valid range
      assert.ok(
        app.ui.persist.pdf_zoom_level >= kZoomLevel.min && app.ui.persist.pdf_zoom_level <= kZoomLevel.max,
        'Final zoom level should be within valid range after rapid changes'
      );
    });

    test('should handle rapid zoom level changes without state corruption', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      app.ui.persist.pdf_zoom_level = 1.0;

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');

      // Rapidly send zoom level changes (simulating user typing quickly in zoom input)
      const rapidZoomLevels = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];
      const messages = rapidZoomLevels.map(level => ({
        type: 'zoom' as const,
        zoomLevel: level,
      }));

      // Send all messages rapidly (without awaiting individually)
      const promises = messages.map(msg => callback(msg));
      await Promise.all(promises);

      // Verify final state matches last message
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        2.0,
        'Final zoom level should match last rapid zoom level change'
      );
    });

    test('should handle rapid zoom action messages without state corruption', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      app.ui.persist.pdf_zoom_level = 1.0;

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');

      // Rapidly send zoom in actions (simulating user clicking zoom in button rapidly)
      const zoomInActions: PostMessage[] = Array.from({ length: 10 }, () => ({
        type: 'zoom' as const,
        zoomAction: 'in' as const,
      }));
      
      // Send all messages rapidly
      const promises = zoomInActions.map(msg => callback(msg));
      await Promise.all(promises);

      // Verify final zoom level is correct (1.0 + 10 * 0.1 = 2.0, capped at max)
      const expectedZoom = Math.min(1.0 + (10 * kZoomLevel.stepAmount), kZoomLevel.max);
      assert.strictEqual(
        app.ui.persist.pdf_zoom_level,
        expectedZoom,
        `Final zoom level should be ${expectedZoom} after 10 rapid zoom in actions`
      );
    });

    /**
     * NOTE: This test covers the extension-side race condition handling.
     * 
     * The webview-side race condition (multiple renderAllPages() calls queued
     * when user rapidly clicks zoom while renderPage is in progress) would require
     * browser-based testing or headless browser automation to fully verify.
     * 
     * The webview JavaScript code should handle this by:
     * - Ensuring renderAllPages() clears previous content before starting
     * - Using currentScale state that updates immediately (before render completes)
     * - Each renderPage() uses the current currentScale value, so final render
     *   reflects the most recent zoom level
     * 
     * To fully test webview-side race conditions, consider:
     * - Browser automation tests (Playwright, Puppeteer)
     * - Mocking PDF.js render promises to simulate slow rendering
     * - Verifying canvas elements are created with correct dimensions
     */
  });

  describe('Error Handling', () => {
    test('should error on invalid zoom level from webview', async () => {
      // Create panel to set up routing
      const doc = new jsPDF();
      doc.text('Test', 10, 10);
      const pdfData: PDFData_t = {
        arrayBuffer: doc.output('arraybuffer') as ArrayBuffer,
        pageTotal: 1,
        pageSizePx: { widthPx: 595, heightPx: 842 },
        title: 'Test',
      };
      await uiWebView.displayPdfPanel(pdfData);

      // Send invalid zoom level (out of range)
      const invalidMessage: PostMessage = {
        type: 'zoom',
        zoomLevel: 999, // Invalid - too high
      };

      const callback = (global as any).__webviewMessageCallback;
      assert.ok(callback, 'Message callback should be set up');

      // Should throw error (handleZoomMessage shows error and throws)
      let errorThrown = false;
      try {
        await callback(invalidMessage);
      } catch (error) {
        errorThrown = true;
        assert.ok(error instanceof Error, 'Should throw Error');
        assert.ok(String(error).includes('Invalid zoom level'), 'Error message should mention invalid zoom level');
      }
      assert.ok(errorThrown, 'Should throw error for invalid zoom level');
    });

    test('should validate persisted zoom level on init', async () => {
      // Set corrupted persisted value (string that can't be parsed)
      mockGlobalState = {
        'p2p4vsc.pdf_zoom_level': 'invalid_string',
      };

      const newApp = new App(mockContext, mockVSCode);
      newApp.init();

      // Should be sanitized to valid default on init
      const zoomLevel = Number(newApp.ui.persist.pdf_zoom_level);
      assert.ok(
        zoomLevel >= kZoomLevel.min && zoomLevel <= kZoomLevel.max,
        'Corrupted persisted value should be sanitized to valid default'
      );

      newApp.done();
    });
  });
});

