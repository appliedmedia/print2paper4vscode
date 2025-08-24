#!/usr/bin/env node

import { createCssVariablesTheme, getSingletonHighlighter } from 'shiki';

async function testCSSOutput() {
    const cssTheme = createCssVariablesTheme({
        name: 'custom-css-theme',
        type: 'light',
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#000000'
        },
        tokenColors: [
            {
                scope: ['comment'],
                settings: { foreground: '#6a737d' }
            },
            {
                scope: ['string'],
                settings: { foreground: '#032f62' }
            },
            {
                scope: ['keyword'],
                settings: { foreground: '#d73a49' }
            }
        ]
    });

    const highlighter = await getSingletonHighlighter({
        themes: [cssTheme],
        langs: ['javascript']
    });

    const code = `// This is a comment
function hello() {
    const message = "Hello, World!";
    return message;
}`;

    const html = highlighter.codeToHtml(code, { lang: 'javascript', theme: cssTheme });
    
    console.log('Full HTML Output:');
    console.log('==================');
    console.log(html);
    
    // Check for CSS variables
    const cssVars = html.match(/var\(--[^)]+\)/g);
    console.log('\nCSS Variables found:', cssVars ? cssVars.length : 0);
    if (cssVars) {
        cssVars.forEach((cssVar, i) => {
            console.log(`  ${i + 1}. ${cssVar}`);
        });
    }
}

testCSSOutput();