# scripts

Build, publish, and development scripts for Print2Paper4VSCode.

## Scripts

* `generate-package-json.mjs` — generates root `package.json` from `config/template.package.json`, resolving `{{extId}}` and related placeholders from `src/types/_entrypoint_extId_t.ts`. Run automatically via the `precompile` npm script.
* `prepublish.sh` — full build pipeline run by `vsce` before packaging: generates `package.json`, compiles TypeScript, and bundles with esbuild.
* `publish.sh` — publishes to both the VS Code Marketplace and Open VSX Registry in one step. Requires `VSCE_PAT` and `OVSX_PAT` environment variables. Invoked via `npm run publish:all`.
* `run-tests.js` — test runner entry point. Sets up the VS Code mock and invokes the Cucumber suite.
* `setup-vscode-mock.js` — injects the VS Code API mock (`tests/vscode-mock.cjs`) into the Node.js module system before tests run.
* `lint-yaml-code.js` — validates YAML code blocks embedded in source `.yaml` sidecar files.
* `setup.sh` — one-time developer environment setup (dependencies, tooling).
* `install-gh.sh` — installs the GitHub CLI (`gh`) if not already present.
