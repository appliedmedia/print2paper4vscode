# Template dictionary replacement

Generic template variable replacement tool for build and automation scripts.

## Core concepts

**See [`templateDictReplace.mjs`](./templateDictReplace.mjs) header** for implementation details: modes, path resolution, exit codes.

**Single config file:** One `templateDictReplace.yaml` contains all replacement configs. Entries without `source` are for CLI mode, entries with `source` are for config mode.

**Two modes:**

1. **Config mode** - Loads values from compiled JS/YAML files for build-time replacement
2. **CLI mode** (`--dict`) - Applies runtime JSON dictionary for CI/CD

**Template syntax:** `{{placeholder}}` replaced with dictionary values

## Quick start

### CLI mode

```bash
node templateDictReplace.mjs --dict '{"key":"value","foo":"bar"}'
```

### Config mode

```bash
node templateDictReplace.mjs
```

## Configuration format

`templateDictReplace.yaml` defines file processing rules:

```yaml
replacements:
  # CLI mode example (no source)
  - file: templates/badge.svg
    yamlKey: coverage  # Extract this key from YAML file
    output: build/coverage.svg
  
  # Config mode example (with source)
  - file: template.json
    output: build/output.json
    template: "{{extId}}"
    source: out/types/constants.js
    key: EXT_ID
```

**Fields:**

- `file` - Input template (relative to project root)
- `output` - Output path (relative to project root)
- `yamlKey` - Extract this key from YAML input before processing
- `template` - Placeholder to find (config mode only, e.g., `{{extId}}`)
- `source` - Source file for value (config mode only: .js/.yaml)
- `key` - Export/key to extract from source (config mode only)

## Examples

### Badge generation (CLI mode)

CI/CD runtime value injection:

```yaml
replacements:
  - file: svgs.yaml
    yamlKey: coverage
    output: images/coverage.svg
```

```bash
node templateDictReplace.mjs --dict '{"coverage":"85.5","color":"97ca00"}'
```

### Package.json generation (config mode)

Build-time constant injection:

```yaml
replacements:
  - file: template.package.json
    output: package.json
    template: "{{extId}}"
    source: out/src/constants.js
    key: EXTENSION_ID
```

```bash
node templateDictReplace.mjs
```

### Extract from YAML source

```yaml
replacements:
  - file: template.md
    output: README.md
    template: "{{projectName}}"
    source: metadata.yaml
    key: name
```

## Integration patterns

### CI/CD badge generation

```yaml
- name: Generate badges
  run: |
    node scripts/templateDictReplace/templateDictReplace.mjs --dict '{"coverage":"85","color":"97ca00"}'
```

### Build-time constant injection

```json
{
  "scripts": {
    "prebuild": "node scripts/templateDictReplace/templateDictReplace.mjs"
  }
}
```

### YAML key extraction

Extract specific key from YAML input before replacement:

```yaml
replacements:
  - file: templates.yaml
    yamlKey: badge_template
    output: badge.svg
```

**Result:** Processes only `templates.yaml[badge_template]` value

## Troubleshooting

**Config not found:** Ensure `templateDictReplace.yaml` exists in script directory

**Paths fail:** Use paths relative to project root (detected via `.git` or `package.json`)

**Invalid JSON:** Single-quote `--dict` argument: `--dict '{...}'`

**Missing keys:** Verify JS export name or YAML key exists in source file
