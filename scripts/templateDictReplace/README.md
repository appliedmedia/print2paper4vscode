# Template dictionary replacement

Generic template variable replacement tool for build and automation scripts.

## Primary documentation

**See [`templateDictReplace.mjs`](./templateDictReplace.mjs)** for complete documentation including:

- Overview of both operational modes (Config and CLI)
- Usage examples and syntax
- Template placeholder format (`{{variable}}`)
- Configuration file structure
- Path resolution logic
- Exit codes and error handling

The script header contains comprehensive inline documentation.

## Quick start

### CLI mode (runtime values)

```bash
node templateDictReplace.mjs --dict '{"key":"value","foo":"bar"}'
```

### Config mode (build-time imports)

```bash
node templateDictReplace.mjs
```

## Files in this directory

- **`templateDictReplace.mjs`** - Main template replacement engine
- **`templateDictReplace.yaml`** - Configuration file (defines replacements)
- **`README.md`** - This file

## Configuration format

The `templateDictReplace.yaml` file defines which files to process:

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

### Configuration fields

- **file** - Input file to process (relative path)
- **output** - Output file path (relative path)
- **yamlKey** - If input file is YAML, extract this key's value first
- **template** - Template placeholder to replace (e.g., `{{extId}}`)
- **source** - Source file for replacement value (JS module or YAML file)
- **key** - What to extract from source (JS export name or YAML key)

## Usage modes

### 1. CLI mode (--dict flag)

Apply runtime values to templates. Useful for CI/CD:

```bash
node templateDictReplace.mjs --dict '{"coverage":"84.83","color":"green"}'
```

**How it works:**
1. Reads config file
2. Skips entries without `source` field
3. Applies all dictionary values to matched templates
4. Replaces `{{key}}` with corresponding value

**Example use case:** Generate badges with dynamic values in CI

### 2. Config mode (default)

Import values from compiled modules or YAML files:

```bash
node templateDictReplace.mjs
```

**How it works:**
1. Reads config file
2. For each replacement with `source`:
   - Loads source file (JS module or YAML)
   - Extracts value using `key`
   - Replaces `template` with value in `file`
   - Writes result to `output`

**Example use case:** Inject version numbers from package.json into build artifacts

## Template syntax

Templates use double curly braces:

```
Hello {{name}}!
Version: {{version}}
```

With dictionary `{"name":"World","version":"1.0"}` becomes:

```
Hello World!
Version: 1.0
```

## Path resolution

Paths in config are relative to project root:
- Script directory → `scripts/templateDictReplace/`
- Project root → Go up two levels

## Examples

### Badge generation (CLI mode)

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

## Error handling

The script will exit with error if:
- Configuration file not found
- Input file doesn't exist
- Source file not found (config mode)
- Key not found in source (config mode)
- Invalid JSON in --dict argument (CLI mode)

## Integration

### With badges4readmes

The badges4readmes system uses this tool in CLI mode:

```bash
node ../templateDictReplace/templateDictReplace.mjs --dict "{...badge data...}"
```

### With build scripts

Add to your build process:

```json
{
  "scripts": {
    "prebuild": "node scripts/templateDictReplace/templateDictReplace.mjs"
  }
}
```

### With CI workflows

```yaml
- name: Generate files from templates
  run: |
    node scripts/templateDictReplace/templateDictReplace.mjs --dict '{"version":"${{ github.ref }}"}'
```

## Advanced features

### YAML key extraction

If input file is YAML, use `yamlKey` to extract a specific key before processing:

```yaml
replacements:
  - file: templates.yaml
    yamlKey: badge_template
    output: badge.svg
```

This extracts `templates.yaml[badge_template]` before applying replacements.

### Placeholder detection

The script warns if placeholders remain after replacement:

```
WARNING: 2 placeholders remain after replacement: {{foo}}, {{bar}}
```

### Dry run output

View what will be replaced without writing files:

```bash
node templateDictReplace.mjs | grep "Replaced:"
```

## Troubleshooting

**"Configuration file not found"**
- Ensure `templateDictReplace.yaml` is in same directory or project `.config/`

**"Input file not found"**
- Check paths are relative to project root, not script directory

**"Key not found in source"**
- Verify export name (JS) or YAML key (YAML) exists in source file

**"Invalid JSON object"**
- Use single quotes around --dict argument in bash
- Ensure valid JSON object (not array or string)

## Source

This tool is used across Applied Media projects:
- `appliedmedia/print2paper4vscode` - Original implementation
- `appliedmedia/ops` - Shared organizational scripts

See `scripts/badges4readmes/` for example usage.
