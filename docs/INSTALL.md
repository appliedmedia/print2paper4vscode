# Print2Paper4VSCode Extension Installation Guide

## Prerequisites

- VSCode 1.103.0 or higher
- Node.js 18+ (for development)

## Installation Options

### Option 1: Install from Source (Recommended for Development)

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` in VSCode to run the extension in development mode

### Option 2: Package and Install (For Distribution)

1. Install the VSCode Extension Manager: `npm install -g @vscode/vsce`
2. Package the extension: `npx @vscode/vsce package`
3. Install the generated `.vsix` file in VSCode:
   - Open VSCode
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu and select "Install from VSIX..."
   - Choose the generated `.vsix` file

## Extension Features

### Commands

- **Print2Paper** (`Alt+P`): Print current selection or entire document
- **Capture Preview Content**: Capture content from preview tabs

### Features

- **Shiki v3 Integration**: Modern syntax highlighting with on-demand language loading
- **Dynamic Theme Discovery**: Automatically finds all available VSCode themes
- **Generic UI System**: Standardized menu system with consistent naming
- **Template System**: Centralized template replacement for maintainable code
- **Error Handling**: Proper error messages when features aren't implemented

### Supported Languages

- All languages supported by Shiki v3
- Languages are loaded on-demand for optimal performance

### Themes

- **Shiki Themes**: All bundled Shiki themes (GitHub Light, etc.)
- **VSCode Themes**: All installed VSCode themes (requires proper implementation)

## Development

### Running Tests

```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:verbose  # Run tests with verbose output
```

### Building

```bash
npm run compile       # Compile TypeScript to JavaScript
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Architecture

- **ESM Modules**: Full ES Module support throughout
- **Generic Systems**: Reusable UI components and template system
- **Error Handling**: No fallbacks - proper error messages
- **Type Safety**: Full TypeScript support

## Troubleshooting

### Common Issues

1. **Extension won't load**: Check VSCode version compatibility
2. **Syntax highlighting not working**: Verify Shiki v3 installation
3. **Themes not showing**: Check VSCode theme extension installation

### Debug Mode

- Press `F5` to run in development mode
- Check Developer Console for error messages
- Use VSCode's built-in debugging tools

## Validation

The extension has been validated with:

- ✅ 35 tests passing across 6 test suites
- ✅ ESM compatibility verified
- ✅ Shiki v3 integration tested
- ✅ UIMenu system validated
- ✅ Template system verified
- ✅ Error handling confirmed

## Next Steps

After installation:

1. Open a code file
2. Select some text or use the entire document
3. Press `Alt+P` or use Command Palette: "Print2Paper"
4. Choose your preferred theme and settings
5. Print or save as PDF

## Support

For issues or questions:

- Check the test suite for expected behavior
- Review error messages for specific issues
- Ensure all dependencies are properly installed
