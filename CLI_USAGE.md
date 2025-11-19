# NeuroLint CLI Usage Guide

## What is NeuroLint?

NeuroLint is a deterministic code analysis and transformation tool for TypeScript, JavaScript, React, and Next.js projects. It uses rule-based intelligence (not AI) to automatically detect and fix common code issues across 7 specialized layers.

## Origin Story

Born from frustration when a project had 700+ ESLint errors, hydration bugs, and missing React keys. Instead of fixing manually, an intelligent multi-layer fixing system was created that reduced 600+ issues down to just 70 - and NeuroLint was born.

## Installation

```bash
npm install -g @neurolint/cli
```

## 🆓 All Layers Are Free!

**GREAT NEWS**: All 7 layers of NeuroLint are now completely free with no authentication required!

### Layer 1: Configuration Fixes
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package.json optimization
- ✅ **FREE - No auth required**

### Layer 2: Pattern Fixes
- HTML entity corruption (`&quot;`, `&#x27;`, `&amp;`)
- Unused imports cleanup
- Console.log removal
- React pattern standardization
- ✅ **FREE - No auth required**

### Layer 3: Component Fixes
- Missing React keys in .map()
- Button variant props
- Missing aria-labels
- Image alt attributes
- Form field structure
- ✅ **FREE - No auth required**

### Layer 4: Hydration & SSR Fixes
- localStorage without SSR guards
- window/document access protection
- Theme provider hydration mismatches
- Client-only component wrapping
- ✅ **FREE - No auth required**

### Layer 5: Next.js App Router Fixes
- "use client" directive placement
- Server vs client component detection
- App Router optimizations
- ✅ **FREE - No auth required**

### Layer 6: Testing & Validation
- Test file generation
- Missing test coverage detection
- Quality improvements
- ✅ **FREE - No auth required**

### Layer 7: Adaptive Pattern Learning
- Learns from your codebase
- Custom rule generation
- Pattern recognition and application
- ✅ **FREE - No auth required**

## Quick Start

### Get Started - No Authentication Needed!

```bash
# Install globally
npm install -g @neurolint/cli

# Analyze your project
neurolint analyze src/

# Fix all issues with all layers (completely free!)
neurolint fix src/ --all-layers --verbose

# Preview changes before applying
neurolint fix src/ --all-layers --dry-run --verbose

# Fix specific layers
neurolint fix src/ --layers=1,2,3 --verbose
```

### What NeuroLint Fixes

**Example Before:**
```tsx
function Component({ items }) {
  console.log('Debug info');
  return (
    <div>
      &quot;Hello&quot;
      {items.map(item => <div>{item}</div>)}
    </div>
  );
}
```

**Example After (All Layers Applied):**
```tsx
function Component({ items }) {
  // [NeuroLint] Removed console.log: 'Debug info'
  return (
    <div>
      "Hello"
      {items.map((item, index) => <div key={index}>{item}</div>)}
    </div>
  );
}
```

**All Layers Fix:**
- ✅ HTML entity corruption
- ✅ Console.log removal
- ✅ Missing React keys
- ✅ Hydration issues (localStorage, window access)
- ✅ Missing accessibility attributes
- ✅ "use client" directives
- ✅ And much more!

## Basic Commands

### Show All Commands
```bash
neurolint --help
```

### Show Layer Information
```bash
neurolint layers --verbose
```

### Check Version
```bash
neurolint --version
```

### Get Project Statistics
```bash
neurolint stats .
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

## Usage Examples

### Basic Examples

**Analyze a Single File:**
```bash
neurolint analyze src/components/Button.tsx
```

**Analyze Entire Directory:**
```bash
neurolint analyze src/ --verbose
```

**Fix All Issues (All Layers):**
```bash
# Preview changes first
neurolint fix src/ --all-layers --dry-run --verbose

# Apply all fixes
neurolint fix src/ --all-layers --verbose
```

**Fix Specific Files:**
```bash
neurolint fix src/components/Button.tsx --all-layers
```

### Layer-Specific Examples

**Fix React Keys (Layer 3):**
```bash
neurolint fix src/ --layers=3 --verbose
```

**Fix Hydration Issues (Layer 4):**
```bash
neurolint fix src/ --layers=4 --verbose
```

**Fix Next.js App Router (Layer 5):**
```bash
neurolint fix src/ --layers=5 --verbose
```

**Combine Multiple Layers:**
```bash
neurolint fix src/ --layers=3,4,5 --verbose
```

## Migration Commands

### Next.js 15.5 Migration
```bash
# Preview migration changes
neurolint migrate . --all-layers --dry-run --verbose

# Apply migration with rollback safety
neurolint migrate . --all-layers --backup --verbose

# Migrate specific layers
neurolint migrate . --layers=1,2,5 --dry-run --verbose
```

### React 19 Migration
```bash
neurolint migrate-react19 . --dry-run --verbose
```

### ESLint to Biome Migration
```bash
neurolint migrate-biome . --dry-run --verbose
```

## Advanced Options

### Dry Run (Preview Changes)
```bash
neurolint fix src/ --layers=1,2 --dry-run --verbose
```

### Custom File Patterns
```bash
neurolint analyze src/ --include="**/*.tsx" --exclude="**/*.test.tsx"
```

### Output Formats
```bash
# JSON output
neurolint analyze src/ --format=json --output=results.json

# Console output (default)
neurolint analyze src/ --format=console
```

### Backup Management
```bash
# Enable backups (default)
neurolint fix src/ --backup

# Disable backups (not recommended)
neurolint fix src/ --no-backup

# Production-grade backups with encryption
neurolint fix src/ --production
```

### Parallel Processing
```bash
neurolint fix src/ --parallel=8 --verbose
```

### Clean Old Backups
```bash
# Clean backups older than 7 days
neurolint clean --older-than=7 --verbose

# Keep only latest 5 backups
neurolint clean --keep-latest=5 --verbose
```

## Rule Management (Layer 7 - Free!)

```bash
# List learned rules
neurolint rules --list

# Export rules
neurolint rules --export=my-rules.json

# Import rules
neurolint rules --import=my-rules.json

# Edit rule confidence
neurolint rules --edit=0 --confidence=0.9

# Delete a rule
neurolint rules --delete=0

# Reset all rules
neurolint rules --reset
```

## Real-World Workflow

### Step 1: Analyze Your Project
```bash
# See what issues exist
neurolint analyze src/ --verbose
```

### Step 2: Preview Changes
```bash
# Preview all fixes before applying
neurolint fix src/ --all-layers --dry-run --verbose
```

### Step 3: Apply All Fixes
```bash
# Fix all issues across all layers
neurolint fix src/ --all-layers --verbose
```

### Step 4: Verify & Review
```bash
# Check project statistics
neurolint stats .

# Review learned rules (Layer 7)
neurolint rules --list
```

## Integration Examples

### Pre-commit Hook
```bash
# In .husky/pre-commit
neurolint fix src/ --all-layers --dry-run || exit 1
```

### CI/CD Pipeline
```bash
# Analyze and generate report
neurolint analyze src/ --format=json --output=analysis.json

# Auto-fix all issues
neurolint fix src/ --all-layers --verbose
```

### Team Collaboration
```bash
# Export team rules
neurolint rules --export=team-rules.json

# Import on other machines
neurolint rules --import=team-rules.json
```

## Troubleshooting

### "No changes applied" but file was modified

**Issue:** Output may show conflicting messages about fixes.

**Solution:** Check the actual file - if changes are present, it worked. This is a reporting bug, not a functional bug.

### Command not working

**Check available layers:**
```bash
neurolint layers --verbose
```

**Try analyzing first:**
```bash
neurolint analyze src/ --verbose
```

**Use dry-run to preview changes:**
```bash
neurolint fix src/ --all-layers --dry-run --verbose
```

## Philosophy

**NeuroLint is NOT AI-powered.** It uses:
- ✅ Deterministic rule-based transformations
- ✅ AST (Abstract Syntax Tree) parsing
- ✅ Pattern recognition
- ✅ Precise, predictable fixes

**No LLM hallucinations. No unpredictable rewrites. Just intelligent, rule-based code fixes.**

## Current Status

### ✅ Working Features
- **Analysis Engine:** Fully functional, analyzes code and detects issues
- **Layer Detection:** Smart recommendations for which layers to apply
- **Statistics:** Project health metrics and performance data
- **Backup System:** Creates backups before modifications
- **CLI Interface:** Complete command structure and help system
- **All 7 Layers:** Completely free and available without authentication
  - Layer 1-2: Configuration and pattern fixes
  - Layer 3-5: Component, hydration, and Next.js fixes
  - Layer 6-7: Testing and adaptive learning

## Support & Resources

- **Published Package:** https://www.npmjs.com/package/@neurolint/cli
- **Issue Tracking:** Check npm page for latest updates

## Next Steps

1. **Install NeuroLint:** `npm install -g @neurolint/cli`
2. **Analyze your project:** `neurolint analyze .`
3. **Preview all fixes:** `neurolint fix . --all-layers --dry-run`
4. **Apply all fixes:** `neurolint fix . --all-layers`
5. **Review statistics:** `neurolint stats .`

---

**Built for developers who want deterministic, rule-based code quality - not AI-driven unpredictability.**
