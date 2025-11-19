# NeuroLint CLI

> Deterministic code analysis and transformation tool for TypeScript, JavaScript, React, and Next.js projects.

[![npm version](https://img.shields.io/npm/v/@neurolint/cli.svg)](https://www.npmjs.com/package/@neurolint/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./TESTING_REPORT.md)

**NeuroLint uses rule-based intelligence (NOT AI) to automatically detect and fix common code issues.**

---

## 🎯 What Problem Does NeuroLint Solve?

NeuroLint was born from frustration during development of [Taxfy.co.za](https://taxfy.co.za) when over **700 ESLint errors**, hydration bugs, and missing React keys appeared. Instead of manual fixes, an intelligent multi-layer fixing system was created that reduced **600+ issues down to just 70**.

### Common Issues NeuroLint Fixes:
- ✅ Hydration crashes (`window is not defined`)
- ✅ Missing React keys flooding console
- ✅ HTML entity corruption (`&quot;`, `&#x27;`)
- ✅ Accessibility gaps (missing aria-labels, alt attributes)
- ✅ Console.log statements left in production
- ✅ Next.js App Router migration issues
- ✅ SSR/client-side safety guards
- ✅ TypeScript configuration problems

---

## 🚀 Quick Start

### Installation

```bash
npm install -g @neurolint/cli
```

### Basic Usage

```bash
# Analyze your project
neurolint analyze src/

# Fix all issues with all 7 layers (completely free!)
neurolint fix src/ --all-layers --verbose

# Preview changes before applying
neurolint fix src/ --all-layers --dry-run --verbose

# Fix specific layers
neurolint fix src/ --layers=1,2,3 --verbose
```

---

## 🆓 All 7 Layers Are Free!

**No authentication required. No API keys. Completely free and open source.**

### Layer 1: Configuration Fixes
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package.json optimization

### Layer 2: Pattern Fixes
- HTML entity corruption (`&quot;`, `&#x27;`, `&amp;`)
- Unused imports cleanup
- Console.log removal
- React pattern standardization

### Layer 3: Component Fixes
- Missing React keys in .map()
- Button variant props
- Missing aria-labels
- Image alt attributes
- Form field structure

### Layer 4: Hydration & SSR Fixes
- localStorage without SSR guards
- window/document access protection
- Theme provider hydration mismatches
- Client-only component wrapping

### Layer 5: Next.js App Router Fixes
- "use client" directive placement
- Server vs client component detection
- App Router optimizations

### Layer 6: Testing & Validation
- Test file generation
- Missing test coverage detection
- Quality improvements

### Layer 7: Adaptive Pattern Learning
- Learns from your codebase
- Custom rule generation
- Pattern recognition and application

---

## 💡 How It Works

**NeuroLint is NOT AI-powered.** It uses:
- ✅ Deterministic rule-based transformations
- ✅ AST (Abstract Syntax Tree) parsing
- ✅ Pattern recognition
- ✅ Precise, predictable fixes

**No LLM hallucinations. No unpredictable rewrites. Just intelligent, rule-based code fixes.**

---

## 📖 Example: Before & After

**Before:**
```tsx
function Component({ items }) {
  console.log('Debug info');
  return (
    <div>
      &quot;Hello&quot;
      {items.map(item => <div>{item}</div>)}
    </div>
  );
}
```

**After (All Layers Applied):**
```tsx
function Component({ items }) {
  return (
    <div>
      "Hello"
      {items.map((item, index) => <div key={index}>{item}</div>)}
    </div>
  );
}
```

---

## 🛠️ Tech Stack

- **AST Parsing:** `@babel/parser`, `@babel/traverse`, `@babel/types`
- **Pattern Matching:** Custom rule engine
- **Safety:** Built-in backup system with automatic rollback
- **Testing:** Comprehensive Jest test suite (68 tests, all passing)

---

## 📚 Documentation

- [CLI Usage Guide](./CLI_USAGE.md) - Complete command reference
- [Testing Report](./TESTING_REPORT.md) - Test coverage details
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute

---

## 🤝 Contributing

We welcome contributions! NeuroLint is open source and community-driven.

- **Found a bug?** [Open an issue](https://github.com/Alcatecablee/Neurolint/issues)
- **Want to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Have questions?** Start a discussion

See our [Code of Conduct](./CODE_OF_CONDUCT.md) for community guidelines.

---

## 📦 What's in This Repo

- `cli.js` - Main CLI entry point (4,731 lines)
- `scripts/` - 7 fix layer implementations
- `fix-master.js` - Layer orchestrator (1,901 lines)
- `ast-transformer.js` - AST-based code analysis (862 lines)
- `backup-manager.js` - Safe backup system
- `validator.js` - Code validation
- `shared-core/` - Core utilities (analytics, config, rule engine)
- `__tests__/` - Comprehensive Jest test suite

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🌟 Why Open Source?

NeuroLint is open source because:
- **Transparency:** You can see exactly what transformations are applied
- **Trust:** No hidden behavior, telemetry, or data collection
- **Community:** Better rules through collaborative development
- **Innovation:** Faster evolution with community contributions

---

## 🔗 Links

- **NPM Package:** [@neurolint/cli](https://www.npmjs.com/package/@neurolint/cli)
- **GitHub Repository:** [Alcatecablee/Neurolint](https://github.com/Alcatecablee/Neurolint)
- **Issues:** [GitHub Issues](https://github.com/Alcatecablee/Neurolint/issues)
- **Origin Story:** Built for [Taxfy.co.za](https://taxfy.co.za)

---

**Built with ❤️ for the React and Next.js community**
