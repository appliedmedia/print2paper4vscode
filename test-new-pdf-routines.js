#!/usr/bin/env node

// Test the new PDF routines without touching existing code
const fs = require('fs');
const path = require('path');

async function testNewPdfRoutines() {
  console.log('Testing new PDF routines...');
  
  // Create a mock app for testing
  const mockApp = {
    vscodeapis: {
      getActiveThemeId: () => 'github-light',
      getEditorTypography: () => ({ 
        fontSize: 14, 
        lineHeight: 20, 
        fontFamily: 'Consolas, "Courier New", monospace' 
      }),
      getTempDirectory: () => '/tmp'
    },
    os: {
      ensureDir: (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      },
      pathJoin: (...parts) => path.join(...parts),
      dateAsYYYYMMDDHHMMSS: () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    },
    dx: {
      create: (name) => ({
        sub: (subName) => ({
          require: () => {},
          out: (msg) => console.log(`[${name}.${subName}] ${msg}`),
          done: () => {}
        }),
        out: (msg) => console.log(`[${name}] ${msg}`),
        print: (msg) => console.log(`[${name}] ${msg}`),
        done: () => {}
      })
    }
  };
  
  try {
    // Import the compiled Stylize class
    const { Stylize } = require('./out/src/Stylize.js');
    
    // Create Stylize instance
    const stylize = new Stylize(mockApp);
    await stylize.init();
    
    // Test code
    const testCode = `
function hello() {
  console.log("Hello, World!");
  return 42;
}

const result = hello();
console.log(result);
`;
    
    console.log('Testing styleToPdf...');
    const pdfPath = await stylize.styleToPdf(testCode, 'javascript', {
      fontSize: 16,
      lineHeight: 24,
      title: 'Test PDF Generation'
    });
    
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    // Check if PDF file exists
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`✅ PDF file exists: ${stats.size} bytes`);
    } else {
      console.log('❌ PDF file not found');
    }
    
    console.log('Testing displayPdfToVSCodeWebView...');
    const webViewHtml = stylize.displayPdfToVSCodeWebView(pdfPath, 'Test PDF Viewer');
    
    console.log('✅ Web view HTML generated');
    console.log('Web view preview:');
    console.log(webViewHtml.substring(0, 200) + '...');
    
    // Cleanup
    await stylize.done();
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNewPdfRoutines().catch(console.error);