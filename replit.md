# NeuroLint CLI

## Overview

NeuroLint CLI is a deterministic, rule-based code transformation tool designed for TypeScript, JavaScript, React, and Next.js projects. It automates fixing common code issues such as ESLint errors, hydration bugs, and missing React keys through a progressive 7-layer architecture. Originally developed to address widespread code quality issues, NeuroLint aims to provide intelligent, predictable code fixes without relying on AI/LLM for stability and reliability. The project is positioned for public release, Y Combinator application, and aims to be the go-to solution for maintaining high code quality in modern web development. All its powerful fixing layers are now completely free to use, fostering community adoption and enterprise opportunities under the Apache License 2.0.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

NeuroLint employs a 7-layer progressive and safe architecture for code transformation, where each layer builds upon the previous one. This architecture ensures deterministic, predictable fixes through rule-based transformations, Abstract Syntax Tree (AST) parsing, and pattern recognition. The CLI is built with `cli.js` as the main entry point, `fix-master.js` orchestrating the fix layers, and supporting modules like `ast-transformer.js`, `backup-manager.js`, `validator.js`, and `selector.js`. Core functionalities like analytics, configuration management, and the rule engine are housed in `shared-core/`. The system is extensively tested with a comprehensive Jest test suite covering CLI commands, AST transformations, backup management, and various migration tools.

The landing page is a static React + Vite application that showcases NeuroLint's capabilities with an interactive demo using pre-defined scenarios, professional video player-style CLI demonstration (enhanced GIF with controls overlay), and comprehensive documentation of all 7 layers.

**Key Features & Implementations:**

- **7-Layer Fixing System:**
    1.  **Configuration:** Optimizes `tsconfig.json`, `next.config.js`, `package.json`.
    2.  **Patterns (Production-Ready, Orchestration-Compliant):** 
        - AST-first transformation strategy with validated regex fallback
        - Handles HTML entities in string literals
        - AST-based console.log/alert/confirm/prompt removal with context-aware replacements
        - Detects arrow function contexts using Babel path ancestry
        - Preserves NeuroLint comments in all transformation contexts (100% comment coverage)
        - Expression-bodied arrows: `() => {} /* [NeuroLint] comment */`
        - Block-bodied arrows & standalone: EmptyStatement with leading comments
        - Unused import removal
        - Syntax validation prevents invalid output from reaching production
        - Regex fallback for pattern transformations when AST parsing fails
    3.  **Components (Production-Ready, All Edge Cases Validated):** 
        - AST-first transformation strategy with validated regex fallback
        - Handles ALL parameter patterns: default params `(item = {})`, empty callbacks `()`, destructuring `({ id })`, nested destructuring `({ data: { id } })`, multiple defaults `(item = {}, idx = 0)`
        - Supports both paired tags `<Tag>...</Tag>` and self-closing tags `<Tag />`
        - Syntax validation prevents invalid output from reaching production
        - Comprehensive test coverage with 10/10 edge case validation
        - Addresses React keys, accessibility, prop types
    4.  **Hydration (Production-Ready, Orchestration-Compliant):** 
        - AST-first transformation strategy with validated regex fallback
        - Implements SSR/hydration guards for global objects (`localStorage`, `window`, `document`)
        - Syntax validation prevents invalid output from reaching production
        - Regex fallback for hydration guards when AST parsing fails
        - Automatic event listener cleanup in useEffect hooks
    5.  **Next.js (Production-Ready):** 
        - Detects React hooks (including aliased/destructured imports like `const { useState: useCount } = React` and namespace calls like `React.useEffect()`)
        - Adds `"use client"` directive when hooks detected
        - Converts `ReactDOM.render()` → `createRoot().render()`
        - Converts `ReactDOM.hydrate()` → `hydrateRoot()` with correct parameter order
        - Uses AST-based import management with deduplication for `react-dom/client` imports
        - Includes smart SSR guard detection (`isAlreadySSRGuarded()` helper)
        - All transformations preserve existing AST mutations through proper AST reuse
    6.  **Testing:** Enhances testing with error boundaries and test generation.
    7.  **Adaptive:** Supports pattern learning and custom rule generation.
- **Next.js 16 Migration Tools:** Includes auto-conversion for directives like `'use cache'`, async parameter conversion, `await` for `cookies()`/`headers()`, smart `cacheLife` integration, and `updateTag()` suggestions.
- **React 19 Compatibility Tools:** Features a dependency checker that scans `package.json` for incompatibilities, provides automated fixes, and suggests `package.json` overrides.
- **Turbopack Migration Assistant:** Detects Webpack-specific configurations, identifies incompatibilities, and suggests SWC migration.
- **React Compiler Detector:** Identifies manual memoization patterns and recommends React Compiler for optimization.
- **Router Complexity Assessor:** Analyzes route complexity and provides recommendations for architecture choices.
- **React 19.2 Feature Detector:** Identifies opportunities for `View Transitions`, `useEffectEvent`, and `Activity components`.
- **UI/UX Decisions:** CLI output is designed for professional environments, replacing emojis with bracketed status indicators like `[SUCCESS]`, `[FAILED]`, etc.
- **Testing:** Comprehensive Jest test suite covers all CLI functionalities, AST transformations, backup management, and specific migration tools, ensuring high code quality and reliability.

## External Dependencies

- **npm:** The `@neurolint/cli` package is published and distributed via npm.
- **Jest:** Used for comprehensive automated testing.
- **React, Next.js, TypeScript, JavaScript:** Target technologies for code transformation and analysis.
- **Apache License 2.0:** The project's open-source licensing model, enabling maximum adoption, enterprise use, commercial use, and community contributions without restrictions.

## Recent Changes (November 25, 2025)

- Added community CTAs to CLI for GitHub star prompts, documentation links, and issue reporting
- CTAs appear in: --help output (footer), --version output, after successful operations, and on first-run
- CTAs are suppressed with --quiet/-q flag
- Centralized CTA helper function with context-aware messaging

## Previous Changes (November 24, 2025)

- Added separate Quick Start page with React Router for multi-page navigation
- Created `/quick-start` route with standalone page layout and navigation
- Quick Start page based on CLI_TEST_COMMANDS.md, simplified for non-technical users
- Includes Windows and Mac command examples with copy-to-clipboard functionality
- Organized into sections: Installation, Check Code (Safe), Preview Changes, Fix Code, Backup Management
- Navigation updated: replaced "Features" link with "Quick Start" link to separate page
- Enhanced CLI demo section with professional video player-style interface
- Terminal-themed wrapper with macOS-style window controls
- Interactive hover controls overlay (play/pause, progress bar, speed control, fullscreen)
- Feature indicators showing Interactive Player, Pause & Resume, Speed Control, and Fullscreen Mode
- Polished visual presentation with gradient effects and subtle glow on hover
- Helper text guiding users on how to interact with the demo
- Removed asciinema-player integration (compatibility issues with .cast file format)