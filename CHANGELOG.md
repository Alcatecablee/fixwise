# Changelog

All notable changes to NeuroLint CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **License migrated from Business Source License 1.1 to Apache License 2.0**
- NeuroLint CLI is now permanently free and open-source
- Updated all documentation to reflect Apache 2.0 licensing
- Updated package.json, README.md, CONTRIBUTING.md, LICENSE_NOTICES.md
- Added commitment: "This license will never change"

### Why Apache 2.0?
- Maximum developer trust and adoption
- Enterprise-friendly with explicit patent grant
- Compatible with React/Next.js ecosystem (all use permissive licenses)
- No restrictions on commercial use
- Enables partnerships and integrations

## [1.3.9] - 2025-11-25

### Changed
- Version bump to 1.3.9 for Reddit and Product Hunt launch
- Prepared repository for public launch

### Meta
- Migrated project to Replit environment
- Updated Node.js to version 20 for compatibility
- Verified all 297 tests passing
- Landing page fully functional

## [1.4.0] - 2025-11-21

### Added

#### Next.js 16 Migration
- Full support for Next.js 16 with comprehensive migration tooling
- Automatic `middleware.ts` → `proxy.ts` migration
- PPR to Cache Components conversion
- Async Request APIs: Updates `cookies()` and `headers()` to use `await`
- Async Params: Converts `({ params })` → `async (props) => { const params = await props.params }`
- Caching APIs: Adds `'use cache'` directives and integrates `cacheLife`/`updateTag()`
- Runtime Configuration: Auto-adds `export const runtime = "nodejs"` to proxy files
- New command: `neurolint migrate-nextjs-16`

#### React 19 Dependency Checker
- New `check-deps` command with intelligent dependency analysis
- Scans `package.json` for React 19 incompatibilities
- Detects issues with Radix UI, Ant Design, next-auth, react-is
- Auto-generates `.npmrc` with `legacy-peer-deps` when needed
- Adds `overrides` to `package.json` for stubborn dependencies
- `--fix` flag for automatic resolution

#### Turbopack Migration Assistant
- New `check-turbopack` command for Webpack → Turbopack migration
- Analyzes Webpack-specific configurations in `next.config.js`
- Identifies incompatible loaders and plugins
- Detects Babel configurations requiring SWC migration
- Recommends Turbopack filesystem caching for performance

#### React Compiler Detector
- New `check-compiler` command for optimization opportunities
- Detects manual `useMemo`, `useCallback`, `React.memo` patterns
- Identifies `useRef` for previous value tracking
- Calculates potential bundle size savings
- Recommends React Compiler when 3+ opportunities found

#### Router Complexity Assessor
- New `assess-router` command for complexity analysis
- Complexity scoring (0-100 scale)
- Detects App Router, Pages Router, middleware, API routes
- Identifies Server/Client Components and SSR/SSG usage
- Recommends optimal setup (plain React vs minimal/full Next.js)
- Provides simplification opportunities

#### React 19.2 Feature Detector
- New `detect-react192` command for modern React adoption
- View Transitions: Finds manual animation code that could use View Transitions API
- useEffectEvent: Identifies `useEffect` callbacks that could benefit from `useEffectEvent`
- Activity Components: Detects `display: none` patterns that could use Activity components

### Changed
- Version bumped from 1.3.4 to 1.4.0
- Updated documentation with Next.js 16 features

### Fixed
- Critical bug fixes in AST parsing and regex handling
- Fixed critical bug in findLineNumber regex handling in React Compiler Detector

### Tests
- 100+ new tests added (297 total, all passing)
- Comprehensive coverage for all migration and analysis tools
- Integration tests with real-world fixtures

## [1.3.4] - 2025-11-20

### Changed
- Professional appearance update: Removed all emojis from documentation and CLI output
- Replaced emojis with professional bracket notation: [SUCCESS], [FAILED], [!], [+], [i], [*]
- Enterprise-friendly output for professional environments
- Version bumped from 1.0.0 to 1.3.4 (matching npm)

### Documentation
- Removed all emojis from README.md, CLI_USAGE.md, CONTRIBUTING.md
- Removed all emojis from CLI output (cli.js)
- Created NPM_PUBLISH_GUIDE.md with comprehensive publishing instructions

### Tests
- All 249 tests still passing

## [1.3.3] - 2025-11-19

### Changed
- License migrated from MIT to Business Source License 1.1 (later changed to Apache 2.0)
- Change Date: 2029-11-22 (no longer applicable)
- Change License: GPL-3.0-or-later after change date (no longer applicable)

### Added
- LICENSE_NOTICES.md documenting all 329 third-party dependencies (direct + transitive)
- BSL headers to all npm-distributed files:
  - Core CLI files: cli.js, server.js, fix-master.js, ast-transformer.js
  - Backup system: backup-manager.js, backup-manager-production.js, backup-error-handler.js
  - Utilities: validator.js, selector.js, simple-ora.js
  - All scripts/ directory transformation files (7 fix layers + 4 migration tools)
  - All shared-core/ modules (analytics.js, config-manager.js, rule-engine.js)
  - All API endpoints: api/analyze.js, api/status.js, api/lib/*, api/result/*, api/stream/*

### Documentation
- Updated package.json with "SEE LICENSE IN LICENSE"
- Updated README.md with BSL references
- Updated CONTRIBUTING.md with BSL information

### Security
- Prevents competitors from cloning and selling NeuroLint as competing SaaS
- Allows internal company use, contributions, and modifications
- Enables enterprise licensing model while maintaining transparency

## [1.0.0] - 2025-11-19

### Added
- Initial public release of NeuroLint CLI
- 7-layer progressive architecture for code transformation
- Layer 1: Configuration Modernization (tsconfig.json, next.config.js, package.json)
- Layer 2: Pattern Standardization (HTML entities, console.log, unused imports)
- Layer 3: Accessibility & Components (React keys, WCAG 2.1 AA compliance)
- Layer 4: SSR/Hydration Safety (localStorage guards, window/document protection)
- Layer 5: Next.js App Router Optimization ('use client', Server Components)
- Layer 6: Testing & Error Handling (error boundaries, test generation)
- Layer 7: Adaptive Pattern Learning (custom rules, project conventions)

### Features
- React 19 migration tools
- Next.js 15.5 migration support
- Biome migration from ESLint/Prettier
- Project simplification tools
- Comprehensive backup system
- AST-based transformations (deterministic, no AI)
- Zero-config operation
- Dry-run mode for safe previews

### Commands
- `neurolint analyze` - Scan for issues
- `neurolint fix` - Apply automatic fixes
- `neurolint validate` - Validate without changes
- `neurolint migrate-react19` - React 19 migration
- `neurolint migrate-biome` - Biome migration
- `neurolint simplify` - Project simplification
- `neurolint stats` - Project statistics
- `neurolint backup` - Backup management
- `neurolint rules` - Custom rule management

### Tests
- 170 tests total, all passing
- CLI tests with exact exit code assertions
- Integration tests with real fixtures
- Error handling tests with specific error message validation
- Backup manager tests including error scenarios
- AST transformer and validator comprehensive test coverage
- Performance tests for large codebases

### Documentation
- Comprehensive README.md with examples and use cases
- Complete CLI_USAGE.md guide
- CONTRIBUTING.md guidelines
- CODE_OF_CONDUCT.md
- Standard repository files (LICENSE, package.json)

### Repository
- GitHub repository: https://github.com/Alcatecablee/Neurolint
- npm package: @neurolint/cli
- Business Source License 1.1
- Ready for community contributions

## [Unreleased]

### Planned
- Web dashboard for visual code transformation
- VS Code extension
- GitHub Action for automated fixes
- Team collaboration features
- Advanced analytics and reporting
- Custom rule marketplace

---

For more information, visit [github.com/Alcatecablee/Neurolint](https://github.com/Alcatecablee/Neurolint)
