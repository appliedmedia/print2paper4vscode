#!/usr/bin/env node

/**
 * Custom linter for embedded CSS, JS, and HTML in YAML files
 * Extracts code blocks from YAML files and lints them using appropriate tools
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const { Parser } = require('htmlparser2');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractCodeBlocks(yamlContent) {
  const blocks = [];
  const lines = yamlContent.split('\n');
  let currentBlock = null;
  let inCodeBlock = false;
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code block start (e.g., "scroll_css: |")
    const codeBlockMatch = line.match(/^(\s*)([a-zA-Z_]+_(css|js|html)):\s*\|/);
    if (codeBlockMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: codeBlockMatch[2].split('_').pop(), // css, js, or html
        name: codeBlockMatch[2],
        content: '',
        lineNumber: i + 1,
        indent: codeBlockMatch[1].length
      };
      inCodeBlock = true;
      indentLevel = currentBlock.indent;
      continue;
    }

    // If we're in a code block, collect content
    if (inCodeBlock && currentBlock) {
      // Check if we've reached the end of the code block
      if (line.trim() === '' || line.startsWith(' ') || line.startsWith('\t')) {
        // Still in code block, add content
        if (line.length > indentLevel) {
          currentBlock.content += line.substring(indentLevel) + '\n';
        } else {
          currentBlock.content += '\n';
        }
      } else {
        // End of code block
        blocks.push(currentBlock);
        currentBlock = null;
        inCodeBlock = false;
      }
    }
  }

  // Don't forget the last block
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function lintCSS(cssContent, fileName) {
  let tempFile = null;
  try {
    // Preprocess CSS to handle template variables
    // Replace template variables with valid CSS identifiers for linting
    const processedCSS = cssContent
      .replace(/\{\{ns\}\}/g, 'p2p4vsc') // Replace {{ns}} with actual namespace value
      .replace(/\{\{ns_\}\}/g, 'p2p4vsc_') // Replace {{ns_}} with actual namespace prefix
      .replace(/\{\{[^}]+\}\}/g, 'template-var') // Replace other {{var}} with valid identifier
      .replace(/\{\%[^%]+\%\}/g, 'template-var'); // Replace {%var%} with valid identifier
    
    // Create a temporary CSS file
    tempFile = path.join(__dirname, '..', 'temp', `${fileName}.css`);
    fs.writeFileSync(tempFile, processedCSS);
    
    // Use stylelint if available, otherwise just validate syntax
    try {
      execSync(`npx stylelint "${tempFile}" --config .stylelintrc.json`, { stdio: 'pipe', timeout: 30000 });
      return { success: true, errors: [] };
    } catch (error) {
      // stylelint failed, extract error message
      const errorMessage = error.stdout?.toString() || error.stderr?.toString() || error.message;
      return { success: false, errors: [`Stylelint error: ${errorMessage}`] };
    }
  } catch (error) {
    return { success: false, errors: [`CSS linting failed: ${error.message}`] };
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}

function lintJS(jsContent, fileName) {
  try {
    // For template-based JavaScript, we'll do minimal validation
    // Template JS often has unbalanced braces due to template variables and HTML embedding
    const errors = [];
    const lines = jsContent.split('\n');
    
    lines.forEach((line, index) => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        return;
      }
      
      // Only check for obvious syntax errors that would break the code
      // Don't check for balanced braces/parentheses as template code often spans multiple lines
      if (line.trim().startsWith('function') && !line.includes('(')) {
        errors.push(`Line ${index + 1}: Function declaration missing parentheses`);
      }
      if (line.trim().startsWith('if') && !line.includes('(') && !line.includes('else')) {
        errors.push(`Line ${index + 1}: If statement missing parentheses`);
      }
      if (line.trim().startsWith('for') && !line.includes('(') && !line.includes('in') && !line.includes('of')) {
        errors.push(`Line ${index + 1}: For loop missing parentheses`);
      }
    });
    
    return { success: errors.length === 0, errors };
  } catch (error) {
    return { success: false, errors: [`JavaScript linting failed: ${error.message}`] };
  }
}

function lintHTML(htmlContent, fileName) {
  try {
    // Preprocess HTML to handle template variables
    const processedHTML = htmlContent
      .replace(/\{\{[^}]+\}\}/g, '<!-- template-var -->') // Replace {{var}} with comment
      .replace(/\{\%[^%]+\%\}/g, '<!-- template-var -->'); // Replace {%var%} with comment
    
    const errors = [];
    
    // Use htmlparser2 to validate HTML structure
    const parser = new Parser({
      onerror: (error) => {
        errors.push(`Parse error: ${error.message}`);
      },
      onend: () => {
        // Parser completed successfully
      }
    }, {
      decodeEntities: false, // Don't decode entities to preserve template syntax
      lowerCaseAttributeNames: false, // Preserve case for template variables
      recognizeSelfClosing: true // Handle self-closing tags properly
    });
    
    try {
      parser.write(processedHTML);
      parser.end();
    } catch (parseError) {
      errors.push(`Parser exception: ${parseError.message}`);
    }
    
    return { success: errors.length === 0, errors };
  } catch (error) {
    return { success: false, errors: [`HTML linting failed: ${error.message}`] };
  }
}

function lintYamlFile(filePath) {
  log(`\n${colors.bold}Linting ${filePath}${colors.reset}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const codeBlocks = extractCodeBlocks(content);
    
    if (codeBlocks.length === 0) {
      log('  No code blocks found', 'yellow');
      return { success: true, errors: [] };
    }
    
    let allSuccess = true;
    const allErrors = [];
    
    // Create temp directory
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    for (const block of codeBlocks) {
      log(`  Linting ${block.name} (${block.type})...`, 'blue');
      
      let result;
      switch (block.type) {
        case 'css':
          result = lintCSS(block.content, `${path.basename(filePath)}_${block.name}`);
          break;
        case 'js':
          result = lintJS(block.content, `${path.basename(filePath)}_${block.name}`);
          break;
        case 'html':
          result = lintHTML(block.content, `${path.basename(filePath)}_${block.name}`);
          break;
        default:
          result = { success: true, errors: [] };
      }
      
      if (result.success) {
        log(`    ✓ ${block.name} passed`, 'green');
      } else {
        log(`    ✗ ${block.name} failed`, 'red');
        result.errors.forEach(error => {
          log(`      ${error}`, 'red');
          allErrors.push(`${filePath}:${block.name}: ${error}`);
        });
        allSuccess = false;
      }
    }
    
    // Clean up temp files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    return { success: allSuccess, errors: allErrors };
    
  } catch (error) {
    log(`  Error reading file: ${error.message}`, 'red');
    return { success: false, errors: [`${filePath}: ${error.message}`] };
  }
}

function main() {
  const yamlFiles = process.argv.slice(2);
  
  if (yamlFiles.length === 0) {
    // Find all YAML files in src directory
    const srcDir = path.join(__dirname, '..', 'src');
    const files = fs.readdirSync(srcDir)
      .filter(file => file.endsWith('.yaml'))
      .map(file => path.join(srcDir, file));
    
    if (files.length === 0) {
      log('No YAML files found in src directory', 'yellow');
      return;
    }
    
    yamlFiles.push(...files);
  }
  
  log(`${colors.bold}Linting embedded code in YAML files${colors.reset}`);
  
  let totalSuccess = true;
  const allErrors = [];
  
  for (const filePath of yamlFiles) {
    const result = lintYamlFile(filePath);
    if (!result.success) {
      totalSuccess = false;
      allErrors.push(...result.errors);
    }
  }
  
  if (totalSuccess) {
    log(`\n${colors.bold}${colors.green}All YAML code blocks passed linting!${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.bold}${colors.red}Linting failed with ${allErrors.length} errors:${colors.reset}`);
    allErrors.forEach(error => log(error, 'red'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractCodeBlocks, lintCSS, lintJS, lintHTML, lintYamlFile };