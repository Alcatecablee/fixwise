# NeuroLint CLI

Automatically fix React and Next.js bugs before they reach production. Uses AST parsing to catch hydration errors, missing keys, and hundreds of other issues.

[![npm version](https://badge.fury.io/js/@neurolint%2Fcli.svg)](https://www.npmjs.com/package/@neurolint/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

```bash
# Install globally
npm install -g @neurolint/cli

# Scan your codebase
neurolint analyze src/

# Preview fixes without changing files
neurolint fix src/ --all-layers --dry-run

# Apply fixes (creates automatic backups)
neurolint fix src/ --all-layers
```

## What It Fixes

| Problem | Solution | Layer |
|---------|----------|-------|
| **Hydration crashes** | Adds `typeof window !== 'undefined'` guards | 4 |
| **localStorage SSR errors** | Wraps localStorage calls with SSR checks | 4 |
| **Missing React keys** | Adds `key={item.id}` to mapped elements | 3 |
| **console.log in production** | Removes or comments out debug code | 2 |
| **React 19 breaking changes** | Converts `ReactDOM.render` to `createRoot` | 2, 5 |
| **Missing accessibility** | Adds `aria-label` and `alt` attributes | 3 |
| **Next.js App Router** | Type-safe route params and searchParams | 5 |
| **Server Actions** | Error handling and optimization | 5 |
| **Deprecated patterns** | Updates legacy Context API, createFactory | 2 |

## Commands

### Analyze

```bash
# Scan for issues
neurolint analyze src/

# Verbose output
neurolint analyze . --verbose

# Save to file
neurolint analyze src/ --output=report.json
```

### Fix

```bash
# Preview changes (safe, no modifications)
neurolint fix src/ --all-layers --dry-run

# Apply all fixes
neurolint fix src/ --all-layers

# Run specific layers only
neurolint fix src/ --layers=3,4,5

# Verbose logging
neurolint fix src/ --all-layers --verbose
```

### Migrations

```bash
# Migrate to React 19
neurolint migrate-react19 . --dry-run

# Migrate to Next.js 15.5
neurolint migrate-nextjs-15.5 . --dry-run

# Migrate from ESLint to Biome
neurolint migrate-biome . --dry-run
```

### Utilities

```bash
# Show layer information
neurolint layers

# Project statistics
neurolint stats

# Clean old backups
neurolint clean --older-than=7
```

## Example

### Before

```jsx
function UserList({ users }) {
  const theme = localStorage.getItem('theme')
  
  return (
    <div>
      {users.map(user => <div>{user.name}</div>)}
      {console.log('Rendering users')}
    </div>
  )
}
```

### After `neurolint fix --all-layers`

```jsx
function UserList({ users }) {
  const theme = typeof window !== 'undefined'
    ? localStorage.getItem('theme')
    : null
  
  return (
    <div>
      {users.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  )
}
```

## How It Works

NeuroLint uses Babel's parser to convert JavaScript/TypeScript into an abstract syntax tree (AST). It then applies pattern-based transformations to fix common issues and generates the corrected code.

This approach is deterministic: same input always produces the same output. No LLMs or probabilistic models. This makes it safe for CI/CD pipelines and easy to audit.

### Seven Layers

Fixes are organized into seven sequential layers:

1. **Configuration** - tsconfig.json, next.config.js optimization
2. **Patterns** - console.log removal, legacy API updates
3. **Components** - React keys, accessibility, prop types
4. **Hydration** - SSR guards, window/localStorage safety
5. **Next.js** - App Router, Server Actions, Metadata API
6. **Testing** - Test file generation, Jest setup
7. **Adaptive** - Pattern learning from your codebase

All layers are free. No API keys required.

## Background

I built this while working on Taxfy.co.za. The codebase had over 700 ESLint errors—mostly hydration bugs, missing React keys, and console.log statements in production. Fixing them manually would have taken weeks.

Instead of clicking through files, I wrote scripts using Babel's AST parser to find and fix patterns automatically. The scripts reduced the error count from 600+ down to about 70 in a few hours.

NeuroLint is those scripts packaged as a CLI tool.

## Configuration

Create `.neurolintrc` to customize:

```json
{
  "exclude": ["**/node_modules/**", "**/dist/**"],
  "include": ["src/**/*.{js,jsx,ts,tsx}"],
  "layers": {
    "enabled": [1, 2, 3, 4, 5, 6, 7]
  },
  "backup": {
    "enabled": true,
    "maxBackups": 10
  }
}
```

## Troubleshooting

### No issues found

NeuroLint focuses on static analysis. Runtime bugs (API failures, logic errors) need debugging tools, not static analysis.

### Fixes not applied

Check file permissions. Make sure you're not running this in `node_modules/`. Use `--verbose` for detailed logs.

### Undo changes

Backups are in `.neurolint-backups/`. List and restore with:

```bash
neurolint backups --list
neurolint backups --restore <backup-id>
```

## Requirements

- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- Works with React, Next.js, TypeScript, JavaScript

## Contributing

Contributions welcome. Fork the repo, make changes, submit a pull request.

## License

MIT

## Links

- **npm:** https://www.npmjs.com/package/@neurolint/cli
- **GitHub:** https://github.com/neurolint/neurolint-cli
- **Website:** https://neurolint.dev
