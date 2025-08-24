import { describe, it } from 'node:test';
import assert from 'node:assert';
import { App } from '../src/App.js';
describe('App templateDictReplace', () => {
    // Create a minimal mock context for App constructor
    const mockContext = {
        subscriptions: {
            push: () => { }
        }
    };
    let app;
    // Initialize app before tests
    app = new App(mockContext);
    it('should replace all placeholders with dictionary values', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
        const dictionary = {
            NAME: 'John',
            AGE: '30',
            CITY: 'New York'
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John, your age is 30 and you live in New York');
    });
    it('should handle empty dictionary', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}}';
        const dictionary = {};
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello {{NAME}}, your age is {{AGE}}');
    });
    it('should handle missing keys in dictionary', () => {
        const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
        const dictionary = {
            NAME: 'John',
            AGE: '30'
            // CITY is missing
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John, your age is 30 and you live in {{CITY}}');
    });
    it('should handle no placeholders in source', () => {
        const source = 'Hello World, this is a simple string';
        const dictionary = {
            NAME: 'John',
            AGE: '30'
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello World, this is a simple string');
    });
    it('should handle special characters in values', () => {
        const source = 'Message: {{MESSAGE}}';
        const dictionary = {
            MESSAGE: 'Hello & <world> with "quotes" and \'apostrophes\''
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Message: Hello & <world> with "quotes" and \'apostrophes\'');
    });
    it('should handle multiple occurrences of the same placeholder', () => {
        const source = '{{GREETING}} {{NAME}}! {{GREETING}} again, {{NAME}}!';
        const dictionary = {
            GREETING: 'Hello',
            NAME: 'John'
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John! Hello again, John!');
    });
    it('should handle complex nested placeholders', () => {
        const source = '{{SECTION_1_TITLE}}: {{SECTION_1_CONTENT}} | {{SECTION_2_TITLE}}: {{SECTION_2_CONTENT}}';
        const dictionary = {
            SECTION_1_TITLE: 'Introduction',
            SECTION_1_CONTENT: 'Welcome to {{APP_NAME}}',
            SECTION_2_TITLE: 'Conclusion',
            SECTION_2_CONTENT: 'Thanks for using {{APP_NAME}}'
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Introduction: Welcome to {{APP_NAME}} | Conclusion: Thanks for using {{APP_NAME}}');
    });
    it('should handle whitespace in placeholder names', () => {
        const source = 'Hello {{FIRST_NAME}} {{LAST_NAME}}';
        const dictionary = {
            'FIRST_NAME': 'John',
            'LAST_NAME': 'Doe'
        };
        const result = app.templateDictReplace(source, dictionary);
        assert.strictEqual(result, 'Hello John Doe');
    });
});
//# sourceMappingURL=App-Template.test.js.map