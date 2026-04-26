# Contributing to Print2Paper4VSCode

First off, thanks for taking the time to contribute!

## How to Contribute

1. **Fork the repository** and clone it locally.
2. **Create a branch** for your edits.
3. **Make your changes** and adhere to the coding standards (see `docs/AGENTS.md`).
4. **Run tests** to ensure no regressions: `npm test`.
5. **Submit a Pull Request** describing your changes.

## Development Setup

See the [Quick Start](README.md#quick-start) section in the root README for prerequisites and setup steps.

## Packaging the extension locally

If you need to build a `.vsix` locally for sideloading, pass the marketplace doc paths so vsce ships the user-facing files (not the developer README/CHANGELOG):

```bash
npx @vscode/vsce package --readme-path docs/MARKETPLACE.md --changelog-path docs/MARKETPLACE_CHANGELOG.md
```

Without those flags, vsce would ship the repo-root `README.md` and `CHANGELOG.md`, which are written for contributors, not marketplace users.

## Coding Standards

- Use TypeScript with strict mode.
- Follow the Registry pattern for dependency injection.
- Ensure all tests pass.
- Run `npm run lint` and `npm run format` before committing.

## Pull Request Process

1. Ensure your code adheres to the project's coding standards.
2. Update the README.md with details of changes to commands, configuration settings, or user-facing features if applicable.
3. Ensure all tests pass locally (`npm test`).
4. Submit your Pull Request. It will be reviewed by the maintainers.
