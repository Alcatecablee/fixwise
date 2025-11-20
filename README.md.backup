# NeuroLint CLI

> Deterministic code analysis and transformation tool for TypeScript, JavaScript, React, and Next.js projects.

[![npm version](https://img.shields.io/npm/v/@neurolint/cli.svg)](https://www.npmjs.com/package/@neurolint/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-170%20passing-brightgreen.svg)](./__tests__)

**NeuroLint uses rule-based intelligence (NOT AI) to automatically detect and fix 50+ common code issues across 7 layers.**

---

## 🎯 The Problem

Modern React/Next.js development is plagued with repetitive code issues:
- ❌ Missing accessibility attributes
- ❌ Hydration errors (`window is not defined`)
- ❌ Outdated TypeScript/Next.js configurations
- ❌ Inconsistent patterns across teams
- ❌ Manual fixes that are time-consuming and error-prone

## ✅ The Solution

NeuroLint was born from frustration during development of [Taxfy.co.za](https://taxfy.co.za) when over **700 ESLint errors**, hydration bugs, and missing React keys appeared. Instead of manual fixes, an intelligent multi-layer system was created that reduced **600+ issues down to just 70** automatically.

**Key differentiator:** NeuroLint uses **deterministic, rule-based transformations** (NOT AI). No LLM hallucinations, no unpredictable rewrites—just precise, repeatable code fixes using AST parsing.

---

## 🆓 All 7 Layers Are Free!

**No authentication. No API keys. Completely free and open source.**

---

## 🆕 New in v1.4.0

- **Biome migration**: Handles missing package.json (creates minimal file or reports clearly)
- **Middleware runtime**: Auto-adds `export const runtime = "nodejs"` to middleware files that need it
- **React 19 migration docs** + Next.js 15.5 feature guide
- **Added tests** for Biome migration and middleware runtime detection
- **Improved troubleshooting** and command help

---

## 🚀 Quick Demo

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
    >
      {children}
    </button>
  );
}

export default Button;
```

---

## 📦 Installation

```bash
npm install -g @neurolint/cli
neurolint --help
```

---

## 💡 What NeuroLint Fixes

### Layer 1: Configuration Modernization

**Problem:** Outdated TypeScript and Next.js configs causing build issues

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

**Fixes:**
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package.json optimization
- Modern ES module settings

---

### Layer 2: Pattern Standardization

**Problem:** Inconsistent patterns and deprecated syntax

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

**Fixes:**
- HTML entity corruption (`&quot;`, `&#x27;`, `&amp;`)
- Unused imports cleanup
- Console.log removal
- React pattern standardization
- Deprecated syntax updates

---

### Layer 3: Accessibility & Components

**Problem:** Missing accessibility attributes and component best practices

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
{items.map((item, index) => <div key={item.id || index}>{item.name}</div>)}
```

**Fixes:**
- Missing React keys in .map()
- Button variant props
- Missing aria-labels
- Image alt attributes
- Form field structure
- WCAG 2.1 compliance

---

### Layer 4: SSR/Hydration Safety

**Problem:** Client-side APIs causing hydration errors

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

**Fixes:**
- localStorage without SSR guards
- window/document access protection
- Theme provider hydration mismatches
- Client-only component wrapping
- `useEffect` safety guards

---

### Layer 5: Next.js App Router Optimization

**Problem:** Missing directives and inefficient imports

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

**Fixes:**
- "use client" directive placement
- "use server" for Server Actions
- Server vs client component detection
- App Router optimizations
- Import deduplication

---

### Layer 6: Testing & Error Handling

**Problem:** Missing error boundaries and test infrastructure

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

**Fixes:**
- Error boundary generation
- Test file scaffolding
- Missing test coverage detection
- Quality improvements

---

### Layer 7: Adaptive Pattern Learning

**Problem:** Custom patterns that need intelligent detection

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

**Fixes:**
- Learns from your codebase
- Custom rule generation
- Pattern recognition and application
- Project-specific conventions

---

## 🔄 Migration Features

### React 19 & Next.js 15.5 Migration

**Problem:** Upgrading to React 19 and Next.js 15.5 requires comprehensive codebase updates

```bash
# Migrate your project to React 19 compatibility
neurolint migrate-react19 ./src --dry-run --verbose

# Migrate your project to Next.js 15.5 compatibility
neurolint migrate-nextjs-15.5 ./src --dry-run --verbose

# Migrate from ESLint to Biome (Next.js 15.5 recommendation)
neurolint migrate-biome ./src --dry-run --verbose

# Traditional layer-based migration for all layers
neurolint fix ./src --all-layers --dry-run --verbose
```

#### React 19 Features:

- **forwardRef Removal**: Converts to direct ref prop automatically
- **String Refs Migration**: Migrates to ref callbacks with class/function detection
- **PropTypes Removal**: Detects usage and provides TypeScript migration guidance
- **ReactDOM.render Conversion**: Converts to createRoot with proper import management
- **Legacy Context Detection**: Warns about contextTypes and getChildContext removal

#### Next.js 15.5 Features:

- **Type Safe Routing**: Enhanced routing with automatic type generation
- **Node Runtime on Middleware**: Automatically adds stable runtime configuration (no longer experimental)
- **Biome Integration**: Official support for Biome as ESLint alternative
- **next lint Deprecation**: Detects and migrates away from deprecated next lint
- **Server Actions Enhancement**: Automatic error handling and validation
- **Metadata API Modernization**: Stricter TypeScript typing for generateMetadata
- **Caching Optimization**: Smart suggestions for cache: 'force-cache'
- **Turbopack Integration**: Automatic configuration for Next.js 15+

---

## 📊 Complexity Management for Small Projects

**Problem:** Next.js complexity concerns for small projects - as discussed in [r/nextjs](https://www.reddit.com/r/nextjs/)

```bash
# Assess your project's complexity level
neurolint assess ./src --verbose

# Convert Next.js project to plain React for simplicity
neurolint simplify ./src --target=react --dry-run

# Remove unnecessary Next.js features while keeping framework
neurolint simplify ./src --target=minimal-nextjs --dry-run

# Apply simplification changes (remove --dry-run to apply)
neurolint simplify ./src --target=react
```

### Complexity Assessment Features:

- **Complexity Scoring**: 0-100 scale with simple/moderate/complex/enterprise levels
- **Feature Usage Analysis**: Detects App Router, Middleware, API Routes, Server Components
- **Unnecessary Feature Detection**: Identifies unused middleware, API routes for static sites
- **Simplification Opportunities**: Converts to SPA when SSR isn't needed
- **Alternative Recommendations**: Suggests when plain React would be sufficient

### When to Use What

**Use Plain React When:**
- Building simple SPAs or static sites
- No SSR/SSG requirements
- Team prefers simplicity over features
- Learning React fundamentals

```bash
# Convert your Next.js project to plain React
neurolint assess ./src --verbose          # Analyze current complexity
neurolint simplify ./src --target=react   # Convert to React SPA
```

**Use Minimal Next.js When:**
- Need basic routing and build optimization
- Want to keep upgrade path for future features
- Team is comfortable with Next.js

```bash
# Remove unnecessary complexity while keeping Next.js
neurolint simplify ./src --target=minimal-nextjs --dry-run
```

**Keep Full Next.js When:**
- Using SSR, SSG, or API routes
- Building production applications
- Need advanced performance optimizations

```bash
# Just clean up and modernize existing setup
neurolint fix ./src --layers=1,2,5 --dry-run
```

### Complexity Assessment Tool

The `neurolint assess` command provides objective complexity scoring:

- **Score 0-30 (Simple)**: Consider plain React for maximum simplicity
- **Score 30-60 (Moderate)**: Next.js minimal setup is appropriate
- **Score 60-80 (Complex)**: Full Next.js features justified
- **Score 80+ (Enterprise)**: Complexity is necessary for requirements

---

## 📖 Usage Examples

### Basic Codebase Modernization

```bash
# Analyze your entire project
neurolint analyze src/

# Fix all issues automatically (all 7 layers - FREE!)
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

## 🏆 Real-World Use Cases

### 1. Legacy React Migration
**Scenario:** Upgrading from React 16 to React 18 with Next.js 13

```bash
neurolint fix src/ --layers=1,2,4,5 --verbose
```

**Result:** 200+ files updated, 0 breaking changes, 100% compatibility

---

### 2. Accessibility Compliance
**Scenario:** Meeting WCAG 2.1 AA standards

```bash
neurolint fix src/ --layers=3 --verbose
```

**Result:** 150+ accessibility issues fixed automatically

---

### 3. Performance Optimization
**Scenario:** Reducing bundle size and improving Core Web Vitals

```bash
neurolint fix src/ --layers=1,5 --verbose
```

**Result:** 30% bundle size reduction, improved LCP scores

---

### 4. Team Code Standardization
**Scenario:** Enforcing consistent patterns across 10+ developers

```bash
neurolint rules --import=company-standards.json
neurolint fix src/ --layers=7 --verbose
```

**Result:** Consistent codebase, reduced code review time by 60%

---

### 5. Complexity Reduction for Small Projects
**Scenario:** Next.js project that's too complex for a simple landing page

```bash
# Assess complexity and get recommendations
neurolint assess ./src --verbose

# Convert to plain React when Next.js features aren't needed
neurolint simplify ./src --target=react
```

**Result:** 15 Next.js files converted to React components, 40% reduction in dependencies, simpler development workflow

---

### 6. Next.js 15.5 Migration
**Scenario:** Upgrading from Next.js 13 to Next.js 15.5

```bash
# Fix entire project with all layers
neurolint fix ./src --all-layers --backup --verbose

# Add Node runtime to middleware (now stable in 15.5)
neurolint fix middleware.ts --layers=5 --verbose

# Migrate from ESLint to Biome (15.5 recommendation)
neurolint migrate-biome ./src --verbose
```

**Result:** 396 files processed, 31 files updated, 0 breaking changes, full Next.js 15.5 compatibility with Biome integration

---

## 🛠️ Commands Reference

### Core Commands

```bash
neurolint analyze [path]        # Scan for issues and recommend fixes
neurolint fix [path]             # Apply automatic fixes
neurolint validate [path]        # Validate code without changes
neurolint layers                 # List all available transformation layers
```

### Layer-Specific Commands

```bash
neurolint config scan|fix        # Layer 1: Configuration fixes
neurolint patterns scan|fix      # Layer 2: Pattern fixes
neurolint components scan|fix    # Layer 3: Component fixes
neurolint hydration scan|fix     # Layer 4: Hydration fixes
neurolint nextjs scan|fix        # Layer 5: Next.js fixes
neurolint testing scan|fix       # Layer 6: Testing fixes
neurolint adaptive scan|fix      # Layer 7: Adaptive pattern learning
```

### Advanced Commands

```bash
neurolint rules                  # Manage learned patterns and rules
neurolint stats                  # Get project statistics and insights
neurolint clean                  # Clean up old backup and state files
neurolint backups                # Manage centralized backups
neurolint init-config            # Generate or display configuration
neurolint init-tests [path]      # Generate test files for components
neurolint health                 # Run a health check to verify configuration
```

### Migration Commands

```bash
neurolint migrate-react19 [path]        # Migrate to React 19 compatibility
neurolint migrate-nextjs-15.5 [path]    # Migrate to Next.js 15.5 compatibility
neurolint migrate-biome [path]          # Migrate from ESLint to Biome
neurolint fix-deprecations [path]       # Fix Next.js 15.5 deprecations
neurolint assess [path]                 # Assess project complexity
neurolint simplify [path]               # Simplify project (convert to React/minimal Next.js)
```

### Flags & Options

```bash
--all-layers                     # Apply all 7 layers (FREE!)
--layers=1,2,3                   # Specify which layers to apply
--dry-run                        # Preview changes without applying
--verbose                        # Show detailed output
--backup                         # Create backup before changes
--format=json                    # Output in JSON format
--output=file.json               # Save output to file
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue:** Changes not visible after running fix
```bash
# Solution: Use --verbose to see what's happening
neurolint fix src/ --all-layers --verbose
```

**Issue:** Too many changes at once
```bash
# Solution: Apply layers incrementally
neurolint fix src/ --layers=1,2 --verbose
neurolint fix src/ --layers=3,4 --verbose
```

**Issue:** Need to undo changes
```bash
# Solution: Use the backup system
neurolint backups list
neurolint backups restore [backup-id]
```

### Getting Help

```bash
neurolint --help              # Show all commands
neurolint layers --verbose    # Show layer details
neurolint health              # Check system status
```

---

## 💻 Tech Stack

- **AST Parsing:** `@babel/parser`, `@babel/traverse`, `@babel/types`
- **Pattern Matching:** Custom rule engine (1,901 lines)
- **Safety:** Built-in backup system with automatic rollback
- **Testing:** Comprehensive Jest test suite (170 tests, all passing)

### Architecture

```
cli.js (4,731 lines)           → Main CLI entry point
fix-master.js (1,901 lines)    → Layer orchestrator
ast-transformer.js (862 lines) → AST-based code analysis
backup-manager.js              → Safe backup system
validator.js                   → Code validation
scripts/                       → 7 layer implementations
shared-core/                   → Core utilities
__tests__/                     → 170 automated tests
```

---

## 📚 Documentation

- **[CLI Usage Guide](./CLI_USAGE.md)** - Complete command reference
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards

---

## 🤝 Contributing

We welcome contributions! NeuroLint is open source and community-driven.

- **Found a bug?** [Open an issue](https://github.com/Alcatecablee/Neurolint/issues)
- **Want to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Have questions?** Start a discussion

See our [Code of Conduct](./CODE_OF_CONDUCT.md) for community guidelines.

---

## 🌟 Why Open Source?

NeuroLint is open source because:
- **Transparency:** See exactly what transformations are applied
- **Trust:** No hidden behavior, telemetry, or data collection
- **Community:** Better rules through collaborative development
- **Innovation:** Faster evolution with contributions
- **No AI Black Box:** Deterministic, auditable transformations

---

## 🔗 Links

- **NPM Package:** [@neurolint/cli](https://www.npmjs.com/package/@neurolint/cli)
- **GitHub Repository:** [Alcatecablee/Neurolint](https://github.com/Alcatecablee/Neurolint)
- **Issues:** [GitHub Issues](https://github.com/Alcatecablee/Neurolint/issues)
- **Origin Story:** Built for [Taxfy.co.za](https://taxfy.co.za)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🎯 Key Features Summary

✅ **50+ automatic code fixes** across 7 intelligent layers  
✅ **Deterministic transformations** - no AI, no surprises  
✅ **170 passing tests** - enterprise-grade reliability  
✅ **Built-in backup system** - safe, reversible changes  
✅ **Zero configuration** - works out of the box  
✅ **100% free and open source** - no authentication required  
✅ **Battle-tested** - reduced 700+ errors to 70 in production  

---

**Built with ❤️ for the React and Next.js community**

**NeuroLint: Deterministic code fixing. No AI. No surprises. Completely free.**
