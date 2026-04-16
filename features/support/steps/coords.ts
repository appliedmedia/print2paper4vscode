import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';
import { Coords } from '../../../out/src/Coords.js';

// -- Given steps ----------------------------------------------------------

Given('a Coords instance from the registry', (t: TestCaseContext) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.coords = new Coords({ reg: world.app.reg });
});

Given('a page height of {int} points', (t: TestCaseContext, _height: number) => {
  // Informational step for readability; actual values passed in When steps.
});

Given('a bottom margin Y of {int}', (t: TestCaseContext, _margin: number) => {
  // Informational step for readability; actual values passed in When steps.
});

Given('a starting Y of {int} and a line height of {int} CSS pixels', (t: TestCaseContext, _startY: number, lineHeightPx: number) => {
  const world = t.world as P2PWorld & { coords: Coords; lineHeightPts: number };
  world.lineHeightPts = world.coords.cssPxToPdfPts(lineHeightPx);
});

// -- When steps -----------------------------------------------------------

When('I convert {int} CSS pixels to PDF points', (t: TestCaseContext, cssPx: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.cssPxToPdfPts(cssPx);
});

When('I convert {int} PDF points to CSS pixels', (t: TestCaseContext, pdfPts: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.pdfPtsToCssPx(pdfPts);
});

When('I convert PDF Y {int} to screen Y with page height {int}', (t: TestCaseContext, pdfY: number, pageHeight: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.pdfPtsYToScreenY(pdfY, pageHeight);
});

When('I convert screen Y {int} to PDF Y with page height {int}', (t: TestCaseContext, screenY: number, pageHeight: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.screenYToPdfPtsY(screenY, pageHeight);
});

When('I convert the result back to screen Y with page height {int}', (t: TestCaseContext, pageHeight: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.pdfPtsYToScreenY(world.result as number, pageHeight);
});

When('I calculate the PDF Y for top margin start with page height {int} and top margin {int}', (t: TestCaseContext, pageHeight: number, topMargin: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.getPdfPtsYForTopMarginStart(pageHeight, topMargin);
});

When('I get the PDF Y for bottom margin start with bottom margin {int}', (t: TestCaseContext, bottomMargin: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.getPdfPtsYForBottomMarginStart(bottomMargin);
});

When('I move PDF Y {int} down one line with line height {int}', (t: TestCaseContext, currentY: number, lineHeight: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.movePdfPtsYDownOneLine(currentY, lineHeight);
});

When('I move PDF Y {int} up one line with line height {int}', (t: TestCaseContext, currentY: number, lineHeight: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.movePdfPtsYUpOneLine(currentY, lineHeight);
});

When('I check if PDF Y {int} has reached bottom margin {int}', (t: TestCaseContext, y: number, margin: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.hasPdfPtsYReachedBottomMargin(y, margin);
});

When('I calculate available height with page height {int}, top margin {int}, and bottom margin {int}', (t: TestCaseContext, pageHeight: number, topMargin: number, bottomMargin: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.calculatePdfPtsAvailableHeightForContent(pageHeight, topMargin, bottomMargin);
});

When('I calculate available width with page width {int}, left margin {int}, and right margin {int}', (t: TestCaseContext, pageWidth: number, leftMargin: number, rightMargin: number) => {
  const world = t.world as P2PWorld & { coords: Coords };
  world.result = world.coords.calculatePdfPtsAvailableWidthForContent(pageWidth, leftMargin, rightMargin);
});

When('I move down one line from {int} using the PDF points line height', (t: TestCaseContext, startY: number) => {
  const world = t.world as P2PWorld & { coords: Coords; lineHeightPts: number };
  world.result = world.coords.movePdfPtsYDownOneLine(startY, world.lineHeightPts);
});

When('I move up one line from the result using the same line height', (t: TestCaseContext) => {
  const world = t.world as P2PWorld & { coords: Coords; lineHeightPts: number };
  world.result = world.coords.movePdfPtsYUpOneLine(world.result as number, world.lineHeightPts);
});

// -- Then steps -----------------------------------------------------------

Then('the result should be {int}', (t: TestCaseContext, expected: number) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, expected);
});

Then('the boolean result should be {word}', (t: TestCaseContext, expected: string) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, expected === 'true');
});

Then('the Coords margin gutter minimum should be {float}', (t: TestCaseContext, expected: number) => {
  assert.strictEqual(Coords.kMarginGutterMinPts, expected);
});

Then('the round-trip screen Y should be {int}', (t: TestCaseContext, expected: number) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, expected);
});

Then('the round-trip Y should be {int}', (t: TestCaseContext, expected: number) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, expected);
});
