import { WorldCreator } from '@cucumber/node';
import { createTestApp, mockContext, mockVSCode } from '../../out/tests/test-utils.js';

/**
 * Custom World for Print2Paper Gherkin tests.
 * Holds TestApp state and bridges Gherkin scenarios to the application under test.
 *
 * @typedef {Object} P2PWorld
 * @property {import('../../out/tests/test-utils.js').TestApp} [app]
 * @property {Error} [error]
 */

WorldCreator(() => {
  /** @type {P2PWorld} */
  const world = {};
  return world;
});

export { createTestApp, mockContext, mockVSCode };
