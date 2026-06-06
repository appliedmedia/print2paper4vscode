# tests

Unit test suite for Print2Paper4VSCode using the Node.js built-in `node:test` runner.

## Running

```bash
npm test
```

## Structure

* `*.test.ts` — one test file per module or concern. Compiled to `out/tests/` before execution.
* `test-helpers.ts` / `test-utils.ts` — shared test utilities and assertion helpers.
* `vscode-mock.cjs` — VS Code API mock injected at test startup via `scripts/setup-vscode-mock.js`.
* `testsource_sample_code.yaml` — sample source code fixtures used across multiple test cases.
* `sample-code.js`, `test-css-output.js`, `test-shiki-v3-themes.js`, `validate-extension.js` — standalone verification scripts for specific subsystems.
* `test-entrypoint.ts` — test bootstrap entry point.

## Coverage

Run `npm run test:coverage` to generate an Istanbul/c8 coverage report in `coverage/`.
