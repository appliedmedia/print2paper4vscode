#!/usr/bin/env node

// Simple PDF generator using Puppeteer directly
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(inputHtmlPath, outputPdfPath, options = {}) {
  let browser;
  try {
    // Launch browser with headless mode and necessary flags for headless environments
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    const page = await browser.newPage();
    
    // Load the HTML file
    const htmlContent = fs.readFileSync(inputHtmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF with options
    const pdfOptions = {
      path: outputPdfPath,
      format: 'A4',
      printBackground: false,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      ...options
    };

    await page.pdf(pdfOptions);
    console.log(`PDF generated successfully: ${outputPdfPath}`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// If called directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node PDFGenerator.js <input.html> <output.pdf> [options]');
    process.exit(1);
  }
  
  const [inputPath, outputPath] = args;
  generatePDF(inputPath, outputPath)
    .then(() => {
      console.log('PDF generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('PDF generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generatePDF };