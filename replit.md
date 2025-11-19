# NeuroLint CLI - Test Repository

## What This Repository Is

This is a **test/experimental repository** for the NeuroLint CLI project. The files here were copied from the main NeuroLint CLI repository to explore building a web dashboard called "Fixwise" - but that dashboard **does not currently exist** in this codebase.

## Project Status

### ✅ What EXISTS in this repo:
- `cli.js` - Main CLI entry point (copied from main repo)
- `scripts/` - 7 fix layer implementations (copied from main repo)
- `fix-master.js` - Layer orchestrator (copied from main repo)
- Supporting files: `ast-transformer.js`, `backup-manager.js`, `validator.js`, `selector.js`
- `shared-core/` - Analytics, config, rule engine modules
- `__tests__/` - Jest test suite with 68 automated tests:
  - CLI command tests (18 tests)
  - AST transformer tests (16 tests)
  - Backup manager tests (17 tests)
  - Validator tests (17 tests)
  - Test fixtures for integration testing
- `jest.config.js` - Jest configuration for testing

### ❌ What DOES NOT EXIST:
- ❌ No `server/` directory (despite package.json expecting it)
- ❌ No `client/src/` React frontend (only 2 backup hook files)
- ❌ No `shared/schema.ts` for database models
- ❌ No Express backend
- ❌ No WebSocket implementation
- ❌ No Fixwise web dashboard

### The Real Product

The **actual working product** is the npm package:
- **Package:** `@neurolint/cli` (published on npm)
- **Version:** 1.3.3
- **Status:** Published and available
- **Install:** `npm install -g @neurolint/cli`
- **Repo:** This is NOT the main NeuroLint repo

## Origin Story

NeuroLint was born from frustration during development of Taxfy.co.za when over 700 ESLint errors, hydration bugs, and missing React keys appeared. Instead of manual fixes, an intelligent multi-layer fixing system was created that reduced 600+ issues down to just 70.

## The 7-Layer Architecture

The layer system is **progressive and safe** - each layer builds upon the previous ones:

### All Layers Are Now Free! (No Authentication Required)
1. **Layer 1 - Configuration:** tsconfig.json, next.config.js, package.json optimization
2. **Layer 2 - Patterns:** HTML entities, console.log removal, unused imports
3. **Layer 3 - Components:** React keys, accessibility, prop types
4. **Layer 4 - Hydration:** SSR/hydration guards for localStorage, window, document
5. **Layer 5 - Next.js:** App Router optimizations, "use client" directives
6. **Layer 6 - Testing:** Error boundaries, test generation, quality improvements
7. **Layer 7 - Adaptive:** Pattern learning and custom rule generation

**NOTE:** All authentication and paygate logic has been removed. The CLI is now completely free to use with all layers available without any API key.

## How It Actually Works

**Technology:**
- Rule-based transformations (NOT AI/LLM)
- AST (Abstract Syntax Tree) parsing
- Pattern recognition
- Deterministic, predictable fixes

**Philosophy:**
No LLM hallucinations. No unpredictable rewrites. Just intelligent, rule-based code fixes.

## Current Repo Purpose

This repository was created to:
1. Experiment with building a web dashboard for NeuroLint
2. Test integration ideas
3. Explore Fixwise branding

**Status:** Planning/experimental stage. Dashboard not yet built.

## Recent Changes

**November 19, 2025**: 
- Removed all authentication and paygate logic from the CLI. All 7 layers are now completely free and available without any API key or authentication.
- Set up comprehensive automated testing with Jest:
  - **68 tests total**, all passing
  - CLI tests with exact exit code assertions (0 for success, 1 for errors)
  - Integration tests with real fixtures (sample.js, complex-component.jsx)
  - Error handling tests with specific error message validation
  - Backup manager tests including error scenarios
  - AST transformer and validator comprehensive test coverage

## User Preferences

Preferred communication style: Simple, everyday language.

## If You Want to Use NeuroLint

**Don't use this repo.** Instead:

```bash
# Install the published CLI
npm install -g @neurolint/cli

# Analyze your project
neurolint analyze src/

# Fix all issues with all layers (completely free!)
neurolint fix src/ --all-layers --verbose

# No authentication needed - all layers are free!
```

## Documentation

See `CLI_USAGE.md` for complete usage guide including:
- What's free vs paid
- Authentication requirements
- Layer capabilities
- Real-world examples
- Troubleshooting

## Next Steps for This Repo

**Possible Directions:**
1. **Build the Fixwise Dashboard** - Create the full-stack Express + React app described in old docs
2. **Focus on CLI Improvements** - Abandon dashboard idea, improve CLI only
3. **Archive This Repo** - Keep development in main NeuroLint repository

**Decision needed:** What should this repo become?

---

**The working product is `@neurolint/cli` on npm. This repo is experimental.**
