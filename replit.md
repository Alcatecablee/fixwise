# NeuroLint CLI - Open Source Repository

## What This Repository Is

This is the **official open source repository** for NeuroLint CLI - a deterministic, rule-based code transformation tool for TypeScript, JavaScript, React, and Next.js projects. This repository is now prepared for public release and Y Combinator application.

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

**November 19, 2025 - Open Source Release Preparation:**
- **Made repository fully open source with all standard files:**
  - ✅ LICENSE - MIT License (was declared in package.json but file didn't exist)
  - ✅ README.md - Comprehensive rewrite with detailed examples, use cases, troubleshooting, and command reference (matches npm version quality while removing auth)
  - ✅ CONTRIBUTING.md - Comprehensive contribution guidelines with accurate project structure
  - ✅ CODE_OF_CONDUCT.md - Standard Contributor Covenant v2.0
  - ✅ package.json - Updated with correct GitHub repository URLs (https://github.com/Alcatecablee/Neurolint)
  - ✅ All files reviewed and approved by architect agent for YC readiness and publication
- **Built conversion-focused landing page** at https://neurolint.dev/ to replace current site
  - Problem-first messaging (hydration crashes, missing keys, React 19 migration, etc.)
  - Before/after code examples showing real transformations
  - 6 problem-focused sections instead of "7 layers" feature list
  - Social proof, FAQ, and clear CTAs throughout
  - Built with Vite 4 + React + Tailwind in `landing/` directory
  - Running on port 5000 with workflow "Landing Page"
  - Fixed React JSX parsing issue: Escaped curly braces in text content (key={item.id} → key=&#123;item.id&#125;)
- Removed all authentication and paygate logic from the CLI. All 7 layers are now completely free and available without any API key or authentication.
- Set up comprehensive automated testing with Jest:
  - **170 tests total**, all passing (expanded from initial 68 tests)
  - CLI tests with exact exit code assertions (0 for success, 1 for errors)
  - Integration tests with real fixtures (sample.js, complex-component.jsx)
  - Error handling tests with specific error message validation
  - Backup manager tests including error scenarios
  - AST transformer and validator comprehensive test coverage
  - Performance tests for large codebases

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

## Repository Status

**This is the official open source NeuroLint CLI repository.**

**GitHub:** https://github.com/Alcatecablee/Neurolint

**Ready for:**
- ✅ Public contributions
- ✅ Y Combinator application
- ✅ npm publishing (as @neurolint/cli)
- ✅ Community engagement

**Next Steps:**
1. Push all changes to GitHub
2. Tag release v1.0.0
3. Announce open source status
4. Continue development with community contributions

---

**NeuroLint: Deterministic code fixing. No AI. No surprises. Completely free.**
