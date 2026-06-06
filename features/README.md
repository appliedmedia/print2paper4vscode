# features

Gherkin feature files for the Cucumber BDD test suite.

## Structure

* `*.feature` — one feature file per source module (e.g. `pdf.feature`, `stylize.feature`). Coverage variants are suffixed `-coverage` or `-coverage2`.
* `support/world.ts` — Cucumber world configuration shared across all step definitions.
* `support/steps/` — step definition implementations wiring Gherkin prose to TypeScript test code.
* `package.json` — Cucumber runner configuration for this directory.

## Running

```bash
npm test
```

The test runner invokes Cucumber via `scripts/run-tests.js`, which handles the VS Code mock setup before executing the feature suite.
