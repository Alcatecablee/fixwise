# NeuroLint CLI Test Commands for Dealeeoo Project

## Basic Commands

### Show Version
```bash
neurolint --version
```

### Show Help
```bash
neurolint --help
```

### Show All Layers
```bash
neurolint layers
```

## Analysis Commands (Safe - No Changes)

### Analyze Project
```bash
# Basic analysis
neurolint analyze C:\Users\Clive\dealeeoo

# Verbose analysis with detailed output
neurolint analyze C:\Users\Clive\dealeeoo --verbose

# Analyze specific folder
neurolint analyze C:\Users\Clive\dealeeoo\src --verbose
```

### Check Project Statistics
```bash
neurolint stats C:\Users\Clive\dealeeoo --verbose
```

### Validate Without Changes
```bash
neurolint validate C:\Users\Clive\dealeeoo --verbose
```

### Check React 19 Dependency Compatibility
```bash
# Check only (no fixes)
neurolint check-deps C:\Users\Clive\dealeeoo --verbose

# Check and apply fixes
neurolint check-deps C:\Users\Clive\dealeeoo --fix --verbose
```

### Check Turbopack Migration Readiness
```bash
neurolint check-turbopack C:\Users\Clive\dealeeoo --verbose
```

### Check React Compiler Opportunities
```bash
neurolint check-compiler C:\Users\Clive\dealeeoo --verbose
```

### Assess Router Complexity
```bash
neurolint assess-router C:\Users\Clive\dealeeoo --verbose
```

### Detect React 19.2 Feature Opportunities
```bash
neurolint detect-react192 C:\Users\Clive\dealeeoo --verbose
```

## Dry Run Commands (Preview Changes - No Modifications)

### Preview All Layer Fixes
```bash
neurolint fix C:\Users\Clive\dealeeoo --all-layers --dry-run --verbose
```

### Preview Specific Layer Fixes
```bash
# Layer 1: Configuration
neurolint fix C:\Users\Clive\dealeeoo --layers=1 --dry-run --verbose

# Layer 2: Patterns
neurolint fix C:\Users\Clive\dealeeoo --layers=2 --dry-run --verbose

# Layer 3: Components & Accessibility
neurolint fix C:\Users\Clive\dealeeoo --layers=3 --dry-run --verbose

# Layer 4: Hydration & SSR
neurolint fix C:\Users\Clive\dealeeoo --layers=4 --dry-run --verbose

# Layer 5: Next.js Optimization
neurolint fix C:\Users\Clive\dealeeoo --layers=5 --dry-run --verbose

# Layer 6: Testing & Error Handling
neurolint fix C:\Users\Clive\dealeeoo --layers=6 --dry-run --verbose

# Layer 7: Adaptive Learning
neurolint fix C:\Users\Clive\dealeeoo --layers=7 --dry-run --verbose

# Multiple layers at once
neurolint fix C:\Users\Clive\dealeeoo --layers=1,2,3 --dry-run --verbose
```

### Preview Migration Commands
```bash
# React 19 migration preview
neurolint migrate-react19 C:\Users\Clive\dealeeoo --dry-run --verbose

# Next.js 16 migration preview
neurolint migrate-nextjs-16 C:\Users\Clive\dealeeoo --dry-run --verbose

# Next.js 15.5 migration preview
neurolint migrate-nextjs-15.5 C:\Users\Clive\dealeeoo --dry-run --verbose

# Biome migration preview
neurolint migrate-biome C:\Users\Clive\dealeeoo --dry-run --verbose
```

## Actual Fix Commands (MAKES CHANGES - Use with caution)

### Apply Fixes with Backup
```bash
# All layers with automatic backup
neurolint fix C:\Users\Clive\dealeeoo --all-layers --backup --verbose

# Specific layers with backup
neurolint fix C:\Users\Clive\dealeeoo --layers=1,2,3 --backup --verbose
```

### Apply Fixes Without Backup (Use with caution)
```bash
# All layers
neurolint fix C:\Users\Clive\dealeeoo --all-layers --verbose

# Specific layers
neurolint fix C:\Users\Clive\dealeeoo --layers=1 --verbose
```

## Migration Commands (MAKES CHANGES)

### React 19 Migration
```bash
# With backup
neurolint migrate-react19 C:\Users\Clive\dealeeoo --backup --verbose

# Without backup
neurolint migrate-react19 C:\Users\Clive\dealeeoo --verbose
```

### Next.js 16 Migration
```bash
neurolint migrate-nextjs-16 C:\Users\Clive\dealeeoo --backup --verbose
```

### Biome Migration
```bash
neurolint migrate-biome C:\Users\Clive\dealeeoo --backup --verbose
```

## Backup Management

### List Backups
```bash
neurolint backup list
```

### Restore from Backup
```bash
neurolint restore --interactive
```

## Testing Workflow (Recommended Order)

### Step 1: Analyze First
```bash
neurolint analyze C:\Users\Clive\dealeeoo --verbose
```

### Step 2: Check Dependencies
```bash
neurolint check-deps C:\Users\Clive\dealeeoo --verbose
```

### Step 3: Preview Fixes
```bash
neurolint fix C:\Users\Clive\dealeeoo --all-layers --dry-run --verbose
```

### Step 4: Apply Layer by Layer (Safest Approach)
```bash
# Start with configuration
neurolint fix C:\Users\Clive\dealeeoo --layers=1 --backup --verbose

# Then patterns
neurolint fix C:\Users\Clive\dealeeoo --layers=2 --backup --verbose

# Continue with other layers as needed
neurolint fix C:\Users\Clive\dealeeoo --layers=3 --backup --verbose
```

### Step 5: Validate
```bash
neurolint validate C:\Users\Clive\dealeeoo --verbose
```

## Quick Reference by Use Case

### "I want to see what issues exist"
```bash
neurolint analyze C:\Users\Clive\dealeeoo --verbose
```

### "I want to see what would be fixed"
```bash
neurolint fix C:\Users\Clive\dealeeoo --all-layers --dry-run --verbose
```

### "I want to fix everything safely"
```bash
neurolint fix C:\Users\Clive\dealeeoo --all-layers --backup --verbose
```

### "I want to migrate to React 19"
```bash
# Preview first
neurolint migrate-react19 C:\Users\Clive\dealeeoo --dry-run --verbose

# Then apply
neurolint migrate-react19 C:\Users\Clive\dealeeoo --backup --verbose
```

### "I want to check Turbopack compatibility"
```bash
neurolint check-turbopack C:\Users\Clive\dealeeoo --verbose
```

### "I need to undo changes"
```bash
neurolint restore --interactive
```

## Notes

- **Always use `--dry-run` first** to preview changes before applying
- **Always use `--backup`** when making actual changes to create restore points
- **Use `--verbose`** to see detailed output and understand what's happening
- The CLI validates all transformations twice (AST + regex fallback) to prevent breaking your code
- All paths can be relative or absolute
- On Windows, use backslashes `\` or forward slashes `/` in paths
