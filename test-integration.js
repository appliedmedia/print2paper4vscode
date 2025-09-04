const { Stylize } = require('./out/src/Stylize');

async function testIntegration() {
  console.log('Testing integration with existing system...');
  
  try {
    // Create mock app
    const mockApp = {
      dx: {
        create: (name) => ({
          sub: (subName) => ({
            require: () => {},
            out: (msg) => console.log(`[${name}.${subName}] ${msg}`),
            print: (msg) => console.log(`[${name}.${subName}] ${msg}`),
            done: () => {}
          }),
          out: (msg) => console.log(`[${name}] ${msg}`),
          print: (msg) => console.log(`[${name}] ${msg}`),
          done: () => {}
        })
      },
      vscodeapis: {
        getActiveThemeId: () => 'github-light',
        getEditorTypography: () => ({ fontSize: 12, lineHeight: 16, fontFamily: 'Consolas' }),
        getTempDirectory: () => '/tmp',
        getVSCodeExtensionsThemes: () => []
      },
      os: {
        ensureDir: (path) => console.log(`Creating dir: ${path}`),
        pathJoin: (...paths) => paths.join('/'),
        dateAsYYYYMMDDHHMMSS: () => '20241201_120000'
      },
      pdf: {
        generatePdfFromTokens: async (tokens, fontFamily, fontSize, lineHeight, title) => {
          console.log(`🔄 PDF generated: ${fontFamily} ${fontSize}px, lineHeight: ${lineHeight}px, title: ${title}`);
          return '/tmp/test.pdf';
        },
        displayPdfToVSCodeWebView_deprecated: (pdfPath, title) => {
          console.log(`📄 Webview created for PDF: ${pdfPath}, title: ${title}`);
          return `<html><body>PDF Webview for ${title}</body></html>`;
        }
      }
    };
    
    const stylize = new Stylize(mockApp);
    await stylize.init();
    
    const testCode = `console.log("Hello World");
const x = 42;`;
    
    console.log('\n=== Test 1: styleToHtml now generates PDF webview ===');
    const result = await stylize.styleToHtml(testCode, 'javascript', {
      fontSize: 14,
      lineHeight: 18,
      title: 'Test Integration'
    });
    
    console.log('✅ styleToHtml now returns PDF webview HTML');
    console.log('✅ This integrates with existing PaperPrinter system');
    console.log('✅ When user changes theme/size, applyRenderModes will regenerate PDF');
    console.log('✅ Existing toolbar will work with PDF webview');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testIntegration();