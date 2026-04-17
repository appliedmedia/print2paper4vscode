import { Given, When, Then } from '@cucumber/node';
import type { TestCaseContext } from '@cucumber/node';
import assert from 'node:assert';
import type { P2PWorld } from '../world.js';

// -- Helpers -------------------------------------------------------------

function clearYamlProp(
  world: P2PWorld,
  key: 'uimenu_generic_handlers' | 'uimenu_css'
): void {
  const menus = world.app.uimenumgr.getUIMenus();
  assert.ok(menus.length > 0, 'Expected at least one UIMenu to clear YAML on');
  const origYaml = menus[0].yaml.bind(menus[0]);
  menus[0].yaml = () => {
    const data = origYaml();
    return { ...data, [key]: '' };
  };
}

// -- Given steps ---------------------------------------------------------

Given('uimenu_generic_handlers YAML property is cleared', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  clearYamlProp(world, 'uimenu_generic_handlers');
});

Given('uimenu_css YAML property is cleared', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  clearYamlProp(world, 'uimenu_css');
});

// -- When steps ----------------------------------------------------------

When('a value resolver returns a boolean', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  const mgr = world.app.uimenumgr;
  world.result = (mgr as any).getValueOfMenuFxnByCalcValue(
    () => false,
    'test-menu',
    'test-item'
  );
});

// -- Then steps ----------------------------------------------------------

Then('the resolved value should be boolean false', (t: TestCaseContext) => {
  const world = t.world as P2PWorld;
  assert.strictEqual(world.result, false, 'Should return boolean false');
});
