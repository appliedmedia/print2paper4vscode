#!/usr/bin/env node

/**
 * Generate root package.json from template
 * Copies the template and resolves {{extId}} placeholders using the
 * single source of truth in src/types/_entrypoint_extId_t.ts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const templatePath = path.join(projectRoot, 'config', 'template.package.json');
const outputPath = path.join(projectRoot, 'package.json');

if (!fs.existsSync(templatePath)) {
  console.error(`ERROR: Template not found: ${templatePath}`);
  process.exit(1);
}

// Extract kExtId from the source of truth
const extIdPath = path.join(projectRoot, 'src', 'types', '_entrypoint_extId_t.ts');
if (!fs.existsSync(extIdPath)) {
  console.error(`ERROR: Source of truth not found: ${extIdPath}`);
  process.exit(1);
}

const content = fs.readFileSync(extIdPath, 'utf8');

// Each placeholder maps to the source-of-truth constant in _entrypoint_extId_t.ts.
// Two extractor shapes:
//   { from: 'kFoo' }                  → matches `export const kFoo = '<value>'`
//   { from: 'kObj', key: 'someKey' }  → matches `someKey: '<value>'` inside `export const kObj = { ... }`
// Add a row here when introducing a new {{name}} placeholder in template.package.json.
const placeholders = {
  extId: { from: 'kExtId' },
  cmdPrint: { from: 'kCommandPrint' },
  cmdPersistClear: { from: 'kCommandPersistClear' },
  urlHomePage: { from: 'kURL', key: 'homePage' },
  urlSupport: { from: 'kURL', key: 'support' },
};

// Extract the body of `export const <name> = { ... } as const` using brace
// counting so that nested objects (e.g. `{ a: { b: 'x' } }`) are handled
// correctly. Returns the inner body string (between the outer braces) or
// null if the declaration cannot be found.
function extractObjectBody(source, constName) {
  const headRe = new RegExp(`export const ${constName}\\s*=\\s*\\{`);
  const headMatch = source.match(headRe);
  if (!headMatch) return null;
  const start = headMatch.index + headMatch[0].length; // first char inside the {
  let depth = 1;
  let i = start;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth === 0) break;
    i++;
  }
  if (depth !== 0) return null;
  return source.slice(start, i);
}

const values = {};
for (const [name, spec] of Object.entries(placeholders)) {
  let m;
  if (spec.key) {
    const body = extractObjectBody(content, spec.from);
    if (body === null) {
      console.error(
        `ERROR: Could not find object literal for ${spec.from} in ${extIdPath}. ` +
        `Expected: export const ${spec.from} = { ... } as const;`
      );
      process.exit(1);
    }
    const keyRe = new RegExp(`${spec.key}\\s*:\\s*['"]([^'"]+)['"]`);
    m = body.match(keyRe);
    if (!m) {
      console.error(
        `ERROR: Could not extract key '${spec.key}' from ${spec.from} in ${extIdPath}.`
      );
      process.exit(1);
    }
  } else {
    const re = new RegExp(`export const ${spec.from}\\s*=\\s*['"]([^'"]+)['"]`);
    m = content.match(re);
    if (!m) {
      console.error(
        `ERROR: Could not extract ${spec.from} from ${extIdPath}. ` +
        `Expected a line matching: export const ${spec.from} = '<value>'.`
      );
      process.exit(1);
    }
  }
  values[name] = m[1];
}

// Read template, replace all placeholders, and write to root
let templateContent = fs.readFileSync(templatePath, 'utf8');
let totalReplaced = 0;
for (const [name, value] of Object.entries(values)) {
  const re = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
  const count = (templateContent.match(re) || []).length;
  templateContent = templateContent.replace(re, value);
  totalReplaced += count;
}
fs.writeFileSync(outputPath, templateContent, 'utf8');
console.log(
  `✓ Generated package.json from template (replaced ${totalReplaced} placeholders: ${
    Object.keys(values).join(', ')
  })`
);
