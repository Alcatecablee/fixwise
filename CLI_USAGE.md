# NeuroLint CLI Usage Guide

## What is NeuroLint?

NeuroLint is a deterministic code analysis and transformation tool for TypeScript, JavaScript, React, and Next.js projects. It uses rule-based intelligence (not AI) to automatically detect and fix common code issues across 7 specialized layers.

## Origin Story

Born from frustration when a project had 700+ ESLint errors, hydration bugs, and missing React keys. Instead of fixing manually, an intelligent multi-layer fixing system was created that reduced 600+ issues down to just 70 - and NeuroLint was born.

## Quick Start

### Installation

The CLI is located in the `v1/` directory:

```bash
cd v1
```

### Basic Commands

**Analyze your code:**
```bash
node cli.js analyze <path> --layers=1,2,3,4
```

**Get project statistics:**
```bash
node cli.js stats <path>
```

**Show all available commands:**
```bash
node cli.js --help
```

**Check layer information:**
```bash
node cli.js layers --verbose
```

## The 7 Layers

### Layer 1: Configuration Fixes
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package.json optimization
- **Free tier available**

### Layer 2: Pattern Fixes
- HTML entity corruption (`&quot;`, `&#x27;`, `&amp;`)
- Unused imports cleanup
- Console.log to console.debug conversion
- React pattern standardization
- **Free tier available**

### Layer 3: Component Fixes
- Missing React keys in .map()
- Button variant props
- Missing aria-labels
- Image alt attributes
- Form field structure
- **Free tier available**

### Layer 4: Hydration & SSR Fixes
- localStorage without SSR guards
- window/document access protection
- Theme provider hydration mismatches
- Client-only component wrapping
- **Free tier available**

### Layer 5: Next.js App Router Fixes
- "use client" directive placement
- Server vs client component detection
- App Router optimizations
- **Requires paid tier**

### Layer 6: Testing & Validation
- Test file generation
- Missing test coverage detection
- Quality improvements
- **Requires paid tier**

### Layer 7: Adaptive Pattern Learning
- Learns from your codebase
- Custom rule generation
- Pattern recognition and application
- **Requires paid tier**

## Usage Examples

### Analyze a Single File
```bash
node cli.js analyze client/src/pages/dashboard.tsx --layers=1,2,3,4
```

### Analyze Entire Directory
```bash
node cli.js analyze client/src --layers=1,2,3,4 --verbose
```

### Get Project Statistics
```bash
node cli.js stats .
```

Output:
```
Files: 61 (61 successful, 0 failed)
Issues: 15
States: 0, Backups: 0
Learned Rules: 0
Performance: 1609ms (14 files/sec)
Memory: 88.91MB (peak: 9.8MB)
```

### Fix with Dry Run (Preview Changes)
```bash
node cli.js fix client/src --layers=1,2,3,4 --dry-run --verbose
```

### Clean Old Backups
```bash
node cli.js clean --older-than=7 --verbose
```

## Results from This Codebase

When tested on this NeuroLint dashboard project:

- **Files Analyzed:** 61
- **Total Issues Found:** 15
- **Average Issues per File:** 0.2 (very clean!)
- **Layer Recommendations:**
  - Layer 4 (Hydration): 4 files (6.6%)
  - Layer 5 (Next.js): 2 files (3.3%)
- **Performance:** 14 files/sec

## Authentication (Optional)

For access to layers 5-7 (enterprise features):

```bash
# Login with API key
node cli.js login <your-api-key>

# Check authentication status
node cli.js status

# Logout
node cli.js logout
```

Free tier includes layers 1-4 with unlimited usage.

## Advanced Options

### Custom File Patterns
```bash
node cli.js analyze src/ --include="**/*.tsx" --exclude="**/*.test.tsx"
```

### Output Formats
```bash
# JSON output
node cli.js analyze src/ --format=json --output=results.json

# Console output (default)
node cli.js analyze src/ --format=console
```

### Backup Management
```bash
# Enable backups (default)
node cli.js fix src/ --backup

# Disable backups
node cli.js fix src/ --no-backup

# Production-grade backups with encryption
node cli.js fix src/ --production
```

### Parallel Processing
```bash
node cli.js fix src/ --parallel=8 --verbose
```

## Rule Management (Layer 7)

```bash
# List learned rules
node cli.js rules --list

# Export rules
node cli.js rules --export=my-rules.json

# Import rules
node cli.js rules --import=my-rules.json

# Edit rule confidence
node cli.js rules --edit=0 --confidence=0.9

# Delete a rule
node cli.js rules --delete=0

# Reset all rules
node cli.js rules --reset
```

## Migration Commands

### Next.js 15.5 Migration
```bash
node cli.js migrate-nextjs-15.5 . --dry-run --verbose
```

### React 19 Migration
```bash
node cli.js migrate-react19 . --dry-run --verbose
```

### ESLint to Biome Migration
```bash
node cli.js migrate-biome . --dry-run --verbose
```

## Current Status

### ✅ Working Features
- **Analysis Engine:** Fully functional, analyzes code and detects issues
- **Layer Detection:** Smart recommendations for which layers to apply
- **Statistics:** Project health metrics and performance data
- **Backup System:** Creates backups before modifications
- **CLI Interface:** Complete command structure and help system

### 🚧 In Development
- **Fix Application:** Layer transformations are being finalized
- **Validator Integration:** Code validation after fixes
- **API Authentication:** Connection to app.neurolint.dev

### 📊 Test Results
Tested on this codebase (NeuroLint dashboard):
- ✅ Analyzed 61 files successfully
- ✅ Detected 15 issues accurately
- ✅ Performance: 14 files/sec
- ✅ Layer recommendations working correctly

## Architecture

### Files Structure
```
v1/
├── cli.js                          # Main CLI entry point
├── fix-master.js                   # Orchestrator for all layers
├── shared-core/                    # Core utilities
│   ├── analytics.js
│   ├── config-manager.js
│   └── rule-engine.js
├── scripts/                        # Layer implementations
│   ├── fix-layer-1-config.js
│   ├── fix-layer-2-patterns.js
│   ├── fix-layer-3-components.js
│   ├── fix-layer-4-hydration.js
│   ├── fix-layer-5-nextjs.js
│   ├── fix-layer-6-testing.js
│   └── fix-layer-7-adaptive.js
├── ast-transformer.js              # AST-based code transformations
├── backup-manager.js               # Backup system
└── validator.js                    # Code validation
```

## Philosophy

**NeuroLint is NOT AI-powered.** It uses:
- ✅ Deterministic rule-based transformations
- ✅ AST (Abstract Syntax Tree) parsing
- ✅ Pattern recognition
- ✅ Precise, predictable fixes

**No LLM hallucinations. No unpredictable rewrites. Just intelligent, rule-based code fixes.**

## Support

- **Dashboard:** Located at root level (Express + React)
- **Documentation:** See `/Fixwise/README.md` for layer details
- **Get API Key:** https://app.neurolint.dev/dashboard (for layers 5-7)

## Next Steps

1. Try analyzing your project: `node v1/cli.js analyze . --layers=1,2,3,4`
2. Review the detected issues
3. Run with `--dry-run` to preview fixes
4. Apply fixes layer by layer for safety

---

**Built with ❤️ for developers who want deterministic, not AI-driven, code quality.**
