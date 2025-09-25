import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PaperPrinter } from '../src/PaperPrinter.js';
import type { WebviewMessage } from '../src/types/UI_t.js';

describe('PaperPrinter Dx Message Handling', () => {
  // Mock App with minimal dependencies for dx message testing
  const mockApp = {
    dx: {
      create: (name: string) => ({
        out: (msg: string) => console.log(`[${name}] ${msg}`),
        print: (msg: string) => console.log(`[${name}] PRINT: ${msg}`),
        done: () => {},
        sub: (methodName: string) => ({
          out: (msg: string) => console.log(`[${name}.${methodName}] ${msg}`),
          print: (msg: string) => console.log(`[${name}.${methodName}] PRINT: ${msg}`),
          done: () => {},
          require: () => true,
        }),
      }),
    },
    vscodeapis: {
      getGlobalState: () => undefined,
      updateGlobalState: () => Promise.resolve(),
    },
    ui: {
      registerMessageHandler: () => {},
    },
    uimenumgr: {
      getMenu: () => null,
    },
  };

  test('should handle dx message with message content', async () => {
    const paperPrinter = new PaperPrinter(mockApp as any);

    // Create a dx message
    const dxMessage: WebviewMessage = {
      type: 'dx',
      message: 'Test diagnostic message from webview',
    };

    // Capture console output
    let capturedOutput = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput += msg + '\n';
    };

    try {
      // Call the private method directly via bracket notation
      await (paperPrinter as any).handleDxMessage(dxMessage);

      // Verify the message was processed and output via dx.out
      assert.ok(
        capturedOutput.includes('[Webview] Test diagnostic message from webview'),
        'Should format message with [Webview] prefix'
      );
      assert.ok(!capturedOutput.includes('PRINT:'), 'Should use dx.out, not dx.print');
    } finally {
      console.log = originalLog;
    }
  });

  test('should handle dx message without message content', async () => {
    const paperPrinter = new PaperPrinter(mockApp as any);

    // Create a dx message without message content
    const dxMessage: WebviewMessage = {
      type: 'dx',
    };

    // Capture console output
    let capturedOutput = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput += msg + '\n';
    };

    try {
      // Call the private method directly via bracket notation
      await (paperPrinter as any).handleDxMessage(dxMessage);

      // Verify the fallback message was used
      assert.ok(
        capturedOutput.includes('Received dx message without message content'),
        'Should handle missing message content gracefully'
      );
    } finally {
      console.log = originalLog;
    }
  });

  test('should register dx message handler', () => {
    let registeredHandlers: Array<{ type: string; handler: Function }> = [];

    const mockAppWithCapture = {
      ...mockApp,
      ui: {
        registerMessageHandler: (type: string, handler: Function) => {
          registeredHandlers.push({ type, handler });
        },
      },
    };

    const paperPrinter = new PaperPrinter(mockAppWithCapture as any);

    // Trigger handler registration by calling private method
    (paperPrinter as any).registerMessageHandlers();

    // Verify dx handler was registered
    const dxHandler = registeredHandlers.find(h => h.type === 'dx');
    assert.ok(dxHandler, 'Should register dx message handler');
    assert.strictEqual(typeof dxHandler.handler, 'function', 'Handler should be a function');
  });
});
