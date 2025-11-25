# Third-Party License Notices

NeuroLint uses open-source dependencies in its CLI tool and API server. This document provides complete attribution and licensing information for all direct and transitive dependencies.

---

## Dependency Overview

**Total Dependencies (including transitive):** 329 packages
**License Types:** MIT, ISC, Apache-2.0, BSD
**Last Audit:** November 25, 2025

All third-party dependencies use permissive open-source licenses compatible with the Apache License 2.0 under which NeuroLint is distributed.

---

## Core Runtime Dependencies

### Babel Ecosystem (AST Parsing & Transformation)
The core of NeuroLint's transformation engine.

**Primary Packages:**
- `@babel/parser` - JavaScript parser
- `@babel/traverse` - AST traversal utilities
- `@babel/generator` - Code generation from AST
- `@babel/types` - AST node type definitions
- `@babel/core` - Babel compiler core

**Transitive Dependencies (73 packages):**
Includes @babel/helper-*, @babel/plugin-*, @babel/template, and supporting utilities:
- @babel/code-frame, @babel/compat-data, @babel/helper-compilation-targets
- @babel/helper-globals, @babel/helper-module-imports, @babel/helper-module-transforms
- @babel/helper-plugin-utils, @babel/helper-validator-identifier, @babel/helper-validator-option
- @babel/helpers, @babel/plugin-transform-react-jsx-self, @babel/plugin-transform-react-jsx-source
- @babel/template
- Plus babel-plugin-istanbul, babel-plugin-jest-hoist, babel-preset-current-node-syntax, babel-preset-jest

**License:** MIT  
**Copyright:** © 2014-present Sebastian McKenzie and contributors  
**Source:** https://github.com/babel/babel

---

### Express Web Framework (API Server)
HTTP server for transformation API endpoints.

**Primary Package:** `express@5.1.0`

**Transitive Dependencies (30+ packages):**
Express includes extensive middleware and utilities:
- `body-parser` - Request body parsing middleware
- `cookie`, `cookie-signature` - Cookie handling
- `content-disposition`, `content-type` - HTTP content utilities
- `send`, `serve-static`, `finalhandler` - Static file serving
- `etag`, `fresh`, `vary` - HTTP caching headers
- `encodeurl`, `escape-html` - Security utilities
- `http-errors`, `statuses` - HTTP error handling
- `accepts`, `type-is` - Content negotiation
- `forwarded` - Proxy handling
- `depd` - Deprecation warnings
- Plus range-parser, path-to-regexp, and other HTTP utilities

**License:** MIT  
**Copyright:** © 2009-present TJ Holowaychuk and contributors  
**Source:** https://github.com/expressjs/express

---

### CORS Middleware
Cross-Origin Resource Sharing support for API.

**Package:** `cors@2.8.5`  
**License:** MIT  
**Copyright:** © 2013 Troy Goode  
**Source:** https://github.com/expressjs/cors

---

### File System & Pattern Matching

**Package:** `glob@10.5.0` and `glob@12.0.0`  
**Transitive Dependencies:** 
- `@isaacs/balanced-match`, `@isaacs/brace-expansion`
- `minimatch`, `brace-expansion`, `balanced-match`
- `foreground-child`

**License:** ISC  
**Copyright:** © Isaac Z. Schlueter and Contributors  
**Source:** https://github.com/isaacs/node-glob

**Package:** `fast-glob@3.3.3`  
**Transitive Dependencies:**
- `@nodelib/fs.scandir`, `@nodelib/fs.stat`, `@nodelib/fs.walk`
- `glob-parent`, `merge2`, `micromatch`

**License:** MIT  
**Source:** https://github.com/mrmlnc/fast-glob

---

### CLI User Interface

**Package:** `ora` (via simple-ora.js wrapper)  
**Related:** `cli-cursor@3.1.0`, `cli-spinners@2.9.2`  
**License:** MIT  
**Copyright:** © Sindre Sorhus  
**Source:** https://github.com/sindresorhus/ora

**Package:** `log-symbols@latest`  
**License:** MIT  
**Copyright:** © Sindre Sorhus  
**Source:** https://github.com/sindresorhus/log-symbols

**Terminal Utilities:**
- `ansi-escapes@4.3.2` - ANSI escape codes
- `ansi-regex@5.0.1`, `ansi-regex@6.2.2` - ANSI pattern matching
- `ansi-styles@4.3.0`, `ansi-styles@6.2.3` - ANSI styling
- `strip-ansi@6.0.1`, `strip-ansi@7.1.2` - Strip ANSI codes
- `wcwidth@1.0.1` - Character width calculation
- `restore-cursor` - Terminal cursor restoration
- `chalk@4.1.2` - Terminal string styling
- `supports-color@7.2.0`, `supports-color@8.1.1` - Color support detection

**Licenses:** MIT

---

## Development & Build Dependencies

### Testing Framework (Jest)

**Primary Package:** `jest@30.2.0`, `@types/jest@30.0.0`

**Transitive Dependencies (50+ packages):**
Complete Jest ecosystem including:
- `@jest/core`, `@jest/console`, `@jest/environment`, `@jest/reporters`
- `@jest/expect`, `@jest/expect-utils`, `@jest/get-type`
- `@jest/fake-timers`, `@jest/test-result`, `@jest/test-sequencer`
- `@jest/transform`, `@jest/types`, `@jest/pattern`
- `babel-jest@30.2.0` - Babel integration
- `jest-diff`, `jest-matcher-utils`, `jest-message-util`
- Code coverage: `@bcoe/v8-coverage`, `v8-to-istanbul`, `istanbul-lib-*`
- Test utilities: `expect@30.2.0`, `pretty-format`, `stack-utils`

**License:** MIT  
**Copyright:** © Meta Platforms, Inc. and affiliates  
**Source:** https://github.com/jestjs/jest

---

### Build Tools (Landing Page)

**Vite Build System:**
- `vite@4.5.14` - Build tool and dev server
- `@vitejs/plugin-react@4.7.0` - React plugin
- `esbuild` - JavaScript bundler (transitive)
- `rollup` - Module bundler (transitive)

**License:** MIT  
**Copyright:** © 2019-present Evan You & Vite Contributors  
**Source:** https://github.com/vitejs/vite

**React Framework:**
- `react@latest`, `react-dom@latest` - UI library
- **License:** MIT  
- **Copyright:** © Meta Platforms, Inc. and affiliates
- **Source:** https://github.com/facebook/react

**Tailwind CSS Ecosystem:**
- `tailwindcss@3.4.18` - Utility CSS framework
- `postcss@latest` - CSS processor
- `autoprefixer@10.4.22` - CSS vendor prefixing
- Plus transitive dependencies: `browserslist`, `caniuse-lite`, `fraction.js`, `normalize-range`

**Licenses:** MIT  
**Source:** https://github.com/tailwindlabs/tailwindcss

**UI Libraries:**
- `lucide-react` - Icon library (ISC License)
- `next-themes` - Theme management (MIT License)

---

## Utility Dependencies

### Process & Child Process Management
- `cross-spawn@7.0.6` - Cross-platform spawn
- `execa@5.1.1` - Process execution
- `signal-exit@3.0.7`, `signal-exit@4.1.0` - Signal handling
- `human-signals@2.1.0` - Signal names

### File System Utilities
- `graceful-fs@4.2.11` - Improved fs module
- `chokidar@3.6.0` - File watcher
- `fdir@6.5.0` - Fast directory reader
- `tinyglobby@0.2.15` - Glob patterns
- Plus: `anymatch`, `binary-extensions`, `fill-range`, `is-binary-path`, `is-number`, `to-regex-range`

### String & Text Processing
- `string-width@4.2.3`, `string-width@5.1.2` - Calculate string width
- `wrap-ansi@7.0.0`, `wrap-ansi@8.1.0` - Word wrapping
- `emoji-regex@8.0.0`, `emoji-regex@9.2.2` - Emoji detection
- `char-regex@1.0.2` - Character matching
- `eastasianwidth@0.2.0` - East Asian width calculation

### Data Structures & Parsing
- `yaml` - YAML parser
- `strip-json-comments@3.1.1` - JSON comment stripper
- `parse-json@5.2.0` - JSON parser with better errors
- `error-ex@1.3.4` - Error enhancement

### Configuration & CLI
- `yargs@17.7.2`, `yargs-parser@21.1.1` - CLI argument parser
- `@pkgjs/parseargs@0.11.0` - Argument parsing
- `cliui@8.0.1`, `@isaacs/cliui@8.0.2` - CLI UI components
- `commander@4.1.1` - Command-line interfaces
- `didyoumean@1.2.2` - "Did you mean?" suggestions

### Source Maps & Debugging
- `@jridgewell/gen-mapping`, `@jridgewell/trace-mapping`, `@jridgewell/sourcemap-codec`
- `@jridgewell/remapping@2.3.5` - Source map remapping
- `convert-source-map@2.0.0` - Source map conversion
- `source-map-support` - Stack trace support

### TypeScript Support
- `@types/node@24.10.1` - Node.js type definitions
- `@types/babel__*` - Babel type definitions
- `@types/istanbul-lib-coverage@2.0.6` - Istanbul types
- `@types/stack-utils@2.0.3` - Stack utilities types
- Plus: `sucrase`, `ts-interface-checker`

### Performance & Caching
- `@alloc/quick-lru@5.2.0` - LRU cache
- `yocto-queue@0.1.0` - Tiny queue data structure
- `lru-cache` - LRU cache implementation

### Stream & Buffer Utilities
- `bl@4.1.0` - Buffer list
- `buffer@5.7.1` - Buffer implementation
- `readable-stream`, `string_decoder@1.3.0`
- `inherits@2.0.4` - Inheritance utility

### Miscellaneous Utilities
- `semver@7.7.3` - Semantic versioning
- `escape-string-regexp@2.0.0` - Escape RegExp special chars
- `dedent@1.7.0` - String dedentation
- `deepmerge@4.3.1` - Deep object merging
- `dlv@1.1.3` - Delve into objects
- `@ungap/structured-clone@1.3.0` - Structured clone polyfill
- `ci-info@4.3.1` - CI environment detection
- `has-flag@4.0.0` - CLI flag detection
- `detect-newline@3.1.0` - Newline detection
- `which@2.0.2` - Cross-platform which

---

## Complete Dependency Audit

To view the complete dependency tree including all 329 packages and their exact versions:

```bash
# List all dependencies with versions
npm ls --all

# Generate JSON report
npm ls --all --json > dependencies.json

# Check for security vulnerabilities
npm audit

# View only production dependencies
npm ls --production
```

---

## License Type Distribution

**MIT License:** ~95% of dependencies
- Permissive license allowing commercial use, modification, distribution
- Requires attribution and license notice inclusion

**ISC License:** ~4% of dependencies  
- Functionally equivalent to MIT
- Examples: glob, lucide-react

**Apache-2.0, BSD, Other:** <1%
- All permissive and BSL-compatible

---

## License Compatibility Statement

The Apache License 2.0 under which NeuroLint is distributed is fully compatible with all included dependencies:

1. **MIT/ISC Dependencies:** Fully compatible with Apache 2.0. Both are permissive licenses that allow commercial use, modification, and distribution.

2. **Attribution Requirements:** This LICENSE_NOTICES.md file satisfies the attribution requirements of all MIT and ISC licensed dependencies.

3. **Distribution:** Apache 2.0 is compatible with all major open-source licenses including MIT, ISC, BSD, and GPL.

---

## Full License Texts

Complete license texts for all dependencies are available:
- In `node_modules/[package-name]/LICENSE` files
- At each package's source repository (links provided above)
- Via `npm view [package-name] license` command

---

## Contact & Updates

**Last Updated:** November 22, 2025  
**Audit Tool:** `npm ls --all` (329 total packages)

For licensing questions or concerns:
- Email: clivemakazhu@gmail.com  
- GitHub: https://github.com/Alcatecablee/Neurolint/issues

---

## Dependency Security

NeuroLint maintains up-to-date dependencies and regularly audits for security vulnerabilities:

```bash
# Run security audit
npm audit

# Auto-fix vulnerabilities
npm audit fix
```

All dependencies are vetted for:
- Active maintenance
- Security track record  
- License compatibility
- Community trust

---

**Note:** This document is automatically maintained and updated with each release. The dependency count and versions reflect the current `package.json` and `package-lock.json` state at the time of the last NeuroLint release.
