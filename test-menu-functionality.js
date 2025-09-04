const { PDF } = require('./out/src/PDF');
const { Stylize } = require('./out/src/Stylize');

async function testMenuFunctionality() {
  console.log('Testing menu bar functionality...');
  
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
          console.log('PDF.generatePdfFromTokens called with:');
          console.log('- Font:', fontFamily, fontSize);
          console.log('- Line height:', lineHeight);
          console.log('- Title:', title);
          console.log('- Tokens sample:', JSON.stringify(tokens[0]?.slice(0, 2), null, 2));
          return '/tmp/test.pdf';
        }
      }
    };
    
    const stylize = new Stylize(mockApp);
    const pdf = new PDF(mockApp);
    await stylize.init();
    
    // Test 1: Generate initial PDF
    console.log('\n=== Test 1: Generate initial PDF ===');
    const testCode = `console.log("Hello World");
const x = 42;`;
    
    const pdfPath = await stylize.styleToPdf(testCode, 'javascript', {
      fontSize: 14,
      lineHeight: 18,
      title: 'Test PDF with Menu'
    });
    
    // Test 2: Generate webview with menu
    console.log('\n=== Test 2: Generate webview with menu ===');
    const webviewHtml = pdf.displayPdfToVSCodeWebView_deprecated(pdfPath, 'Test PDF with Menu');
    
    // Test 3: Check if menu has the right functionality
    console.log('\n=== Test 3: Check menu functionality ===');
    const hasPrintButton = webviewHtml.includes('onclick="printPdf()"');
    const hasSaveButton = webviewHtml.includes('onclick="downloadPdf()"');
    const hasRefreshButton = webviewHtml.includes('onclick="refreshPdf()"');
    const hasPdfJs = webviewHtml.includes('pdf.js');
    const hasCanvas = webviewHtml.includes('pdf-canvas');
    
    console.log('Menu features:');
    console.log('- Print button:', hasPrintButton ? '✅' : '❌');
    console.log('- Save button:', hasSaveButton ? '✅' : '❌');
    console.log('- Refresh button:', hasRefreshButton ? '✅' : '❌');
    console.log('- PDF.js library:', hasPdfJs ? '✅' : '❌');
    console.log('- Canvas element:', hasCanvas ? '✅' : '❌');
    
    // Test 4: Simulate menu interaction
    console.log('\n=== Test 4: Simulate menu interaction ===');
    console.log('When user clicks "Refresh", it should:');
    console.log('1. Call loadPdf() function');
    console.log('2. Re-render the PDF on canvas');
    console.log('3. Update the display with new content');
    
    // Write webview to file for manual inspection
    require('fs').writeFileSync('test-menu-webview.html', webviewHtml);
    console.log('\nWebview HTML written to test-menu-webview.html');
    console.log('Open this file in a browser to test the menu functionality manually');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMenuFunctionality();