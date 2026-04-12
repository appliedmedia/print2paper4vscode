import { WorldCreator } from '@cucumber/node';
import { createTestApp, mockContext, mockVSCode } from '../../out/tests/test-utils.js';
import type { TestApp } from '../../out/tests/test-utils.js';

/**
 * Custom World for Print2Paper Gherkin scenarios.
 *
 * Bridges Gherkin steps to the existing TestApp infrastructure.
 * Each scenario gets a fresh World instance (created/destroyed automatically).
 *
 * Access in steps via `t.world` (first arg to every step function):
 *   Given('something', (t) => { const app = t.world.app; })
 */
export interface P2PWorld {
  app: TestApp;
  result: unknown;
  error: Error | null;
}

WorldCreator(
  (): P2PWorld => ({
    app: createTestApp({ context: mockContext, vscode: mockVSCode }),
    result: undefined,
    error: null,
  }),
  (world: P2PWorld) => {
    if (world.app) {
      world.app.done();
    }
  },
);
