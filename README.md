# NeuroLint CLI

> **Deterministic code transformation tool for React, Next.js, and TypeScript projects**

[![npm version](https://img.shields.io/npm/v/@neurolint/cli.svg)](https://www.npmjs.com/package/@neurolint/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-297%20passing-brightgreen.svg)](./__tests__)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)]()

**NeuroLint uses deterministic, rule-based transformations (NOT AI) to automatically fix 50+ code issues across 7 intelligent layers.**

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [What's New in v1.4.0](#whats-new-in-v140)
- [Quick Start](#quick-start)
- [What NeuroLint Fixes](#what-neurolint-fixes)
- [Migration Features](#migration-features)
- [Analysis Tools](#analysis-tools)
- [Usage Examples](#usage-examples)
- [Real-World Use Cases](#real-world-use-cases)
- [Command Reference](#command-reference)
- [Integration](#integration)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem

Modern React and Next.js development suffers from repetitive, time-consuming code quality issues:

- **Missing accessibility attributes** - Images without alt text, buttons without aria-labels
- **Hydration errors** - `window is not defined`, `localStorage` accessed during SSR
- **Outdated configurations** - TypeScript and Next.js configs causing build failures
- **Inconsistent patterns** - Team members using different coding styles
- **Manual migration overhead** - React 19 and Next.js 16 breaking changes
- **Dependency conflicts** - Package version incompatibilities

**The cost:** Hours of manual fixes, code review overhead, production bugs, and team frustration.

---

## The Solution

NeuroLint was created during development of [Taxfy.co.za](https://taxfy.co.za) when over **700 ESLint errors**, hydration bugs, and missing React keys appeared across the codebase. Instead of spending weeks on manual fixes, an intelligent multi-layer system was built that:

- Fixed **90% of issues automatically** using AST transformations
- Reduced error count from **700 to 70** in production
- Saved **hundreds of hours** of manual work
- Created **zero breaking changes** during fixes

### Key Differentiator: No AI

**NeuroLint uses deterministic, rule-based transformations—NOT artificial intelligence.**

- **AST Parsing** - Understands code structure through Abstract Syntax Trees
- **Pattern Recognition** - Identifies anti-patterns using predefined rules
- **Repeatable Results** - Same input always produces same output
- **No Hallucinations** - No LLM guessing or unpredictable rewrites
- **Auditable** - Every transformation is documented and traceable

**No AI black box. Just intelligent, rule-based code fixes.**

---

## What's New in v1.4.0

**Released:** November 21, 2025

### Next.js 16 Migration

Full support for Next.js 16 with comprehensive migration tooling:

- **Middleware Rename** - Automatic `middleware.ts` → `proxy.ts` migration
- **PPR to Cache Components** - Converts `experimental.ppr` to Cache Components
- **Async Request APIs** - Updates `cookies()` and `headers()` to use `await`
- **Async Params** - Converts `({ params })` → `async (props) => { const params = await props.params }`
- **Caching APIs** - Adds `'use cache'` directives and integrates `cacheLife`/`updateTag()`
- **Runtime Configuration** - Auto-adds `export const runtime = "nodejs"` to proxy files

### React 19 Dependency Checker

New `check-deps` command with intelligent dependency analysis:

- Scans `package.json` for React 19 incompatibilities
- Detects issues with Radix UI, Ant Design, next-auth, react-is
- Auto-generates `.npmrc` with `legacy-peer-deps` when needed
- Adds `overrides` to `package.json` for stubborn dependencies
- `--fix` flag for automatic resolution

### Turbopack Migration Assistant

New `check-turbopack` command for Webpack → Turbopack migration:

- Analyzes Webpack-specific configurations in `next.config.js`
- Identifies incompatible loaders and plugins
- Detects Babel configurations requiring SWC migration
- Recommends Turbopack filesystem caching for performance

### React Compiler Detector

New `check-compiler` command for optimization opportunities:

- Detects manual `useMemo`, `useCallback`, `React.memo` patterns
- Identifies `useRef` for previous value tracking
- Calculates potential bundle size savings
- Recommends React Compiler when 3+ opportunities found

### Router Complexity Assessor

New `assess-router` command for complexity analysis:

- Complexity scoring (0-100 scale)
- Detects App Router, Pages Router, middleware, API routes
- Identifies Server/Client Components and SSR/SSG usage
- Recommends optimal setup (plain React vs minimal/full Next.js)
- Provides simplification opportunities

### React 19.2 Feature Detector

New `detect-react192` command for modern React adoption:

- **View Transitions** - Finds manual animation code that could use View Transitions API
- **useEffectEvent** - Identifies `useEffect` callbacks that could benefit from `useEffectEvent`
- **Activity Components** - Detects `display: none` patterns that could use Activity components

### Testing & Quality

- **100+ new tests** added (297 total, all passing)
- Comprehensive coverage for all migration and analysis tools
- Integration tests with real-world fixtures
- Critical bug fixes in AST parsing and regex handling

---

## Quick Start

### Installation

```bash
# Install globally (recommended)
npm install -g @neurolint/cli

# Verify installation
neurolint --version

# Show available commands
neurolint --help
```

### First Analysis

```bash
# Analyze your project
neurolint analyze . --verbose

# Preview fixes without applying
neurolint fix . --all-layers --dry-run --verbose

# Apply fixes
neurolint fix . --all-layers --verbose
```

### Quick Example

**Before (Legacy React component):**

```tsx
// Button.tsx - Common issues
function Button({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}
```

**After (Modern, accessible component):**

```tsx
// Button.tsx - Fixed automatically
'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-label={typeof children === 'string' ? children : undefined}
      type="button"
    >
      {children}
    </button>
  );
}

export default Button;
```

**Fixes applied:**
- Added `'use client'` directive for App Router
- TypeScript interface for props
- `aria-label` for accessibility (WCAG 2.1 AA)
- `type="button"` to prevent form submission
- Default values for optional props
- Proper exports

---

## What NeuroLint Fixes

### Layer 1: Configuration Modernization

Updates TypeScript, Next.js, and package configurations to modern standards.

**Before:**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"]
  }
}
```

**After:**
```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

**What it fixes:**
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package.json optimization
- Modern ES module settings

---

### Layer 2: Pattern Standardization

Cleans up code patterns and removes deprecated syntax.

**Before:**
```tsx
const Component = () => {
  console.log('debug info');
  return <div>&quot;Hello&quot;</div>;
}
```

**After:**
```tsx
const Component = () => {
  return <div>"Hello"</div>;
}
```

**What it fixes:**
- HTML entity corruption (`&quot;`, `&#x27;`, `&amp;`)
- Unused imports cleanup
- Console.log removal
- React pattern standardization
- Deprecated syntax updates

---

### Layer 3: Accessibility & Components

Ensures WCAG 2.1 AA compliance and React best practices.

**Before:**
```tsx
<img src="/logo.png" />
<button onClick={handleClick}>Submit</button>
{items.map(item => <div>{item.name}</div>)}
```

**After:**
```tsx
<img src="/logo.png" alt="Company logo" />
<button 
  onClick={handleClick}
  aria-label="Submit form"
  type="submit"
>
  Submit
</button>
{items.map((item, index) => (
  <div key={item.id || index}>{item.name}</div>
))}
```

**What it fixes:**
- Missing React keys in `.map()` loops
- Button type attributes
- Missing aria-labels
- Image alt attributes
- Form field accessibility
- WCAG 2.1 AA compliance

---

### Layer 4: SSR/Hydration Safety

Protects against hydration errors and SSR crashes.

**Before:**
```tsx
const Component = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme'));
  return <div>{window.innerWidth}px</div>;
}
```

**After:**
```tsx
const Component = () => {
  const [theme, setTheme] = useState<string | null>(null);
  
  useEffect(() => {
    setTheme(localStorage.getItem('theme'));
  }, []);

  const [width, setWidth] = useState<number>(0);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  return <div>{width}px</div>;
}
```

**What it fixes:**
- localStorage without SSR guards
- window/document access protection
- Theme provider hydration mismatches
- Client-only component wrapping
- `useEffect` safety guards

---

### Layer 5: Next.js App Router Optimization

Optimizes for Next.js App Router and Server Components.

**Before:**
```tsx
import React from 'react';
import { useState } from 'react';

function ClientComponent() {
  return <div>Client content</div>;
}
```

**After:**
```tsx
'use client';

import { useState } from 'react';

function ClientComponent() {
  return <div>Client content</div>;
}
```

**What it fixes:**
- `'use client'` directive placement
- `'use server'` for Server Actions
- Server vs Client Component detection
- App Router optimizations
- Import deduplication

---

### Layer 6: Testing & Error Handling

Adds error boundaries and test infrastructure.

**Before:**
```tsx
function App() {
  return <MainComponent />;
}
```

**After:**
```tsx
import { ErrorBoundary } from './utils/errorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <MainComponent />
    </ErrorBoundary>
  );
}
```

**What it fixes:**
- Error boundary generation
- Test file scaffolding
- Missing test coverage detection
- Quality improvements

---

### Layer 7: Adaptive Pattern Learning

Learns from your codebase to enforce custom patterns.

**Before:**
```tsx
const useCustomHook = () => {
  const [state, setState] = useState();
  // Missing cleanup
  return [state, setState];
}
```

**After:**
```tsx
const useCustomHook = () => {
  const [state, setState] = useState();
  
  useEffect(() => {
    return () => {
      // Cleanup logic
    };
  }, []);
  
  return [state, setState];
}
```

**What it fixes:**
- Learns from your codebase patterns
- Custom rule generation
- Pattern recognition and application
- Project-specific conventions enforcement

---

## Migration Features

### React 19 Migration

Automates breaking changes from React 18 to React 19.

```bash
# Preview migration
neurolint migrate-react19 . --dry-run --verbose

# Apply migration
neurolint migrate-react19 . --verbose

# Update dependencies after migration
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19
```

**What it migrates:**

- **forwardRef Removal** - Converts to direct ref props
- **String Refs** - Migrates to callback refs
- **ReactDOM.render** - Converts to `createRoot`
- **ReactDOM.hydrate** - Converts to `hydrateRoot`
- **test-utils** - Moves `act` from `react-dom/test-utils` to `react`
- **Legacy Context** - Warns about `contextTypes` and `getChildContext`
- **PropTypes** - Provides TypeScript migration guidance

---

### Next.js 16 Migration

Automates breaking changes and new features in Next.js 16.

```bash
# Preview migration
neurolint migrate-nextjs-16 . --dry-run --verbose

# Apply migration
neurolint migrate-nextjs-16 . --verbose

# Update Next.js after migration
npm install next@16
```

**What it migrates:**

- **Middleware Rename** - `middleware.ts` → `proxy.ts` (preserves logic)
- **PPR to Cache Components** - Migrates `experimental.ppr` config
- **Async Params** - Updates route handlers: `({ params })` → `async (props) => await props.params`
- **Async Request APIs** - Adds `await` to `cookies()` and `headers()`
- **Function Async** - Ensures functions using `await` are marked `async`
- **Caching Directives** - Adds `'use cache'` to Server Components
- **Cache Management** - Integrates `cacheLife` and `updateTag()` APIs
- **Runtime Config** - Adds `export const runtime = "nodejs"` to proxy files

**Migration guarantees:**
- Zero functionality changes
- Preserves all middleware logic
- Type-safe transformations
- Full backward compatibility during migration

---

### Next.js 15.5 Migration

Modernizes Next.js 15.5 features and Biome integration.

```bash
# Apply all layers for comprehensive migration
neurolint fix . --all-layers --verbose

# Add stable Node runtime to middleware
neurolint fix middleware.ts --layers=5 --verbose

# Migrate to Biome (Next.js 15.5 recommendation)
neurolint migrate-biome . --verbose
```

**What it includes:**

- Type-safe routing with automatic interface generation
- Stable Node.js runtime for middleware
- Biome integration (ESLint alternative)
- Server Actions enhancement with error handling
- Metadata API modernization with stricter TypeScript
- Caching optimizations
- Turbopack configuration

---

### Biome Migration

Migrates from ESLint/Prettier to Biome.

```bash
# Preview migration
neurolint migrate-biome . --dry-run --verbose

# Apply migration
neurolint migrate-biome . --verbose
```

**What it does:**

- Updates `package.json` scripts (`next lint` → `biome check`)
- Generates `biome.json` configuration
- Removes ESLint and Prettier config files
- Updates CI/CD configurations
- Maps ESLint rules to Biome equivalents

---

## Analysis Tools

### Dependency Compatibility Checker

Checks React 19 dependency compatibility.

```bash
# Check dependencies
neurolint check-deps .

# Auto-fix incompatible dependencies
neurolint check-deps . --fix
```

**What it checks:**
- `react-is` version compatibility
- Radix UI package versions
- Ant Design compatibility
- next-auth issues
- Creates `.npmrc` with `legacy-peer-deps`
- Adds `overrides` to `package.json`

---

### Turbopack Migration Readiness

Analyzes Webpack → Turbopack migration readiness.

```bash
neurolint check-turbopack .
```

**What it analyzes:**
- Webpack-specific configurations
- Incompatible loaders and plugins
- Babel configurations
- Recommends SWC migration path
- Suggests Turbopack filesystem caching

---

### React Compiler Opportunities

Detects manual memoization patterns.

```bash
neurolint check-compiler .
```

**What it detects:**
- Manual `useMemo` patterns
- `useCallback` usage
- `React.memo` wrapping
- `useRef` for previous values
- Recommends React Compiler when 3+ opportunities found

---

### Router Complexity Assessment

Assesses Next.js router complexity and recommends optimal setup.

```bash
neurolint assess-router . --verbose
```

**What it provides:**
- Complexity score (0-100)
- Complexity level (Simple, Moderate, Complex, Enterprise)
- Feature detection (App/Pages Router, middleware, API routes)
- Server/Client Component identification
- Recommendations (plain React, minimal Next.js, full Next.js)

**Score interpretation:**
- **0-30 (Simple)** - Consider plain React
- **30-60 (Moderate)** - Minimal Next.js appropriate
- **60-80 (Complex)** - Full Next.js features justified
- **80+ (Enterprise)** - Complexity necessary

---

### React 19.2 Feature Detection

Identifies opportunities for React 19.2 features.

```bash
neurolint detect-react192 .
```

**What it finds:**
- **View Transitions** - Manual animations that could use View Transitions API
- **useEffectEvent** - `useEffect` callbacks that could use `useEffectEvent`
- **Activity Components** - `display: none` patterns that could use Activity components

---

### Project Simplification

Reduces project complexity for simpler use cases.

```bash
# Assess current complexity
neurolint assess . --verbose

# Convert to plain React SPA
neurolint simplify . --target=react --dry-run

# Simplify to minimal Next.js
neurolint simplify . --target=minimal-nextjs --dry-run

# Apply simplification
neurolint simplify . --target=react
```

**When to simplify:**
- Building simple SPAs or static sites
- No SSR/SSG requirements
- Team prefers simplicity
- Next.js overhead not justified

---

## Usage Examples

### Basic Codebase Modernization

```bash
# Analyze your entire project
neurolint analyze src/ --verbose

# Fix all issues automatically (all 7 layers)
neurolint fix src/ --all-layers --verbose

# Preview changes first (dry run)
neurolint fix src/ --all-layers --dry-run --verbose
```

### Targeted Fixes

```bash
# Fix only accessibility issues (Layer 3)
neurolint fix src/ --layers=3 --verbose

# Fix configuration and patterns (Layers 1 & 2)
neurolint fix src/ --layers=1,2 --verbose

# Fix SSR/hydration issues (Layers 4 & 5)
neurolint fix src/ --layers=4,5 --verbose

# Validate without making changes
neurolint validate src/
```

### Integration Examples

```bash
# Pre-commit hook
neurolint fix src/ --layers=2,3 --dry-run || exit 1

# CI/CD pipeline
neurolint analyze src/ --format=json --output=analysis.json
neurolint fix src/ --all-layers

# Team collaboration
neurolint rules --export=team-rules.json
neurolint rules --import=team-rules.json
```

---

## Real-World Use Cases

### 1. Legacy React Migration

**Scenario:** Upgrading from React 16 to React 18 with Next.js 13

```bash
neurolint fix src/ --layers=1,2,4,5 --verbose
```

**Result:** 200+ files updated, 0 breaking changes, 100% compatibility

---

### 2. Accessibility Compliance

**Scenario:** Meeting WCAG 2.1 AA standards for enterprise application

```bash
neurolint fix src/ --layers=3 --verbose
```

**Result:** 150+ accessibility issues fixed automatically, audit-ready codebase

---

### 3. Performance Optimization

**Scenario:** Reducing bundle size and improving Core Web Vitals

```bash
neurolint fix src/ --layers=1,5 --verbose
```

**Result:** 30% bundle size reduction, improved Lighthouse scores

---

### 4. Team Code Standardization

**Scenario:** Enforcing consistent patterns across 10+ developers

```bash
neurolint rules --import=company-standards.json
neurolint fix src/ --layers=7 --verbose
```

**Result:** Consistent codebase, 60% reduction in code review time

---

### 5. Complexity Reduction

**Scenario:** Next.js project too complex for simple landing page

```bash
# Assess complexity and get recommendations
neurolint assess ./src --verbose

# Convert to plain React when Next.js features aren't needed
neurolint simplify ./src --target=react
```

**Result:** 15 Next.js files → React components, 40% fewer dependencies

---

### 6. Next.js 15.5 Migration

**Scenario:** Upgrading from Next.js 13 to Next.js 15.5

```bash
# Fix entire project with all layers
neurolint fix ./src --all-layers --backup --verbose

# Add Node runtime to middleware (now stable)
neurolint fix middleware.ts --layers=5 --verbose

# Migrate to Biome (15.5 recommendation)
neurolint migrate-biome ./src --verbose
```

**Result:** 396 files processed, 31 files updated, 0 breaking changes

---

### 7. React 19 Upgrade

**Scenario:** Migrating production app from React 18 to React 19

```bash
# Check dependency compatibility
neurolint check-deps . --fix

# Preview React 19 migration
neurolint migrate-react19 . --dry-run --verbose

# Apply migration
neurolint migrate-react19 . --verbose

# Update dependencies
npm install react@19 react-dom@19
```

**Result:** All breaking changes handled automatically, smooth upgrade

---

### 8. Next.js 16 Upgrade

**Scenario:** Upgrading to Next.js 16 with new caching model

```bash
# Preview migration
neurolint migrate-nextjs-16 . --dry-run --verbose

# Apply migration
neurolint migrate-nextjs-16 . --verbose

# Update Next.js
npm install next@16
```

**Result:** Middleware renamed, PPR migrated, async APIs updated, caching modernized

---

## Command Reference

### Core Commands

```bash
neurolint analyze [path]        # Scan for issues and recommend fixes
neurolint fix [path]             # Apply automatic fixes
neurolint validate [path]        # Validate code without changes
neurolint layers                 # List all transformation layers
```

### Layer-Specific Commands

```bash
neurolint config scan|fix        # Layer 1: Configuration fixes
neurolint patterns scan|fix      # Layer 2: Pattern fixes
neurolint components scan|fix    # Layer 3: Component fixes
neurolint hydration scan|fix     # Layer 4: Hydration fixes
neurolint nextjs scan|fix        # Layer 5: Next.js fixes
neurolint testing scan|fix       # Layer 6: Testing fixes
neurolint adaptive scan|fix      # Layer 7: Adaptive learning
```

### Migration Commands

```bash
neurolint migrate-nextjs-16 [path]      # Migrate to Next.js 16
neurolint migrate-react19 [path]        # Migrate to React 19
neurolint migrate-nextjs-15.5 [path]    # Migrate to Next.js 15.5
neurolint migrate-biome [path]          # Migrate to Biome
neurolint fix-deprecations [path]       # Fix deprecations
```

### Analysis Commands (v1.4.0)

```bash
neurolint check-deps [path]             # Check React 19 dependencies
neurolint check-deps [path] --fix       # Auto-fix dependencies
neurolint check-turbopack [path]        # Check Turbopack readiness
neurolint check-compiler [path]         # Find React Compiler opportunities
neurolint assess-router [path]          # Assess router complexity
neurolint detect-react192 [path]        # Detect React 19.2 opportunities
neurolint assess [path]                 # Assess project complexity
neurolint simplify [path]               # Simplify project structure
```

### Utility Commands

```bash
neurolint stats                  # Project statistics and insights
neurolint rules                  # Manage learned patterns
neurolint backups                # Manage centralized backups
neurolint clean                  # Clean up old backups
neurolint init-config            # Generate configuration
neurolint init-tests [path]      # Generate test files
neurolint health                 # System health check
```

### Command Flags

```bash
--all-layers                     # Apply all 7 layers
--layers=1,2,3                   # Specify layers
--dry-run                        # Preview without applying
--verbose                        # Detailed output
--backup                         # Create backup (default)
--no-backup                      # Skip backup
--production                     # Production-grade backups
--format=json                    # JSON output
--output=file.json               # Save to file
--include="**/*.tsx"             # Include pattern
--exclude="**/*.test.*"          # Exclude pattern
--fix                            # Auto-fix (check-deps)
--target=react                   # Simplify target
```

---

## Integration

### GitHub Actions

`.github/workflows/neurolint.yml`:

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
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install NeuroLint
        run: npm install -g @neurolint/cli
      
      - name: Analyze codebase
        run: neurolint analyze src/ --format=json --output=analysis.json
      
      - name: Check dependencies
        run: neurolint check-deps . --format=json --output=deps.json
        continue-on-error: true
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: neurolint-reports
          path: |
            analysis.json
            deps.json
```

### GitLab CI

`.gitlab-ci.yml`:

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
```

### Pre-commit Hook (Husky)

```bash
# Install Husky
npm install -D husky
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "neurolint fix src/ --layers=2,3 --dry-run || exit 1"
```

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "analyze": "neurolint analyze src/ --verbose",
    "fix": "neurolint fix src/ --all-layers --verbose",
    "fix:dry": "neurolint fix src/ --all-layers --dry-run --verbose",
    "migrate:react19": "neurolint migrate-react19 . --dry-run --verbose",
    "migrate:nextjs16": "neurolint migrate-nextjs-16 . --dry-run --verbose",
    "check:deps": "neurolint check-deps .",
    "stats": "neurolint stats ."
  }
}
```

### VSCode Tasks

`.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "NeuroLint: Analyze",
      "type": "shell",
      "command": "neurolint analyze ${file} --verbose",
      "problemMatcher": []
    },
    {
      "label": "NeuroLint: Fix All",
      "type": "shell",
      "command": "neurolint fix ${file} --all-layers --verbose",
      "problemMatcher": []
    }
  ]
}
```

---

## Architecture

### Technology Stack

- **AST Parsing:** `@babel/parser`, `@babel/traverse`, `@babel/types`
- **Pattern Engine:** Custom rule-based engine (1,901 lines)
- **Safety:** Built-in backup system with automatic rollback
- **Testing:** Jest test suite (297 tests, all passing)
- **Node.js:** v18.0.0+ required
- **TypeScript:** 5.0+ support

### Project Structure

```
neurolint/
├── cli.js                    # Main CLI entry (4,731 lines)
├── fix-master.js             # Layer orchestrator (1,901 lines)
├── ast-transformer.js        # AST analysis (862 lines)
├── backup-manager.js         # Backup system
├── validator.js              # Code validation
├── scripts/                  # Layer implementations
│   ├── fix-layer-1-config.js
│   ├── fix-layer-2-patterns.js
│   ├── fix-layer-3-components.js
│   ├── fix-layer-4-hydration.js
│   ├── fix-layer-5-nextjs.js
│   ├── fix-layer-6-testing.js
│   ├── fix-layer-7-adaptive.js
│   ├── migrate-nextjs-16.js
│   ├── react19-dependency-checker.js
│   ├── turbopack-migration-assistant.js
│   ├── react-compiler-detector.js
│   ├── router-complexity-assessor.js
│   └── react192-feature-detector.js
├── shared-core/              # Utilities
└── __tests__/                # 297 automated tests
```

### Design Principles

1. **Determinism First** - Same input always produces same output
2. **Safety by Default** - Automatic backups, dry-run mode, validation
3. **Transparency** - Every transformation is documented and auditable
4. **Zero Configuration** - Works out of the box
5. **Progressive Enhancement** - Apply layers incrementally
6. **Community Driven** - Open source, MIT licensed

---

## Contributing

We welcome contributions from the community! NeuroLint is open source and community-driven.

### How to Contribute

1. **Fork the repository** - [github.com/Alcatecablee/Neurolint](https://github.com/Alcatecablee/Neurolint)
2. **Create a feature branch** - `git checkout -b feature/your-feature`
3. **Make your changes** - Follow our coding standards
4. **Write tests** - Ensure all tests pass
5. **Submit a pull request** - Describe your changes

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Alcatecablee/Neurolint.git
cd neurolint

# Install dependencies
npm install

# Run tests
npm test

# Test CLI locally
node cli.js --help
```

### Contribution Guidelines

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md)
- Write tests for new features
- Update documentation
- Keep commits focused and descriptive

### Areas for Contribution

- **New transformation rules** - Add rules for common code patterns
- **Framework support** - Extend to Vue, Svelte, Angular
- **Documentation** - Improve guides and examples
- **Testing** - Add more test coverage
- **Bug fixes** - Fix reported issues

---

## Documentation

- **[CLI Usage Guide](./CLI_USAGE.md)** - Complete command reference
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards

---

## Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/Alcatecablee/Neurolint/issues)
- **Discussions:** [Ask questions and share ideas](https://github.com/Alcatecablee/Neurolint/discussions)
- **NPM Package:** [@neurolint/cli](https://www.npmjs.com/package/@neurolint/cli)

---

## Why Open Source?

NeuroLint is open source because:

- **Transparency** - See exactly what transformations are applied
- **Trust** - No hidden behavior, telemetry, or data collection
- **Community** - Better rules through collaborative development
- **Innovation** - Faster evolution with contributions
- **No AI Black Box** - Deterministic, auditable transformations
- **Free Forever** - No paywalls, authentication, or usage limits

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2025 NeuroLint Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Acknowledgments

- **Origin:** Built for [Taxfy.co.za](https://taxfy.co.za) to solve real-world code quality challenges
- **Inspiration:** Frustration with 700+ ESLint errors and manual migration overhead
- **Community:** Thanks to all contributors and early adopters

---

## Key Features Summary

- **50+ automatic code fixes** across 7 intelligent layers
- **Deterministic transformations** - no AI, no surprises
- **297 passing tests** - enterprise-grade reliability
- **Built-in backup system** - safe, reversible changes
- **Zero configuration** - works out of the box
- **100% free and open source** - no authentication required
- **Battle-tested** - reduced 700+ errors to 70 in production
- **Active development** - regular updates and new features

---

**Built for the React and Next.js community**

**NeuroLint: Deterministic code transformation. No AI. No surprises. Completely free.**

**[Get Started](https://www.npmjs.com/package/@neurolint/cli) | [View on GitHub](https://github.com/Alcatecablee/Neurolint) | [Read the Docs](./CLI_USAGE.md)**
