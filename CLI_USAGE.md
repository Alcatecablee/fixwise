# NeuroLint CLI - Complete Usage Guide

> **Version 1.3.9** | Last Updated: November 25, 2025

Comprehensive guide for using NeuroLint CLI to automatically fix React, Next.js, and TypeScript code issues using deterministic AST transformations.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Getting Started](#getting-started)
3. [Command Atlas](#command-atlas)
4. [Guided Workflows](#guided-workflows)
5. [Integration & Automation](#integration--automation)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)
8. [Release Notes](#release-notes)

---

## Quick Reference

### TL;DR - Most Common Commands

```bash
# Install globally
npm install -g @neurolint/cli

# Analyze your project
neurolint analyze src/ --verbose

# Preview all fixes (dry run)
neurolint fix src/ --all-layers --dry-run --verbose

# Apply all fixes
neurolint fix src/ --all-layers --verbose

# Migrate to React 19
neurolint migrate-react19 . --dry-run --verbose

# Migrate to Next.js 16
neurolint migrate-nextjs-16 . --dry-run --verbose

# Check React 19 dependency compatibility
neurolint check-deps . --fix
```

### Layer Overview Table

| Layer | What It Fixes | When to Use | Example Issues |
|-------|--------------|-------------|----------------|
| **1: Configuration** | tsconfig.json, next.config.js, package.json | Outdated configs, build errors | `"target": "es5"` → `"es2022"` |
| **2: Patterns** | HTML entities, console.log, unused imports | Code cleanup, deprecated syntax | `&quot;` → `"`, remove debug logs |
| **3: Components** | React keys, accessibility, props | Missing keys, WCAG compliance | `.map()` without keys, missing alt text |
| **4: Hydration** | SSR guards, client-only APIs | Hydration errors, SSR crashes | `localStorage` without guards |
| **5: Next.js** | 'use client', Server Components, imports | App Router optimization | Missing directives, wrong imports |
| **6: Testing** | Error boundaries, test generation | Missing tests, error handling | Components without error boundaries |
| **7: Adaptive** | Custom patterns, learned rules | Project-specific conventions | Team-specific patterns |

### Feature Comparison

| Feature | ESLint | Biome | NeuroLint |
|---------|--------|-------|-----------|
| Auto-fix common issues | Partial | Yes | Yes |
| AST-based transformations | Limited | Limited | Comprehensive |
| React 19 migration | No | No | **Yes** |
| Next.js 16 migration | No | No | **Yes** |
| Hydration fixes | No | No | **Yes** |
| Accessibility fixes | Rules only | Rules only | **Auto-fix** |
| Pattern learning | No | No | **Yes** |
| Zero config | No | Yes | **Yes** |
| Backup system | No | No | **Yes** |

---

## Getting Started

### Installation

```bash
# Global installation (recommended)
npm install -g @neurolint/cli

# Verify installation
neurolint --version

# Show available commands
neurolint --help
```

### Your First Analysis

```bash
# Navigate to your project
cd /path/to/your/project

# Analyze the entire project
neurolint analyze . --verbose

# Check project statistics
neurolint stats .
```

**Expected Output:**
```
Files: 61 (61 successful, 0 failed)
Issues: 15
States: 0, Backups: 0
Learned Rules: 0
Performance: 1609ms (14 files/sec)
Memory: 88.91MB (peak: 9.8MB)
```

### Your First Fix

```bash
# Preview changes (safe, no modifications)
neurolint fix src/ --all-layers --dry-run --verbose

# Apply fixes with backup
neurolint fix src/ --all-layers --backup --verbose

# Verify changes
git diff
```

---

## Command Atlas

### Core Commands

#### `neurolint analyze [path]`

Scans your codebase for issues and recommends which layers to apply.

```bash
# Basic analysis
neurolint analyze src/

# Verbose output with recommendations
neurolint analyze src/ --verbose

# Analyze single file
neurolint analyze src/components/Button.tsx

# JSON output for CI/CD
neurolint analyze src/ --format=json --output=analysis.json
```

**What it detects:**
- Configuration issues (Layer 1)
- Code patterns needing cleanup (Layer 2)
- Missing React keys and accessibility (Layer 3)
- Hydration risks (Layer 4)
- Next.js optimization opportunities (Layer 5)
- Missing tests (Layer 6)
- Custom patterns (Layer 7)

---

#### `neurolint fix [path]`

Applies automatic fixes to your codebase.

```bash
# Fix all issues (all 7 layers)
neurolint fix src/ --all-layers --verbose

# Fix specific layers
neurolint fix src/ --layers=1,2,3 --verbose

# Preview before applying
neurolint fix src/ --all-layers --dry-run --verbose

# Fix without backup (not recommended)
neurolint fix src/ --all-layers --no-backup
```

**Safety features:**
- Automatic backups before modifications
- Dry-run mode for previewing changes
- AST-based transformations (preserves code structure)
- Validation after each transformation

---

#### `neurolint validate [path]`

Validates code without making changes.

```bash
# Validate entire project
neurolint validate src/

# Validate specific files
neurolint validate src/components/**/*.tsx
```

---

#### `neurolint layers`

Lists all available transformation layers with descriptions.

```bash
# Show layer information
neurolint layers --verbose
```

---

### Migration Commands

#### `neurolint migrate-nextjs-16 [path]`

**NEW in v1.4.0!** Migrates your project to Next.js 16 compatibility.

```bash
# Preview migration
neurolint migrate-nextjs-16 . --dry-run --verbose

# Apply migration
neurolint migrate-nextjs-16 . --verbose
```

**What it does:**
- Renames `middleware.ts` → `proxy.ts`
- Migrates `experimental.ppr` → Cache Components
- Updates function exports from `middleware` to `proxy`
- Adds `export const runtime = "nodejs"` to proxy files
- Converts sync params to async: `({ params })` → `async (props) => { const params = await props.params }`
- Adds `await` to `cookies()` and `headers()` calls
- Ensures functions using `await` are marked `async`
- Migrates old caching APIs to new Next.js 16 APIs
- Adds `'use cache'` directives to Server Components
- Integrates `cacheLife` and `updateTag()` for cache management

---

#### `neurolint migrate-react19 [path]`

Migrates your project to React 19 compatibility.

```bash
# Preview migration
neurolint migrate-react19 . --dry-run --verbose

# Apply migration
neurolint migrate-react19 . --verbose

# Save migration report
neurolint migrate-react19 . --format=json --output=migration-report.json
```

**What it does:**
- Converts `forwardRef` to direct ref props
- Migrates string refs to callback refs
- Converts `ReactDOM.render` → `createRoot`
- Converts `ReactDOM.hydrate` → `hydrateRoot`
- Updates `react-dom/test-utils` imports (moves `act` to `react`)
- Warns about `unmountComponentAtNode` removal
- Detects legacy context APIs (`contextTypes`, `getChildContext`)
- Provides TypeScript migration guidance for PropTypes

---

#### `neurolint migrate-nextjs-15.5 [path]`

Migrates your project to Next.js 15.5 compatibility.

```bash
# Apply all layers for Next.js 15.5
neurolint fix . --all-layers --dry-run --verbose

# Add Node runtime to middleware (now stable)
neurolint fix middleware.ts --layers=5 --verbose
```

**What it does:**
- Type-safe routing with automatic interface generation
- Adds stable Node.js runtime to middleware
- Recommends Biome integration
- Enhances Server Actions with error handling
- Modernizes Metadata API with stricter TypeScript typing
- Adds caching optimizations
- Configures Turbopack for Next.js 15+

---

#### `neurolint migrate-biome [path]`

Migrates from ESLint to Biome (Next.js 15.5 recommendation).

```bash
# Preview migration
neurolint migrate-biome . --dry-run --verbose

# Apply migration
neurolint migrate-biome . --verbose
```

**What it does:**
- Updates `package.json` scripts (replaces `next lint` with `biome check`)
- Generates `biome.json` configuration
- Removes ESLint and Prettier config files
- Updates CI/CD configurations
- Maps existing ESLint rules to Biome equivalents

---

#### `neurolint fix-deprecations [path]`

Fixes Next.js 15.5 deprecations.

```bash
# Fix all deprecations
neurolint fix-deprecations . --verbose
```

**What it does:**
- Removes `legacyBehavior` props from Link components
- Updates router imports (`next/router` → `next/navigation`)
- Migrates image components (`next/legacy/image` → `next/image`)
- Suggests Server Component migration for `getServerSideProps`

---

### Analysis Commands (NEW in v1.4.0!)

#### `neurolint check-deps [path]`

Checks React 19 dependency compatibility.

```bash
# Check dependencies
neurolint check-deps .

# Auto-fix incompatible dependencies
neurolint check-deps . --fix
```

**What it checks:**
- `react-is` version compatibility
- `@radix-ui/*` package versions
- `antd` compatibility
- `next-auth` issues
- Creates `.npmrc` with `legacy-peer-deps` if needed
- Adds `overrides` to `package.json` for stubborn dependencies

---

#### `neurolint check-turbopack [path]`

Analyzes Turbopack migration readiness.

```bash
# Check Turbopack compatibility
neurolint check-turbopack .
```

**What it checks:**
- Webpack-specific configurations in `next.config.js`
- Incompatible loaders and plugins
- Babel configurations (suggests SWC migration)
- Recommends Turbopack filesystem caching

---

#### `neurolint check-compiler [path]`

Detects React Compiler optimization opportunities.

```bash
# Check for React Compiler opportunities
neurolint check-compiler .
```

**What it detects:**
- Manual `useMemo` patterns
- `useCallback` usage
- `React.memo` wrapping
- `useRef` for previous value tracking
- Recommends React Compiler when 3+ opportunities found

---

#### `neurolint assess-router [path]`

Assesses Next.js router complexity.

```bash
# Assess router complexity
neurolint assess-router . --verbose
```

**Provides:**
- Complexity score (0-100)
- Complexity level (Simple, Moderate, Complex, Enterprise)
- Detects App Router, Pages Router, middleware, API routes
- Identifies Server/Client Components
- Recommends optimal setup (plain React, minimal Next.js, full Next.js)

---

#### `neurolint detect-react192 [path]`

Detects React 19.2 feature opportunities.

```bash
# Detect React 19.2 opportunities
neurolint detect-react192 .
```

**What it finds:**
- **View Transitions:** Manual animation code that could use React 19.2 View Transitions API
- **useEffectEvent:** `useEffect` with callbacks that could benefit from `useEffectEvent`
- **Activity Component:** Components using `display: none` that could use Activity components

---

#### `neurolint assess [path]`

Assesses overall project complexity.

```bash
# Assess project complexity
neurolint assess ./src --verbose
```

**Provides:**
- Overall complexity score
- Feature usage analysis
- Unnecessary feature detection
- Simplification opportunities

---

#### `neurolint simplify [path]`

Simplifies project structure.

```bash
# Convert to plain React
neurolint simplify ./src --target=react --dry-run

# Simplify to minimal Next.js
neurolint simplify ./src --target=minimal-nextjs --dry-run

# Apply simplification
neurolint simplify ./src --target=react
```

---

### Utility Commands

#### `neurolint stats`

Get project statistics and insights.

```bash
# Project statistics
neurolint stats .

# JSON output for reporting
neurolint stats . --format=json --output=stats.json
```

---

#### `neurolint rules`

Manage learned patterns and custom rules (Layer 7).

```bash
# List learned rules
neurolint rules --list

# Export rules for team sharing
neurolint rules --export=team-rules.json

# Import rules on another machine
neurolint rules --import=team-rules.json

# Edit rule confidence
neurolint rules --edit=0 --confidence=0.9

# Delete a rule
neurolint rules --delete=0

# Reset all rules
neurolint rules --reset
```

---

#### `neurolint backups`

Manage centralized backups.

```bash
# List all backups
neurolint backups list

# Restore a specific backup
neurolint backups restore <backup-id> --yes

# Create manual backup
neurolint backups create src/
```

---

#### `neurolint clean`

Clean up old backup and state files.

```bash
# Clean backups older than 7 days
neurolint clean --older-than=7 --verbose

# Keep only latest 5 backups
neurolint clean --keep-latest=5 --verbose

# Clean state files too
neurolint clean --states --older-than=30
```

---

#### `neurolint init-config`

Generate or display configuration.

```bash
# Initialize configuration
neurolint init-config --init

# Show current configuration
neurolint init-config --show

# Validate configuration
neurolint init-config
```

---

#### `neurolint init-tests [path]`

Generate test files for components.

```bash
# Generate tests for all components
neurolint init-tests src/components/

# Preview test generation
neurolint init-tests src/components/ --dry-run
```

---

#### `neurolint health`

Run health check to verify configuration.

```bash
# Check system health
neurolint health
```

---

### Layer-Specific Commands

```bash
# Layer 1: Configuration fixes
neurolint config scan
neurolint config fix

# Layer 2: Pattern fixes
neurolint patterns scan
neurolint patterns fix

# Layer 3: Component fixes
neurolint components scan
neurolint components fix

# Layer 4: Hydration fixes
neurolint hydration scan
neurolint hydration fix

# Layer 5: Next.js fixes
neurolint nextjs scan
neurolint nextjs fix

# Layer 6: Testing fixes
neurolint testing scan
neurolint testing fix

# Layer 7: Adaptive pattern learning
neurolint adaptive scan
neurolint adaptive fix
```

---

### Command Flags & Options

| Flag | Description | Example |
|------|-------------|---------|
| `--all-layers` | Apply all 7 layers | `neurolint fix src/ --all-layers` |
| `--layers=<list>` | Specify which layers to apply | `--layers=1,2,3` |
| `--dry-run` | Preview changes without applying | `neurolint fix src/ --dry-run` |
| `--verbose` | Show detailed output | `--verbose` |
| `--backup` | Create backup before changes (default) | `--backup` |
| `--no-backup` | Skip backup creation | `--no-backup` |
| `--production` | Use production-grade backups with encryption | `--production` |
| `--format=<type>` | Output format (json/console/html) | `--format=json` |
| `--output=<file>` | Save output to file | `--output=results.json` |
| `--include=<pattern>` | Custom file patterns to include | `--include="**/*.tsx"` |
| `--exclude=<pattern>` | Custom file patterns to exclude | `--exclude="**/*.test.tsx"` |
| `--older-than=<days>` | Clean files older than N days | `--older-than=7` |
| `--keep-latest=<n>` | Keep only latest N backups | `--keep-latest=5` |
| `--fix` | Auto-fix (for check-deps) | `neurolint check-deps . --fix` |
| `--target=<type>` | Simplification target (react/minimal-nextjs) | `--target=react` |
| `--yes` | Confirm destructive operations | `--yes` |

---

## Guided Workflows

### Workflow 1: React 19 Migration (Complete)

**Scenario:** Upgrading from React 18 to React 19

**Time:** 15-30 minutes  
**Difficulty:** Moderate

```bash
# Step 1: Analyze current state
neurolint analyze . --verbose

# Step 2: Check dependency compatibility
neurolint check-deps . --fix

# Step 3: Preview React 19 migration
neurolint migrate-react19 . --dry-run --verbose

# Step 4: Apply migration with backup
neurolint migrate-react19 . --verbose

# Step 5: Verify changes
git diff

# Step 6: Update dependencies
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19

# Step 7: Run tests
npm test

# Step 8: Manual review
# Review warnings and suggestions in migration output
```

**Expected Changes:**
- `forwardRef` → direct ref props
- `ReactDOM.render` → `createRoot`
- `react-dom/test-utils` → `react` (for `act`)
- String refs → callback refs
- PropTypes → TypeScript interfaces (manual)

**Post-Migration Checklist:**
- [ ] All tests passing
- [ ] No console warnings in browser
- [ ] Server-side rendering works
- [ ] Type checking passes
- [ ] Performance benchmarks stable

---

### Workflow 2: Next.js 16 Migration (Complete)

**Scenario:** Upgrading from Next.js 15 to Next.js 16

**Time:** 20-45 minutes  
**Difficulty:** Advanced

```bash
# Step 1: Backup your project
git commit -am "Pre Next.js 16 migration"

# Step 2: Analyze router complexity
neurolint assess-router . --verbose

# Step 3: Check Turbopack readiness
neurolint check-turbopack .

# Step 4: Preview Next.js 16 migration
neurolint migrate-nextjs-16 . --dry-run --verbose

# Step 5: Apply migration
neurolint migrate-nextjs-16 . --verbose

# Step 6: Update Next.js
npm install next@16

# Step 7: Test middleware/proxy
# Verify middleware.ts → proxy.ts rename worked

# Step 8: Test caching
# Verify 'use cache' directives and cacheLife work

# Step 9: Run development server
npm run dev

# Step 10: Verify all routes work
# Test all pages, API routes, and middleware
```

**Expected Changes:**
- `middleware.ts` → `proxy.ts`
- `experimental.ppr` → Cache Components
- Sync params → async params with `await props.params`
- `cookies()` → `await cookies()`
- `headers()` → `await headers()`
- `'use cache'` directives added to Server Components
- `cacheLife` and `updateTag()` integrated

**Migration Notes:**
- Middleware logic remains the same, only file renamed
- PPR becomes Cache Components (auto-handled)
- All async APIs require `await`
- Caching is now explicit with `'use cache'`

---

### Workflow 3: Accessibility Compliance (WCAG 2.1 AA)

**Scenario:** Meeting accessibility standards

**Time:** 10-20 minutes  
**Difficulty:** Easy

```bash
# Step 1: Analyze accessibility issues
neurolint analyze . --verbose | grep -i "accessibility\|aria\|alt"

# Step 2: Preview accessibility fixes (Layer 3)
neurolint fix src/ --layers=3 --dry-run --verbose

# Step 3: Apply fixes
neurolint fix src/ --layers=3 --verbose

# Step 4: Verify with axe DevTools
# Use browser extension to check remaining issues

# Step 5: Manual review
# Check complex interactive components
```

**What Gets Fixed:**
- Missing `alt` attributes on images
- Missing `aria-label` on buttons
- Missing `key` props in `.map()` loops
- Missing `type` attribute on buttons
- Form field accessibility

**Manual Follow-Up:**
- Complex ARIA patterns (combobox, dialog, etc.)
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader testing

---

### Workflow 4: Hydration Error Resolution

**Scenario:** Fixing "Hydration failed" errors in Next.js

**Time:** 5-15 minutes  
**Difficulty:** Easy

```bash
# Step 1: Identify hydration issues
neurolint analyze . --verbose | grep -i "hydration\|ssr"

# Step 2: Preview hydration fixes (Layer 4)
neurolint fix src/ --layers=4 --dry-run --verbose

# Step 3: Apply fixes
neurolint fix src/ --layers=4 --verbose

# Step 4: Test in development
npm run dev

# Step 5: Verify no hydration warnings
# Check browser console for warnings
```

**What Gets Fixed:**
- `localStorage` without SSR guards → `typeof window !== 'undefined' ? localStorage : null`
- `window.matchMedia` → SSR-safe alternative
- `document.querySelector` → SSR guards
- Theme provider mismatches
- Client-only components

---

### Workflow 5: CI/CD Integration

**Scenario:** Automated code quality checks

**Time:** 10 minutes  
**Difficulty:** Intermediate

```bash
# Step 1: Add to package.json scripts
cat >> package.json <<EOF
{
  "scripts": {
    "lint:neurolint": "neurolint analyze src/ --format=json --output=neurolint-report.json",
    "fix:neurolint": "neurolint fix src/ --all-layers --verbose"
  }
}
EOF

# Step 2: Create GitHub Actions workflow
cat > .github/workflows/neurolint.yml <<EOF
name: NeuroLint Code Quality

on: [push, pull_request]

jobs:
  neurolint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g @neurolint/cli
      - run: npm run lint:neurolint
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: neurolint-report
          path: neurolint-report.json
EOF

# Step 3: Add pre-commit hook with Husky
npx husky add .husky/pre-commit "neurolint fix src/ --layers=2,3 --dry-run || exit 1"
```

**GitHub Actions Example (Complete):**

```yaml
name: NeuroLint Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install NeuroLint
        run: npm install -g @neurolint/cli
      
      - name: Analyze codebase
        run: neurolint analyze src/ --format=json --output=analysis.json
      
      - name: Check React 19 dependencies
        run: neurolint check-deps . --format=json --output=deps.json
        continue-on-error: true
      
      - name: Upload analysis results
        uses: actions/upload-artifact@v3
        with:
          name: neurolint-reports
          path: |
            analysis.json
            deps.json
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const analysis = JSON.parse(fs.readFileSync('analysis.json'));
            const comment = `## NeuroLint Analysis\n\nIssues found: ${analysis.issuesFound}\nFiles analyzed: ${analysis.filesAnalyzed}`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

**Pre-commit Hook Example:**

```bash
#!/bin/sh
# .husky/pre-commit

# Run NeuroLint on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?)$')

if [ -n "$STAGED_FILES" ]; then
  echo "Running NeuroLint on staged files..."
  neurolint fix $STAGED_FILES --layers=2,3 --dry-run --verbose
  
  if [ $? -ne 0 ]; then
    echo "NeuroLint found issues. Please fix them before committing."
    exit 1
  fi
fi

exit 0
```

---

### Workflow 6: Team Collaboration with Shared Rules

**Scenario:** Enforcing team code standards

**Time:** 5 minutes  
**Difficulty:** Easy

```bash
# Step 1: Team lead exports rules
neurolint rules --export=team-rules.json

# Step 2: Commit to repository
git add team-rules.json
git commit -m "Add team coding standards"
git push

# Step 3: Team members import rules
git pull
neurolint rules --import=team-rules.json

# Step 4: Apply team rules
neurolint fix src/ --layers=7 --verbose

# Step 5: Validate consistency
neurolint validate src/
```

---

## Integration & Automation

### VSCode Integration

**Create `.vscode/tasks.json`:**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "NeuroLint: Analyze",
      "type": "shell",
      "command": "neurolint analyze ${file} --verbose",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "NeuroLint: Fix All",
      "type": "shell",
      "command": "neurolint fix ${file} --all-layers --verbose",
      "problemMatcher": []
    },
    {
      "label": "NeuroLint: Fix Accessibility",
      "type": "shell",
      "command": "neurolint fix ${file} --layers=3 --verbose",
      "problemMatcher": []
    }
  ]
}
```

**Usage:** Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) → "Tasks: Run Task" → Select NeuroLint task

---

### Docker Integration

**Dockerfile:**

```dockerfile
FROM node:20-alpine

# Install NeuroLint globally
RUN npm install -g @neurolint/cli

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Run NeuroLint analysis
RUN neurolint analyze . --format=json --output=/reports/analysis.json

# Build your application
RUN npm ci
RUN npm run build

CMD ["npm", "start"]
```

---

### NPM Scripts Integration

**Add to `package.json`:**

```json
{
  "scripts": {
    "analyze": "neurolint analyze src/ --verbose",
    "fix": "neurolint fix src/ --all-layers --verbose",
    "fix:dry": "neurolint fix src/ --all-layers --dry-run --verbose",
    "fix:accessibility": "neurolint fix src/ --layers=3 --verbose",
    "fix:hydration": "neurolint fix src/ --layers=4 --verbose",
    "migrate:react19": "neurolint migrate-react19 . --dry-run --verbose",
    "migrate:nextjs16": "neurolint migrate-nextjs-16 . --dry-run --verbose",
    "check:deps": "neurolint check-deps .",
    "check:turbopack": "neurolint check-turbopack .",
    "check:compiler": "neurolint check-compiler .",
    "stats": "neurolint stats .",
    "clean:backups": "neurolint clean --older-than=7"
  }
}
```

**Usage:**
```bash
npm run analyze
npm run fix:dry
npm run migrate:react19
```

---

### GitLab CI Integration

**.gitlab-ci.yml:**

```yaml
neurolint:
  stage: test
  image: node:20-alpine
  
  before_script:
    - npm install -g @neurolint/cli
  
  script:
    - neurolint analyze src/ --format=json --output=analysis.json
    - neurolint check-deps . --format=json --output=deps.json
  
  artifacts:
    paths:
      - analysis.json
      - deps.json
    expire_in: 1 week
  
  only:
    - merge_requests
    - main
```

---

## Advanced Usage

### Custom File Patterns

```bash
# Include only TypeScript files
neurolint analyze src/ --include="**/*.ts" --include="**/*.tsx"

# Exclude test files
neurolint fix src/ --all-layers --exclude="**/*.test.*" --exclude="**/*.spec.*"

# Multiple patterns
neurolint analyze . \
  --include="src/**/*.tsx" \
  --include="app/**/*.tsx" \
  --exclude="**/__tests__/**" \
  --exclude="**/node_modules/**"
```

---

### Parallel Processing

```bash
# Process with 8 parallel workers
neurolint fix src/ --all-layers --parallel=8 --verbose

# For large codebases (adjust based on CPU cores)
neurolint fix . --all-layers --parallel=16
```

---

### Production-Grade Backups

```bash
# Enable production backups with encryption
neurolint fix src/ --all-layers --production --verbose

# Restore production backup
neurolint backups list
neurolint backups restore <backup-id> --yes
```

---

### Incremental Adoption Strategy

**Week 1: Configuration & Patterns**
```bash
neurolint fix src/ --layers=1,2 --verbose
```

**Week 2: Components & Accessibility**
```bash
neurolint fix src/ --layers=3 --verbose
```

**Week 3: Hydration & Next.js**
```bash
neurolint fix src/ --layers=4,5 --verbose
```

**Week 4: Testing & Adaptive**
```bash
neurolint fix src/ --layers=6,7 --verbose
```

---

### Decision Matrix: When to Use What

| Your Situation | Recommended Command | Why |
|----------------|---------------------|-----|
| Building simple SPA | `neurolint assess . && neurolint simplify . --target=react` | Next.js overhead not needed |
| Hydration errors | `neurolint fix src/ --layers=4` | SSR-specific issues |
| Accessibility audit needed | `neurolint fix src/ --layers=3` | WCAG compliance |
| Upgrading to React 19 | `neurolint migrate-react19 .` | Automated breaking change fixes |
| Upgrading to Next.js 16 | `neurolint migrate-nextjs-16 .` | Middleware, PPR, caching updates |
| Team code inconsistency | `neurolint fix src/ --layers=2,7` | Patterns + adaptive learning |
| Pre-production checklist | `neurolint fix src/ --all-layers` | Comprehensive fixes |
| CI/CD quality gate | `neurolint analyze src/ --format=json` | Non-destructive analysis |
| New to Next.js | `neurolint assess-router .` | Complexity assessment |
| Manual memoization overload | `neurolint check-compiler .` | React Compiler opportunities |

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "No changes applied" but file was modified

**Symptom:** Output shows conflicting messages about fixes.

**Solution:**
```bash
# Check the actual file - if changes are present, it worked
git diff src/components/Button.tsx

# This is a reporting bug, not a functional bug
# The file is correctly modified
```

---

#### Issue: Changes not visible after running fix

**Symptom:** Ran fix command but nothing changed.

**Solution:**
```bash
# Use verbose mode to see what's happening
neurolint fix src/ --all-layers --verbose

# Check if files match include pattern
neurolint analyze src/ --verbose

# Verify file permissions
ls -la src/
```

---

#### Issue: Too many changes at once

**Symptom:** Overwhelming number of changes.

**Solution:**
```bash
# Apply layers incrementally
neurolint fix src/ --layers=1 --verbose    # Configuration
neurolint fix src/ --layers=2 --verbose    # Patterns
neurolint fix src/ --layers=3 --verbose    # Components

# Or use dry-run to preview
neurolint fix src/ --all-layers --dry-run --verbose
```

---

#### Issue: Need to undo changes

**Symptom:** Applied fixes but want to revert.

**Solution:**
```bash
# List available backups
neurolint backups list

# Restore specific backup
neurolint backups restore <backup-id> --yes

# Or use Git
git checkout -- src/
```

---

#### Issue: Command not found

**Symptom:** `neurolint: command not found`

**Solution:**
```bash
# Reinstall globally
npm install -g @neurolint/cli

# Verify installation
which neurolint
neurolint --version

# Check PATH
echo $PATH
```

---

#### Issue: "Module not found" errors

**Symptom:** Missing dependencies during execution.

**Solution:**
```bash
# Reinstall with all dependencies
npm install -g @neurolint/cli

# Clear npm cache
npm cache clean --force
npm install -g @neurolint/cli

# Use specific version
npm install -g @neurolint/cli@1.4.0
```

---

#### Issue: Slow performance on large codebase

**Symptom:** Analysis takes too long.

**Solution:**
```bash
# Use parallel processing
neurolint fix src/ --all-layers --parallel=8

# Exclude unnecessary directories
neurolint fix src/ --all-layers \
  --exclude="**/node_modules/**" \
  --exclude="**/dist/**" \
  --exclude="**/__tests__/**"

# Process specific directories
neurolint fix src/components/ --all-layers
neurolint fix src/pages/ --all-layers
```

---

#### Issue: React 19 migration warnings

**Symptom:** Warnings about PropTypes or legacy context.

**Solution:**
```bash
# These require manual migration
# PropTypes → TypeScript interfaces
# Legacy context → Context API

# Export migration report for tracking
neurolint migrate-react19 . --format=json --output=warnings.json

# Review warnings file
cat warnings.json | jq '.warnings'
```

---

#### Issue: Next.js 16 middleware not working

**Symptom:** Middleware renamed but not executing.

**Solution:**
```bash
# Verify proxy.ts exists
ls -la src/middleware/proxy.ts

# Check runtime export
grep "export const runtime" src/middleware/proxy.ts

# Should see: export const runtime = "nodejs"

# Verify Next.js 16 installed
npm list next
```

---

#### Issue: Backup system filling disk

**Symptom:** Too many backup files.

**Solution:**
```bash
# Clean old backups (older than 7 days)
neurolint clean --older-than=7

# Keep only latest 5 backups per file
neurolint clean --keep-latest=5

# Remove state files too
neurolint clean --states --older-than=30
```

---

### Error Reference Table

| Error Code | Message | Solution |
|------------|---------|----------|
| `ENOENT` | File not found | Check file path, use `ls` to verify |
| `EACCES` | Permission denied | Use `chmod +w <file>` or run with sudo |
| `ERR_PARSE` | AST parsing failed | File has syntax errors, fix manually first |
| `ERR_BACKUP` | Backup creation failed | Check disk space, verify write permissions |
| `ERR_LAYER` | Layer execution failed | Run with `--verbose` to see details |
| `ERR_VALIDATION` | Validation failed | Code transformation created invalid syntax |

---

### Debug Mode

```bash
# Maximum verbosity
neurolint fix src/ --all-layers --verbose

# Save output to file for analysis
neurolint fix src/ --all-layers --verbose 2>&1 | tee neurolint.log

# Check specific layer
neurolint patterns fix src/ --verbose
```

---

### Getting Help

```bash
# Show all commands
neurolint --help

# Show command-specific help
neurolint fix --help
neurolint migrate-react19 --help

# Check version
neurolint --version

# Verify configuration
neurolint health
neurolint init-config
```

---

## Release Notes

For complete version history and detailed release notes, see [CHANGELOG.md](./CHANGELOG.md).

### Latest Release

**Version 1.3.9** - Repository cleanup and launch preparation for Reddit and Product Hunt.

Key features:
- 7-layer progressive architecture
- React 19 migration support
- Next.js 15.5 optimization
- Hydration error detection and fixes
- Accessibility compliance (WCAG 2.1 AA)
- 297 passing tests
- Deterministic AST transformations

**Upcoming in 1.4.0:** Next.js 16 migration, React 19 dependency checker, Turbopack assistant, and more.

See [CHANGELOG.md](./CHANGELOG.md) for full details.

---

## Philosophy & Design Principles

**NeuroLint is NOT AI-powered.** It uses:
- **Deterministic rule-based transformations** - Same input always produces same output
- **AST (Abstract Syntax Tree) parsing** - Understands code structure deeply
- **Pattern recognition** - Identifies common anti-patterns
- **Precise, predictable fixes** - No hallucinations, no surprises

**No LLM hallucinations. No unpredictable rewrites. Just intelligent, rule-based code fixes.**

---

## The Orchestration Pattern: How NeuroLint Prevents Code Corruption

NeuroLint's **5-step fail-safe orchestration system** is the critical design pattern that guarantees no corrupted code reaches production.

### The Problem with AI Code Tools

AI-powered code tools can hallucinate invalid syntax:
- LLMs guess at transformations without understanding code structure
- No validation ensures the output is syntactically correct
- Developers waste time fixing AI-generated bugs
- Production deployments break due to invalid code

### NeuroLint's Solution: Orchestrated Validation

Every transformation follows this fail-safe pattern:

#### Stage 1: AST-First Transformation
```
Try AST (Abstract Syntax Tree) transformation first
↓
Precise structural understanding of your code
↓
Safe, context-aware modifications
```

**Why AST first?** AST parsing understands the semantic structure of your code, enabling precise transformations that preserve logic and prevent syntax errors.

#### Stage 2: Immediate Syntax Validation
```
Transformation complete
↓
Validate syntax and structure
↓
Check for breaking changes
```

**Every transformation is validated** before acceptance. This catches issues immediately.

#### Stage 3: Regex Fallback (If AST Fails)
```
If AST parsing or validation fails
↓
Fall back to regex-based transformation
```

**Smart fallback system** ensures transformations succeed even when AST parsing encounters unexpected code patterns.

#### Stage 4: Re-Validate Regex Transformation
```
Regex transformation complete
↓
Validate syntax and structure (same strict checks)
↓
No shortcuts — every transformation path must pass validation
```

**Mandatory second validation.** The regex fallback path goes through the exact same validation checks as the AST path. This ensures no corrupted code slips through.

#### Stage 5: Accept Only If Valid
```
Did transformation pass validation (AST or regex path)?
↓
YES → Apply changes to codebase
NO  → REVERT to last known good state (no changes applied)
```

**Zero tolerance for invalid code.** If validation fails at any step (after AST or after regex), changes are automatically reverted.

### Visual Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Original Code (Last Known Good State)                          │
│  ↓                                                               │
│  Attempt AST Transformation                                      │
│  ↓                                                               │
│  Syntax Validation ✓/✗                                           │
│  ├─ Valid ✓ → Accept changes                                    │
│  └─ Invalid ✗ → Try Regex Fallback                              │
│     ↓                                                            │
│     Regex Transformation                                         │
│     ↓                                                            │
│     Syntax Validation ✓/✗                                        │
│     ├─ Valid ✓ → Accept changes                                 │
│     └─ Invalid ✗ → REVERT to original (no changes applied)      │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Matters

**Guarantee:** NeuroLint will **never** produce invalid code. If a transformation cannot be validated, it's rejected.

**Contrast with AI tools:**
- AI tools: Generate code → Hope it works → Debug when it breaks
- NeuroLint: Transform → Validate → Accept only if valid

### Real-World Example

**Scenario:** Fixing React keys in a `.map()` loop with complex JSX

```tsx
// Before
{items.map(item => (
  <ComplexComponent 
    data={item}
    nested={<div>{item.value}</div>}
  />
))}
```

**NeuroLint's approach:**
1. **AST Transformation:** Parse JSX structure, identify map call, add key prop
2. **Validation:** Ensure JSX is still valid, braces match, no syntax errors
3. **Result:** Only accept if valid

```tsx
// After (validated)
{items.map((item, index) => (
  <ComplexComponent 
    key={item.id || index}
    data={item}
    nested={<div>{item.value}</div>}
  />
))}
```

**AI tool might produce:**
```tsx
// AI hallucination (invalid)
{items.map(item => (
  <ComplexComponent 
    key={item.id}  // Missing index fallback
    data={item
    nested={<div>{item.value}</div>}  // Missing closing brace
  />
))}
```

NeuroLint's orchestration pattern would **reject this transformation** because validation fails.

### Implementation in NeuroLint

All 7 layers use this orchestration pattern:
- **Layers 1-2:** Regex transformations (config files, simple patterns)
- **Layers 3-5:** AST-first with regex fallback (React components, SSR guards, Next.js optimizations)
- **Layers 6-7:** Hybrid approach (error boundaries, adaptive learning)

Every layer validates transformations before acceptance, ensuring your codebase remains stable.

---

## Support & Resources

- **npm Package:** [https://www.npmjs.com/package/@neurolint/cli](https://www.npmjs.com/package/@neurolint/cli)
- **GitHub Repository:** [https://github.com/Alcatecablee/Neurolint](https://github.com/Alcatecablee/Neurolint)
- **Issues & Bug Reports:** [https://github.com/Alcatecablee/Neurolint/issues](https://github.com/Alcatecablee/Neurolint/issues)
- **Contributing:** See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Code of Conduct:** See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

## Quick Start Checklist

New to NeuroLint? Follow this checklist:

- [ ] Install NeuroLint globally: `npm install -g @neurolint/cli`
- [ ] Verify installation: `neurolint --version`
- [ ] Analyze your project: `neurolint analyze .`
- [ ] Preview fixes: `neurolint fix . --all-layers --dry-run`
- [ ] Apply fixes: `neurolint fix . --all-layers`
- [ ] Review statistics: `neurolint stats .`
- [ ] Set up pre-commit hook (optional)
- [ ] Add to CI/CD pipeline (optional)
- [ ] Export team rules: `neurolint rules --export=team-rules.json`

---

**Built for developers who want deterministic, rule-based code quality - not AI-driven unpredictability.**

**Version 1.3.9** | Apache License 2.0 | Built for the React and Next.js community