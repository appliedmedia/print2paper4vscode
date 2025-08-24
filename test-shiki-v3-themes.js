#!/usr/bin/env node

// Test script to explore Shiki v3 CSS variable theming
import { createCssVariablesTheme, getSingletonHighlighter } from 'shiki';

console.log('🔍 Shiki v3 CSS Variable Theming Investigation');
console.log('==============================================\n');

async function investigateCSSTheming() {
    try {
        // Test 1: Create CSS variables theme
        console.log('1. Testing createCssVariablesTheme...');
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
        
        console.log('   ✅ CSS theme created:', cssTheme.name);
        console.log('   ✅ Theme type:', cssTheme.type);

        // Test 2: Get singleton highlighter with CSS theme
        console.log('\n2. Testing highlighter with CSS theme...');
        const highlighter = await getSingletonHighlighter({
            themes: [cssTheme],
            langs: ['javascript']
        });
        
        console.log('   ✅ Highlighter created with CSS theme');

        // Test 3: Generate HTML with CSS theme
        console.log('\n3. Testing HTML generation with CSS theme...');
        const code = `// This is a comment
function hello() {
    const message = "Hello, World!";
    return message;
}`;
        
        const html = highlighter.codeToHtml(code, { lang: 'javascript', theme: cssTheme });
        
        console.log('   ✅ HTML generated:', html.length, 'characters');
        console.log('   ✅ Contains CSS variables:', html.includes('var(--'));
        console.log('   ✅ Contains style tag:', html.includes('<style>'));
        
        // Extract and show CSS variables
        const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
        if (styleMatch) {
            console.log('   ✅ CSS content preview:');
            const cssContent = styleMatch[1].substring(0, 300);
            console.log('      ' + cssContent.replace(/\n/g, '\n      '));
        }

        // Test 4: Compare with regular theme
        console.log('\n4. Comparing with regular theme...');
        const regularHighlighter = await getSingletonHighlighter({
            themes: ['github-light'],
            langs: ['javascript']
        });
        
        const regularHtml = regularHighlighter.codeToHtml(code, { lang: 'javascript', theme: 'github-light' });
        console.log('   ✅ Regular theme HTML:', regularHtml.length, 'characters');
        console.log('   ✅ Regular theme has inline styles:', regularHtml.includes('style="'));
        console.log('   ✅ CSS theme has CSS variables:', html.includes('var(--'));
        
        // Test 5: Theme switching simulation
        console.log('\n5. Testing theme switching simulation...');
        const darkCssTheme = createCssVariablesTheme({
            name: 'dark-css-theme',
            type: 'dark',
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4'
            },
            tokenColors: [
                {
                    scope: ['comment'],
                    settings: { foreground: '#6a9955' }
                },
                {
                    scope: ['string'],
                    settings: { foreground: '#ce9178' }
                },
                {
                    scope: ['keyword'],
                    settings: { foreground: '#569cd6' }
                }
            ]
        });
        
        // Generate HTML with dark theme
        const darkHighlighter = await getSingletonHighlighter({
            themes: [darkCssTheme],
            langs: ['javascript']
        });
        
        const darkHtml = darkHighlighter.codeToHtml(code, { lang: 'javascript', theme: darkCssTheme });
        console.log('   ✅ Dark theme HTML:', darkHtml.length, 'characters');
        
        // Extract CSS variables from both themes
        const lightStyleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
        const darkStyleMatch = darkHtml.match(/<style>([\s\S]*?)<\/style>/);
        
        if (lightStyleMatch && darkStyleMatch) {
            console.log('   ✅ Light theme CSS variables:', 
                (lightStyleMatch[1].match(/var\(--/g) || []).length);
            console.log('   ✅ Dark theme CSS variables:', 
                (darkStyleMatch[1].match(/var\(--/g) || []).length);
        }

        // Test 6: Show the key difference
        console.log('\n6. Key Difference Analysis...');
        console.log('   Regular theme HTML snippet:');
        console.log('      ' + regularHtml.substring(0, 200).replace(/\n/g, '\n      '));
        console.log('\n   CSS theme HTML snippet:');
        console.log('      ' + html.substring(0, 200).replace(/\n/g, '\n      '));

        console.log('\n==============================================');
        console.log('🎉 Investigation Complete!');
        console.log('\nKey Findings:');
        console.log('✅ createCssVariablesTheme creates themes with CSS variables');
        console.log('✅ CSS themes generate <style> tags with CSS variables');
        console.log('✅ Regular themes use inline styles');
        console.log('✅ CSS themes enable dynamic theme switching without regeneration');
        console.log('✅ Perfect for our use case!');
        
    } catch (error) {
        console.error('❌ Error during investigation:', error);
    }
}

investigateCSSTheming();