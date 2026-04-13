import { When } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import type { P2PWorld } from '../world.js';

// -- When steps ----------------------------------------------------------

When('I call debugCoords with test dimensions', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  world.app.coords.debugCoords(612, 792, {
    topMarginPts: 72,
    bottomMarginPts: 72,
    leftMarginPts: 72,
    rightMarginPts: 72,
  }, 400);
});
