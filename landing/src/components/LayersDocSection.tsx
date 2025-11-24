import React, { useState } from 'react';
import { Settings, Layers, Sparkles, Target, ChevronDown, ChevronUp, Wrench, Code, Shield, Zap, Rocket, TestTube, Brain } from 'lucide-react';

interface LayerDetail {
  id: number;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  description: string;
  whatItDoes: string[];
  keyFeatures: string[];
  react19Specific?: string[];
  nextjs155Specific?: string[];
  examples: {
    title: string;
    before: string;
    after: string;
    explanation: string;
  }[];
  whenToUse: string;
  technicalDetails: string;
}

const layersData: LayerDetail[] = [
  {
    id: 1,
    name: "Layer 1: Configuration",
    shortName: "L1 Configuration",
    icon: <Settings className="w-6 h-6" />,
    description: "Modernizes project configuration files to align with Next.js 15.5 and React 19 best practices. Enforces TypeScript strict mode and updates build tools.",
    whatItDoes: [
      "Upgrades tsconfig.json to ES2022 with strict TypeScript settings",
      "Adds Turbopack configuration for faster Next.js 15.5 builds",
      "Migrates from ESLint to Biome for better performance",
      "Updates package.json scripts and dependencies",
      "Configures image optimization and remote patterns",
      "Removes deprecated Next.js experimental flags"
    ],
    keyFeatures: [
      "Enforces strict: true and 17+ TypeScript compiler options",
      "Sets jsx to 'react-jsx' for React 19 compatibility",
      "Adds type-check, build:analyze scripts",
      "Configures experimental.turbo for 2-3x faster builds",
      "Updates target to ES2022 and moduleResolution to bundler"
    ],
    nextjs155Specific: [
      "Adds Turbopack experimental configuration",
      "Removes deprecated outputFileTracing flags",
      "Configures images.remotePatterns for Next.js Image optimization",
      "Updates build scripts with --turbo flag"
    ],
    examples: [
      {
        title: "TypeScript Configuration Modernization",
        before: `{
  "compilerOptions": {
    "target": "ES2015",
    "module": "commonjs",
    "jsx": "react",
    "strict": false
  }
}`,
        after: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}`,
        explanation: "Upgrades to modern TypeScript standards with ES2022 features and enforces strict type checking to prevent runtime errors."
      },
      {
        title: "Next.js Turbopack Integration",
        before: `module.exports = {
  reactStrictMode: true
}`,
        after: `module.exports = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  }
}`,
        explanation: "Adds Turbopack configuration for Next.js 15.5, providing up to 700x faster cold starts and 4x faster updates."
      }
    ],
    whenToUse: "Run first before any other layers. Essential when upgrading to Next.js 15.5 or React 19, or when starting a new project with strict TypeScript.",
    technicalDetails: "Layer 1 performs static analysis and modification of JSON and JS configuration files using AST parsing. It detects Next.js version from package.json to apply version-specific optimizations."
  },
  {
    id: 2,
    name: "Layer 2: Patterns",
    shortName: "L2 Patterns",
    icon: <Code className="w-6 h-6" />,
    description: "Fixes common code patterns and anti-patterns. Handles React 19 breaking changes like Legacy Context and createFactory removal.",
    whatItDoes: [
      "Removes console.log, alert, confirm, prompt statements with AST-based transformations",
      "Handles console.log in arrow functions correctly (preserves valid syntax)",
      "Fixes corrupted HTML entities (&quot;, &amp;, &lt;, &gt;)",
      "Converts React.createFactory to JSX (React 19)",
      "Detects Legacy Context usage (removed in React 19)",
      "Cleans up setTimeout/mock data patterns",
      "Migrates from next/legacy/image to next/image",
      "Updates deprecated Next.js 15.5 imports"
    ],
    keyFeatures: [
      "AST-based transformations with Babel parser for console.log removal",
      "Correctly handles all arrow function patterns (verified with comprehensive testing)",
      "Preserves code structure and formatting",
      "Provides migration warnings for React 19",
      "Suggests modern alternatives (toast/dialog over alert)",
      "100% comment coverage on removals"
    ],
    react19Specific: [
      "Converts React.createFactory('div') to JSX components",
      "Detects contextTypes and getChildContext (removed in React 19)",
      "Warns about module pattern factories (no longer supported)",
      "Suggests migration to React.createContext() and useContext()"
    ],
    nextjs155Specific: [
      "Migrates from next/legacy/image to next/image",
      "Replaces 'next lint' with Biome in scripts",
      "Updates next/router imports to next/navigation",
      "Removes legacyBehavior prop from Link components"
    ],
    examples: [
      {
        title: "React 19: createFactory Migration",
        before: `import React from 'react';
const divFactory = React.createFactory('div');
const buttonFactory = createFactory('button');`,
        after: `import React from 'react';
const divFactory = (props) => <div {...props} />;
const buttonFactory = (props) => <button {...props} />;`,
        explanation: "React.createFactory is removed in React 19. This converts factory functions to modern JSX components."
      },
      {
        title: "Console Statement Cleanup with Arrow Functions",
        before: `const handler = () => console.log('test');
const logger = value => console.log(value);
function handleClick() {
  console.log('Button clicked');
  alert('Success!');
}`,
        after: `const handler = () => {} /* [NeuroLint] Removed console.log: 'test'*/;
const logger = value => {} /* [NeuroLint] Removed console.log: value*/;
function handleClick() {
  // [NeuroLint] Removed console.log: 'Button clicked'
  ;
  // [NeuroLint] Replace with toast notification: 'Success!'
  ;
}`,
        explanation: "AST-based transformations correctly handle console.log in arrow functions, preserving valid JavaScript syntax. All arrow function patterns work: no params, single param, multi-param, destructured params."
      }
    ],
    whenToUse: "Run after Layer 1. Essential for React 19 migration or cleaning up legacy code patterns before component fixes.",
    technicalDetails: "Uses @babel/parser with JSX and TypeScript plugins. Console.log removal uses AST-based CallExpression visitor with context detection (isArrowFunctionBody helper). Arrow functions: converts to empty block with comment. Standalone statements: EmptyStatement with leading comment. Expression contexts: undefined with inline comment. Regex fallbacks for HTML entities and legacy patterns."
  },
  {
    id: 3,
    name: "Layer 3: Components",
    shortName: "L3 Components",
    icon: <Shield className="w-6 h-6" />,
    description: "Enhances React component quality with accessibility improvements, missing key props, and React 19 ref modernization.",
    whatItDoes: [
      "Adds missing key props in .map() iterations",
      "Converts forwardRef to direct ref props (React 19)",
      "Adds aria-label to buttons and interactive elements",
      "Adds alt text to images for WCAG 2.1 AA compliance",
      "Converts HTML button/input to component library versions",
      "Fixes string refs to callback/useRef pattern",
      "Warns about PropTypes (deprecated in React 19)"
    ],
    keyFeatures: [
      "WCAG 2.1 AA accessibility compliance",
      "AST-based component transformation",
      "Automatic UI component imports (Button, Input, Card)",
      "React 19 ref pattern modernization"
    ],
    react19Specific: [
      "Converts forwardRef to direct ref prop access",
      "Transforms string refs to callback refs",
      "Provides PropTypes migration warnings",
      "Suggests TypeScript types over PropTypes"
    ],
    examples: [
      {
        title: "React 19: forwardRef Modernization",
        before: `const Input = forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    return <input ref={ref} {...props} />;
  }
);`,
        after: `const Input = ({ ref, ...props }: Props) => {
  return <input ref={ref} {...props} />;
};`,
        explanation: "React 19 allows ref as a regular prop, eliminating the need for forwardRef wrapper."
      },
      {
        title: "Accessibility and Key Props",
        before: `function TodoList({ todos }) {
  return (
    <div>
      {todos.map(todo => (
        <div>
          <button onClick={() => delete(todo)}>
            <svg>...</svg>
          </button>
        </div>
      ))}
    </div>
  );
}`,
        after: `function TodoList({ todos }) {
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <button 
            aria-label="Delete todo"
            onClick={() => delete(todo)}
          >
            <svg>...</svg>
          </button>
        </div>
      ))}
    </div>
  );
}`,
        explanation: "Adds key props to prevent React warnings and aria-label for screen reader accessibility."
      }
    ],
    whenToUse: "Run after Layer 2. Critical for React 19 upgrades and accessibility compliance (WCAG 2.1 AA).",
    technicalDetails: "Combines AST transformation with regex fallbacks. Uses ASTTransformer class for component analysis and modification. Detects component patterns and applies accessibility rules."
  },
  {
    id: 4,
    name: "Layer 4: Hydration",
    shortName: "L4 Hydration",
    icon: <Zap className="w-6 h-6" />,
    description: "Prevents hydration mismatches in Next.js SSR by guarding browser APIs and implementing event listener cleanup.",
    whatItDoes: [
      "Adds typeof window !== 'undefined' guards for browser globals",
      "Wraps localStorage/sessionStorage access in SSR checks",
      "Implements automatic addEventListener cleanup with removeEventListener",
      "Adds typeof document !== 'undefined' guards for DOM access",
      "Prevents 'ReferenceError: window/document is not defined' in SSR"
    ],
    keyFeatures: [
      "Automatic typeof window/document guards",
      "Inline SSR safety wrapping for browser APIs",
      "Automatic useEffect cleanup generation for event listeners",
      "Prevents server-side ReferenceErrors and memory leaks"
    ],
    examples: [
      {
        title: "LocalStorage SSR Guard",
        before: `function ThemeProvider() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  return <div className={\`theme-\${theme}\`}>...</div>;
}`,
        after: `function ThemeProvider() {
  const [theme, setTheme] = useState(
    (typeof window !== "undefined" ? localStorage.getItem('theme') : null) || 'light'
  );
  return <div className={\`theme-\${theme}\`}>...</div>;
}`,
        explanation: "Wraps localStorage access in typeof window check to prevent server-side ReferenceError. Falls back to null if window is undefined, then || operator uses 'light' default."
      },
      {
        title: "Event Listener Cleanup",
        before: `useEffect(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
}, []);`,
        after: `useEffect(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll);
  };
}, []);`,
        explanation: "Automatically generates cleanup function with removeEventListener for all addEventListener calls in useEffect, preventing memory leaks and ensuring proper cleanup."
      }
    ],
    whenToUse: "Run after Layer 3. Essential for all Next.js projects with SSR/SSG, especially when using browser APIs like localStorage or window.",
    technicalDetails: "AST-based transformations using @babel/parser and @babel/traverse. Uses strict guard detection for exact 'typeof <global> !== \"undefined\"' patterns. Handles deeply nested member expressions (e.g., window.navigator.geolocation.watchPosition) via getRootGlobalName() helper. Prevents infinite loops with path.skip() for newly created nodes."
  },
  {
    id: 5,
    name: "Layer 5: Next.js App Router",
    shortName: "L5 Next.js Router",
    icon: <Rocket className="w-6 h-6" />,
    description: "Optimizes Next.js 15.5 App Router usage with proper directives, React 19 DOM API migrations, and type-safe routing.",
    whatItDoes: [
      "Adds 'use client' directives for interactive components",
      "Converts ReactDOM.render to createRoot (React 19)",
      "Converts ReactDOM.hydrate to hydrateRoot (React 19)",
      "Migrates from react-dom/test-utils to react (act import)",
      "Implements type-safe routing with TypeScript interfaces",
      "Optimizes Server Component vs Client Component split",
      "Detects findDOMNode usage (removed in React 19)"
    ],
    keyFeatures: [
      "Automatic 'use client' directive insertion",
      "React 19 root API migration (createRoot/hydrateRoot)",
      "Type-safe route parameter generation",
      "Server Component optimization"
    ],
    react19Specific: [
      "Converts ReactDOM.render(<App />, el) to const root = createRoot(el); root.render(<App />)",
      "Generates unique variable names (root, root1, root2) for multiple createRoot calls",
      "Converts ReactDOM.hydrate(el, container) to hydrateRoot(container, el) with correct parameter order",
      "Migrates act from react-dom/test-utils to react",
      "Warns about unmountComponentAtNode requiring manual migration",
      "Detects findDOMNode (removed) and suggests useRef"
    ],
    nextjs155Specific: [
      "Adds 'use client' for components using hooks/events",
      "Type-safe routing with params/searchParams interfaces",
      "Server Component detection and optimization",
      "Proper directive placement after imports"
    ],
    examples: [
      {
        title: "React 19: createRoot Migration",
        before: `import ReactDOM from 'react-dom';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);`,
        after: `import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
        explanation: "React 19 removes ReactDOM.render. The new createRoot API enables concurrent features and better error handling. Multiple ReactDOM.render calls generate unique variable names (root, root1, root2) to prevent redeclaration errors."
      },
      {
        title: "Next.js App Router: 'use client' Directive",
        before: `import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
        after: `'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
        explanation: "Components using hooks, event handlers, or browser APIs must be marked as Client Components in Next.js App Router."
      }
    ],
    whenToUse: "Run after Layer 4. Critical for Next.js 15.5 App Router projects and React 19 DOM API migration.",
    technicalDetails: "AST-based transformation using @babel/parser. Detects React hooks, event handlers, and browser API usage to determine Client Component requirements. Implements TypeSafeRoutingTransformer for route params."
  },
  {
    id: 6,
    name: "Layer 6: Testing",
    shortName: "L6 Testing",
    icon: <TestTube className="w-6 h-6" />,
    description: "Enhances testing infrastructure with proper imports, improved descriptions, and guidance for React Server Components.",
    whatItDoes: [
      "Adds missing @testing-library/react imports",
      "Improves test descriptions for clarity",
      "Adds accessibility testing suggestions",
      "Provides RSC (React Server Components) testing guidance",
      "Warns about MSW compatibility issues with App Router",
      "Suggests integration tests over unit tests for Server Components",
      "Generates test file scaffolding"
    ],
    keyFeatures: [
      "Automatic testing library import injection",
      "Test description enhancement",
      "RSC testing best practices",
      "Jest/Vitest configuration generation"
    ],
    nextjs155Specific: [
      "RSC testing guidance (integration over unit tests)",
      "MSW Edge Runtime compatibility warnings",
      "Suggests fetch mocking alternatives for App Router",
      "Server Component vs Client Component test strategies"
    ],
    examples: [
      {
        title: "React Server Component Testing Guidance",
        before: `import { render, screen } from '@testing-library/react';

test('renders', () => {
  render(<ServerComponent />);
});`,
        after: `// WARNING: React Server Component Testing:
// - Use integration tests (Playwright/Cypress) instead of RTL
// - Or mock fetch/database calls and test business logic separately
// - Server Components cannot use traditional React testing tools

import { render, screen } from '@testing-library/react';

test('renders', () => {
  render(<ServerComponent />);
});`,
        explanation: "Server Components are server-only and cannot be tested with traditional React testing tools. Integration tests are recommended."
      },
      {
        title: "Testing Library Improvements",
        before: `test('test', () => {
  render(<Button />);
});`,
        after: `import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('test should work correctly', () => {
  render(<Button />);
  // Consider adding: expect(screen.getByRole('button')).toBeInTheDocument();
});`,
        explanation: "Adds missing testing imports, improves test description, and suggests accessibility assertions."
      }
    ],
    whenToUse: "Run after Layer 5. Essential for projects needing comprehensive test coverage, especially with Server Components.",
    technicalDetails: "Pattern-based detection of test files and component files. Provides scaffolding generation for Jest/Vitest configurations. Analyzes component type (Server/Client) to provide appropriate testing guidance."
  },
  {
    id: 7,
    name: "Layer 7: Adaptive Learning",
    shortName: "L7 Adaptive",
    icon: <Brain className="w-6 h-6" />,
    description: "Learns project-specific patterns from previous layers and applies custom rules automatically. Adapts to your codebase style.",
    whatItDoes: [
      "Analyzes transformations from Layers 1-6",
      "Extracts common patterns and creates rules",
      "Applies learned rules with confidence scoring",
      "Stores rules in .neurolint/learned-rules.json",
      "Provides adaptive suggestions for inline styles",
      "Learns console removal patterns",
      "Adapts to project-specific conventions"
    ],
    keyFeatures: [
      "Machine learning-like pattern extraction",
      "Confidence-based rule application (minimum 70%)",
      "Rule persistence and sharing across runs",
      "Project-specific code style learning"
    ],
    examples: [
      {
        title: "Learning from Layer 5 Patterns",
        before: `// After Layer 5 adds 'use client' to several files
import React from 'react';
export default function NewComponent() { ... }`,
        after: `// Layer 7 learns the pattern and applies it
'use client';

import React from 'react';
export default function NewComponent() { ... }`,
        explanation: "Layer 7 detected that Layer 5 added 'use client' to similar components and learned to apply this pattern automatically."
      },
      {
        title: "Adaptive Style Suggestions",
        before: `const Button = () => (
  <button style={{ 
    padding: '10px', 
    backgroundColor: 'blue' 
  }}>
    Click me
  </button>
);`,
        after: `// [NeuroLint] Inline styles detected - consider using CSS classes for better performance
const Button = () => (
  <button style={{ 
    padding: '10px', 
    backgroundColor: 'blue' 
  }}>
    Click me
  </button>
);`,
        explanation: "Layer 7 provides adaptive suggestions based on code patterns, helping maintain consistent project conventions."
      }
    ],
    whenToUse: "Run last after all other layers. Most effective after running multiple fixes to learn project-specific patterns.",
    technicalDetails: "Implements RuleStore class for pattern persistence. Uses confidence scoring (0-1.0) and frequency tracking. Extracts patterns by comparing before/after code from previous layers. Applies rules with minimum 0.7 confidence threshold."
  }
];

export function LayersDocSection() {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const selectedLayerData = selectedLayer !== null 
    ? layersData.find(l => l.id === selectedLayer)
    : null;

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white">
            Explore Each Layer in Detail
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium mb-6">
            Deep dive into NeuroLint's 7-layer architecture. Each layer targets specific issues with surgical precision.
          </p>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Each layer builds upon the previous, ensuring foundational issues are resolved first. Run individually or together based on your needs.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden">
          {/* Layer Selector Dropdown */}
          <div className="bg-black/40 border-b border-white/20 p-6">
            <label htmlFor="layer-select" className="block text-sm font-bold text-gray-400 mb-3">
              Choose a Layer to Explore
            </label>
            <select
              id="layer-select"
              value={selectedLayer || ''}
              onChange={(e) => {
                const layerId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedLayer(layerId);
                setExpandedSections(new Set());
              }}
              className="w-full bg-black/60 border-2 border-white/20 text-white rounded-xl px-4 py-3 font-medium text-lg focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
            >
              <option value="" disabled>Select a layer to learn more...</option>
              {layersData.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Layer Details Content */}
          {selectedLayerData ? (
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black flex-shrink-0 text-xl font-black">
                  L{selectedLayerData.id}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-white mb-2">
                    {selectedLayerData.name}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {selectedLayerData.description}
                  </p>
                </div>
              </div>

              {/* What It Does */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                <h4 className="text-xl font-black text-white mb-4">
                  What This Layer Does
                </h4>
                <ul className="space-y-2">
                  {selectedLayerData.whatItDoes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-white mt-1">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Features */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                <button
                  onClick={() => toggleSection('features')}
                  className="w-full flex items-center justify-between text-left mb-4"
                >
                  <h4 className="text-xl font-black text-white">
                    Key Features
                  </h4>
                  {expandedSections.has('features') ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSections.has('features') && (
                  <ul className="space-y-2 animate-fade-in">
                    {selectedLayerData.keyFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300">
                        <span className="text-white mt-1">▸</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* React 19 Specific */}
              {selectedLayerData.react19Specific && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                  <button
                    onClick={() => toggleSection('react19')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h4 className="text-xl font-black text-white">
                      React 19 Specific
                    </h4>
                    {expandedSections.has('react19') ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has('react19') && (
                    <ul className="space-y-2 animate-fade-in">
                      {selectedLayerData.react19Specific.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                          <span className="text-white mt-1">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Next.js 15.5 Specific */}
              {selectedLayerData.nextjs155Specific && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                  <button
                    onClick={() => toggleSection('nextjs')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h4 className="text-xl font-black text-white">
                      Next.js 15.5 Specific
                    </h4>
                    {expandedSections.has('nextjs') ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has('nextjs') && (
                    <ul className="space-y-2 animate-fade-in">
                      {selectedLayerData.nextjs155Specific.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                          <span className="text-white mt-1">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Examples */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                <h4 className="text-xl font-black text-white mb-4">
                  Examples
                </h4>
                <div className="space-y-6">
                  {selectedLayerData.examples.map((example, idx) => (
                    <div key={idx} className="bg-black/60 rounded-xl p-4 border border-white/10">
                      <button
                        onClick={() => toggleSection(`example-${idx}`)}
                        className="w-full flex items-center justify-between text-left mb-3"
                      >
                        <h5 className="font-black text-white">{example.title}</h5>
                        {expandedSections.has(`example-${idx}`) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {expandedSections.has(`example-${idx}`) && (
                        <div className="space-y-3 animate-fade-in">
                          <div>
                            <div className="text-sm font-bold text-zinc-400 mb-2">Before:</div>
                            <pre className="bg-black/80 text-gray-300 p-3 rounded-lg text-sm overflow-x-auto border border-white/20">
                              <code>{example.before}</code>
                            </pre>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-2">After:</div>
                            <pre className="bg-black/80 text-gray-300 p-3 rounded-lg text-sm overflow-x-auto border border-white/20">
                              <code>{example.after}</code>
                            </pre>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/20">
                            <div className="text-sm font-bold text-white mb-1">Explanation:</div>
                            <p className="text-sm text-gray-300">{example.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* When to Use */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                <h4 className="text-xl font-black text-white mb-3">
                  When to Use This Layer
                </h4>
                <p className="text-gray-300">{selectedLayerData.whenToUse}</p>
              </div>

              {/* Technical Details */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20">
                <button
                  onClick={() => toggleSection('technical')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h4 className="text-xl font-black text-white">
                    Technical Implementation
                  </h4>
                  {expandedSections.has('technical') ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSections.has('technical') && (
                  <p className="text-gray-300 mt-4 animate-fade-in">
                    {selectedLayerData.technicalDetails}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">
                Select a layer from the dropdown above to explore its features, examples, and technical details
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
