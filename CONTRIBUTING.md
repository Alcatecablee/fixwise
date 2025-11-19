# Contributing to NeuroLint

Thank you for your interest in contributing to NeuroLint! 

NeuroLint is a deterministic, rule-based code transformation engine for TypeScript, JavaScript, React, and Next.js projects. We welcome contributions of all kinds: bug fixes, new transformation rules, documentation improvements, and feature enhancements.

---

## 📌 Overview

NeuroLint uses a **7-Layer Architecture** to progressively fix and optimize code:

1. **Configuration Layer** – tsconfig.json, package.json, next.config.js fixes
2. **Pattern Layer** – unused imports, console.log cleanup, HTML entities
3. **Component Layer** – React keys, accessibility, props
4. **Hydration Layer** – SSR guards for window, document, and localStorage
5. **Next.js Layer** – App Router improvements, "use client" handling
6. **Testing Layer** – error boundaries, test scaffolding
7. **Adaptive Layer** – custom rule learning and pattern recognition

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Neurolint.git
cd Neurolint
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Tests

```bash
# Run the full test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

All tests should pass before submitting a PR.

---

## 🛠️ Project Structure

```
neurolint-cli/
├── cli.js                    # Main CLI entry point (4,731 lines)
├── fix-master.js             # Layer orchestrator (1,901 lines)
├── ast-transformer.js        # AST-based code analysis (862 lines)
├── backup-manager.js         # Safe backup system
├── validator.js              # Code validation
├── selector.js               # Smart layer selection
├── scripts/                  # Individual layer implementations
│   ├── fix-layer-1-config.js
│   ├── fix-layer-2-patterns.js
│   ├── fix-layer-3-components.js
│   ├── fix-layer-4-hydration.js
│   ├── fix-layer-5-nextjs.js
│   ├── fix-layer-6-testing.js
│   └── fix-layer-7-adaptive.js
├── shared-core/              # Core utilities
│   ├── analytics.js
│   ├── config-manager.js
│   └── rule-engine.js
└── __tests__/                # Jest test suite (68 tests)
```

---

## 🧪 How NeuroLint Works

NeuroLint uses **AST (Abstract Syntax Tree) parsing** with Babel to:
1. Parse code into an AST
2. Apply deterministic transformation rules
3. Generate clean, fixed code
4. Validate transformations before applying

**Key principle:** All transformations are **rule-based** and **deterministic** – no AI, no LLMs, no unpredictable behavior.

---

## 🔧 Types of Contributions

### 1. Bug Fixes

Found a bug? Great!

1. **Open an issue** describing the bug with:
   - Code sample that triggers the bug
   - Expected vs actual behavior
   - NeuroLint version (`neurolint --version`)

2. **Submit a PR** with:
   - Fix for the bug
   - Test case that covers the bug
   - Clear explanation of what was broken

### 2. New Transformation Rules

Want to add a new rule?

1. **Identify the layer** it belongs to (1-7)
2. **Add the rule** to the appropriate `scripts/fix-layer-X.js` file
3. **Write tests** in `__tests__/` to verify the rule works
4. **Update documentation** if needed

**Example rule structure:**
```javascript
// In scripts/fix-layer-3-components.js
function fixMissingKeys(ast) {
  traverse(ast, {
    JSXElement(path) {
      // Your transformation logic here
    }
  });
}
```

### 3. Documentation Improvements

Documentation is always welcome:
- Fix typos or unclear explanations
- Add examples
- Improve README or CLI_USAGE.md
- Add comments to complex code

### 4. Test Coverage

Help us reach 100% test coverage:
- Add tests for untested edge cases
- Improve existing test clarity
- Add integration tests

---

## ✅ Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows existing style (use existing files as reference)
- [ ] Added tests for new functionality
- [ ] Updated documentation if needed
- [ ] Commit messages are clear and descriptive

### PR Process

1. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b fix/hydration-guard-bug
   # or
   git checkout -b feature/add-remix-support
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "Fix: hydration guard not detecting localStorage.getItem()"
   ```

3. **Push and create PR:**
   ```bash
   git push origin your-branch-name
   ```

4. **Wait for review** – we'll review as soon as possible!

### PR Title Format

- `Fix: [brief description]` – for bug fixes
- `Feature: [brief description]` – for new features
- `Docs: [brief description]` – for documentation
- `Test: [brief description]` – for test improvements

---

## 🧑‍💻 Code Style

- Use existing code as a style guide
- Keep functions focused and single-purpose
- Add comments for complex logic
- Use descriptive variable names
- Follow JavaScript/Node.js best practices

---

## 🐛 Reporting Issues

When reporting issues, please include:

1. **NeuroLint version:** `neurolint --version`
2. **Node.js version:** `node --version`
3. **Code sample** that triggers the issue
4. **Expected behavior** vs **actual behavior**
5. **Steps to reproduce**

**Good issue example:**
```
Title: Layer 3 fails to add keys to .map() with destructured parameters

NeuroLint: 1.0.0
Node: 18.0.0

Code:
const list = items.map(({ id, name }) => <Item id={id} name={name} />);

Expected: Add key={id}
Actual: No change applied

Steps:
1. Run neurolint fix test.tsx --layers=3
2. Observe no key added
```

---

## 💬 Questions?

- **General questions:** Open a discussion
- **Bug reports:** Open an issue
- **Feature requests:** Open an issue with the "enhancement" label

---

## 🎯 Good First Issues

Look for issues labeled `good-first-issue` – these are great for new contributors!

Some ideas for first contributions:
- Add test coverage for existing rules
- Fix documentation typos
- Add examples to CLI_USAGE.md
- Improve error messages

---

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Every contribution helps make NeuroLint better for the React and Next.js community. We appreciate your time and effort!

---

**Questions about contributing?** Open an issue and we'll help you get started.
