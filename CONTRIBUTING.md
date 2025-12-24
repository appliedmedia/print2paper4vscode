# Contributing to Print2Paper4VSCode

First off, thanks for taking the time to contribute!

## How to Contribute

1. **Fork the repository** and clone it locally.
2. **Create a branch** for your edits.
3. **Make your changes** and adhere to the coding standards (see `docs/AGENTS.md`).
4. **Run tests** to ensure no regressions: `npm test`.
5. **Submit a Pull Request** describing your changes.

## Development Setup

See [INSTALL.md](docs/INSTALL.md) for detailed setup instructions.

## Coding Standards

- Use TypeScript with strict mode.
- Follow the Registry pattern for dependency injection.
- Ensure all tests pass.
- Run `npm run lint` and `npm run format` before committing.

## Pull Request Process

1. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
2. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent.
3. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.
