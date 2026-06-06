# config

Build pipeline configuration for Print2Paper4VSCode.

## Files

* `template.package.json` — source of truth for `package.json`. The `{{extId}}`, `{{cmdPrint}}`, and related placeholders are resolved by `scripts/generate-package-json.mjs` from constants in `src/types/_entrypoint_extId_t.ts`. Edit this file, not the generated root `package.json`.
* `tsconfig.json` — TypeScript compiler configuration.
* `esbuild.mjs` — esbuild bundler configuration. Produces `dist/extension.js` for the published VSIX.
* `eslint.config.mjs` — ESLint rules for TypeScript source.
* `.prettierrc` — Prettier formatting configuration.
* `.markdownlint.json` — markdownlint rules applied to all Markdown files.
* `.markdownlintignore` — Markdown files excluded from linting.
* `.stylelintrc.json` — Stylelint rules for any CSS in the webview.
* `jsconfig.json` — JavaScript project configuration for script files outside the TypeScript compilation boundary.
* `print2paper4vscode.code-workspace` — VS Code workspace file.
