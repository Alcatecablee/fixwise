import React, { useState, useEffect } from 'react'

function App() {
  const [copiedCommand, setCopiedCommand] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(''), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-sm border-b border-slate-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">
                NeuroLint
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="text-slate-300 hover:text-white transition-colors">FAQ</a>
              <a 
                href="#install" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-slate-300 text-sm">Free & Open Source • No API Keys</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight text-white">
              Fix React Bugs
              <br />
              <span className="text-blue-500">Automatically</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Enterprise-grade CLI tool that catches hydration errors, missing keys, and 
              hundreds of React bugs using AST parsing—before they reach production.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <div className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4">
                <code className="text-green-400 font-mono text-sm sm:text-base">
                  npm install -g @neurolint/cli
                </code>
                <button
                  onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'hero')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors whitespace-nowrap"
                >
                  {copiedCommand === 'hero' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2">
                  170+
                </div>
                <div className="text-slate-400 text-sm">Bug Patterns</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2">
                  7
                </div>
                <div className="text-slate-400 text-sm">Fix Layers</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2">
                  100%
                </div>
                <div className="text-slate-400 text-sm">Test Coverage</div>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-400 text-sm font-medium">Before</span>
                <span className="text-xs text-slate-500">Hydration Error</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm text-slate-300 leading-relaxed"><code>{`function UserList({ users }) {
  const theme = localStorage.getItem('theme')
  
  return (
    <div>
      {users.map(user => 
        <div>{user.name}</div>
      )}
    </div>
  )
}`}</code></pre>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-sm font-medium">After Fix</span>
                <span className="text-xs text-slate-500">Automatic</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm text-slate-300 leading-relaxed"><code>{`function UserList({ users }) {
  const theme = typeof window !== 'undefined'
    ? localStorage.getItem('theme')
    : null
  
  return (
    <div>
      {users.map(user => 
        <div key={user.id}>{user.name}</div>
      )}
    </div>
  )
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Enterprise-Grade Fixes
            </h2>
            <p className="text-xl text-slate-400">
              Powered by AST transformations, not guesswork
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Hydration Errors',
                description: 'Guards window, localStorage, and document access for SSR compatibility',
                features: ['typeof window checks', 'localStorage wrappers', 'Document guards']
              },
              {
                title: 'Missing React Keys',
                description: 'Detects and fixes arrays without key props in .map() iterations',
                features: ['Auto-adds key={item.id}', 'Nested loop support', 'Index fallback']
              },
              {
                title: 'React 19 Migration',
                description: 'Updates deprecated APIs and breaking changes for React 19',
                features: ['createRoot migration', 'test-utils updates', 'Legacy Context']
              },
              {
                title: 'Debug Code Removal',
                description: 'Strips console.log and debug statements from production',
                features: ['console.log cleanup', 'Debug removal', 'Test code strip']
              },
              {
                title: 'Accessibility',
                description: 'Adds ARIA labels and alt text for WCAG compliance',
                features: ['aria-label attributes', 'Image alt text', 'Form accessibility']
              },
              {
                title: 'Next.js App Router',
                description: 'Type-safe migrations for Next.js 15 App Router patterns',
                features: ['Typed params', 'Server Actions', 'Metadata API']
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-400">
              Three simple steps to bug-free code
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Install',
                command: 'npm install -g @neurolint/cli',
                description: 'Global CLI installation. Works with any React or Next.js project.'
              },
              {
                step: '02',
                title: 'Analyze',
                command: 'neurolint analyze src/',
                description: 'Scan your codebase to identify all fixable issues.'
              },
              {
                step: '03',
                title: 'Fix',
                command: 'neurolint fix --all-layers',
                description: 'Apply fixes automatically with backup protection.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <div className="text-6xl font-bold text-slate-800 mb-4">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4">
                  <code className="text-green-400 font-mono text-xs">{item.command}</code>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Terminal Output */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-4 text-slate-400 text-sm font-mono">terminal</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-green-400 mb-3">$ neurolint fix src/ --all-layers --verbose</div>
                <div className="space-y-1 text-slate-400">
                  <div>Running fix...</div>
                  <div className="text-slate-300">Created backup: Component.jsx.backup</div>
                  <div className="text-blue-400">Fixed 12 hydration issues</div>
                  <div className="text-blue-400">Added 8 missing React keys</div>
                  <div className="text-blue-400">Removed 15 console.log statements</div>
                  <div className="mt-4 p-4 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-semibold mb-2">Summary:</div>
                    <div className="space-y-1 text-slate-300">
                      <div>Files Processed: <span className="text-green-400 font-semibold">47</span></div>
                      <div>Fixes Applied: <span className="text-blue-500 font-semibold">127</span></div>
                      <div>Success Rate: <span className="text-green-400 font-semibold">100%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Built for Production
            </h2>
            <p className="text-xl text-slate-400">
              Deterministic, safe, and auditable
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'AST-Based Transformations',
                description: 'Uses Babel parser to convert code into abstract syntax trees, applies pattern-based transformations, then generates syntactically correct output with preserved formatting.'
              },
              {
                title: 'Deterministic Output',
                description: 'Same input always produces identical output. No LLMs or probabilistic models. Perfect for CI/CD pipelines and easy to audit what changed.'
              },
              {
                title: 'Seven Fix Layers',
                description: 'Organized into sequential layers: configuration, patterns, components, hydration, Next.js-specific, testing, and adaptive learning. Run specific layers or all.'
              },
              {
                title: 'Automatic Backups',
                description: 'Creates timestamped backups in .neurolint-backups/ before any modifications. Restore from backups using the CLI if needed.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-slate-700 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Is it really free?',
                answer: 'Yes. All seven layers work without any API keys or payment. The authentication code was removed—it\'s just a local CLI tool now.'
              },
              {
                question: 'Will it break my code?',
                answer: 'It creates backups before making changes. Run with --dry-run first to preview what would change. The transformations are deterministic and tested, but you should review the diffs before committing.'
              },
              {
                question: 'Does it use AI or LLMs?',
                answer: 'No. It uses pattern matching and AST transformations. This makes the output predictable and avoids the hallucination problems that come with language models.'
              },
              {
                question: 'What if I disagree with a fix?',
                answer: 'You can exclude specific files or directories using config, run only certain layers, or just restore from the automatic backups if you don\'t like what it did.'
              },
              {
                question: 'How long does it take?',
                answer: 'Depends on codebase size. A medium-sized React app (50-100 files) usually takes 1-2 minutes to analyze and fix. Larger codebases take longer but still faster than manual fixes.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-slate-700 transition-all duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="install" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Start Fixing Bugs Today
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Free, open source, and ready to use in seconds
          </p>

          <div className="max-w-2xl mx-auto mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-between gap-4">
            <code className="text-green-400 font-mono text-base sm:text-lg">
              $ npm install -g @neurolint/cli
            </code>
            <button
              onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'cta')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all whitespace-nowrap"
            >
              {copiedCommand === 'cta' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-slate-400">
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M0 0v24h24V0H0zm6.168 6.18h.83v5.64h.831V6.18h.83V12h-2.49V6.18zM3.5 6.18h3.32V12H5.66V7.822H4.83v4.18H3.5V6.18zm7.665 0h3.323V12h-1.158v-4.18h-.83V12h-.831V7.822h-.83V12h-1.162V6.18h.83z"/>
              </svg>
              npm
            </a>
            <a 
              href="https://github.com/neurolint/neurolint-cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 NeuroLint. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
