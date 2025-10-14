import { describe, it } from 'node:test';
import * as assert from 'node:assert';

describe('Template Dictionary Replacement', () => {
  // Test the template replacement logic directly
  const templateDictReplace = (source: string, dictionary: Record<string, string>): string => {
    let result = source;
    let iter = 0;
    const iter_max = 4;

    // Keep replacing until no more {{...}} patterns or hit max iterations
    while (result.includes('{{') && ++iter < iter_max) {
      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return dictionary.hasOwnProperty(key) ? dictionary[key] : match; // Return value even if empty string
      });
    }

    return result;
  };

  it('should replace all placeholders with dictionary values', () => {
    const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
    const dictionary = {
      NAME: 'John',
      AGE: '30',
      CITY: 'New York',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello John, your age is 30 and you live in New York');
  });

  it('should handle empty dictionary', () => {
    const source = 'Hello {{NAME}}, your age is {{AGE}}';
    const dictionary: Record<string, string> = {};

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello {{NAME}}, your age is {{AGE}}');
  });

  it('should handle empty string values in dictionary', () => {
    const source = '123{{ITEM_PREFIX}}456{{ITEM_SUFFIX}}789';
    const dictionary = {
      ITEM_PREFIX: '',
      ITEM_SUFFIX: '',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, '123456789');
  });

  it('should handle missing keys in dictionary', () => {
    const source = 'Hello {{NAME}}, your age is {{AGE}} and you live in {{CITY}}';
    const dictionary = {
      NAME: 'John',
      AGE: '30',
      // CITY is missing
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello John, your age is 30 and you live in {{CITY}}');
  });

  it('should handle no placeholders in source', () => {
    const source = 'Hello World, this is a simple string';
    const dictionary = {
      NAME: 'John',
      AGE: '30',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello World, this is a simple string');
  });

  it('should handle special characters in values', () => {
    const source = 'Message: {{MESSAGE}}';
    const dictionary = {
      MESSAGE: 'Hello & <world> with "quotes" and \'apostrophes\'',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Message: Hello & <world> with "quotes" and \'apostrophes\'');
  });

  it('should handle multiple occurrences of the same placeholder', () => {
    const source = '{{GREETING}} {{NAME}}! {{GREETING}} again, {{NAME}}!';
    const dictionary = {
      GREETING: 'Hello',
      NAME: 'John',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello John! Hello again, John!');
  });

  it('should handle complex nested placeholders with multi-pass', () => {
    const source =
      '{{SECTION_1_TITLE}}: {{SECTION_1_CONTENT}} | {{SECTION_2_TITLE}}: {{SECTION_2_CONTENT}}';
    const dictionary = {
      SECTION_1_TITLE: 'Introduction',
      SECTION_1_CONTENT: 'Welcome to {{APP_NAME}}',
      SECTION_2_TITLE: 'Conclusion',
      SECTION_2_CONTENT: 'Thanks for using {{APP_NAME}}',
      APP_NAME: 'MyApp',
    };

    const result = templateDictReplace(source, dictionary);
    // With multi-pass replacement (up to 3 iterations), nested {{APP_NAME}} should be replaced
    assert.strictEqual(
      result,
      'Introduction: Welcome to MyApp | Conclusion: Thanks for using MyApp'
    );
  });

  it('should handle whitespace in placeholder names', () => {
    const source = 'Hello {{FIRST_NAME}} {{LAST_NAME}}';
    const dictionary = {
      FIRST_NAME: 'John',
      LAST_NAME: 'Doe',
    };

    const result = templateDictReplace(source, dictionary);
    assert.strictEqual(result, 'Hello John Doe');
  });
});
