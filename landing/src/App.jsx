import React, { useState } from 'react'

function App() {
  const [copiedCommand, setCopiedCommand] = useState('')

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(''), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <span className="text-xl font-semibold text-gray-900">NeuroLint</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#problems" className="text-gray-600 hover:text-gray-900">What It Fixes</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
            </div>
            <a 
              href="#install" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Install
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automatically fix React and Next.js bugs
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A command-line tool that finds and fixes common issues in React codebases. 
            Uses AST parsing and pattern matching to catch hydration errors, missing keys, 
            and hundreds of other problems before they reach production.
          </p>
          
          <div className="bg-gray-900 rounded p-4 mb-8 relative group">
            <code className="text-green-400 font-mono text-sm">
              npm install -g @neurolint/cli
            </code>
            <button
              onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'install')}
              className="absolute right-2 top-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs opacity-0 group-hover:opacity-100"
            >
              {copiedCommand === 'install' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex gap-4 mb-12">
            <span className="text-sm text-gray-600">Free and open source</span>
            <span className="text-sm text-gray-600">No API keys required</span>
            <span className="text-sm text-gray-600">Automatic backups</span>
          </div>
        </div>

        {/* Code Example */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="text-sm text-gray-500 mb-2">Before</div>
            <div className="bg-gray-900 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300"><code>{`function UserList({ users }) {
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
            <div className="text-sm text-gray-500 mb-2">After neurolint fix</div>
            <div className="bg-gray-900 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300"><code>{`function UserList({ users }) {
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
      </section>

      {/* What It Fixes */}
      <section id="problems" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">What it fixes</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hydration errors</h3>
              <p className="text-gray-600 mb-4">
                Detects direct access to window, localStorage, or document objects 
                that cause "window is not defined" crashes during server-side rendering.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Adds typeof window checks</div>
                <div>Wraps localStorage calls</div>
                <div>Guards document references</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Missing React keys</h3>
              <p className="text-gray-600 mb-4">
                Finds arrays rendered with .map() that don't have key props, 
                which causes React to show console warnings and can hurt performance.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Detects missing keys in loops</div>
                <div>Adds key=&#123;item.id&#125; automatically</div>
                <div>Handles nested iterations</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">React 19 breaking changes</h3>
              <p className="text-gray-600 mb-4">
                Updates code that uses deprecated React 19 APIs like ReactDOM.render, 
                react-dom/test-utils, and legacy context that will break when upgrading.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>ReactDOM.render → createRoot</div>
                <div>Updates test-utils imports</div>
                <div>Detects legacy Context API</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Debug code in production</h3>
              <p className="text-gray-600 mb-4">
                Removes or comments out console.log statements and other debugging 
                code that shouldn't ship to production.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Removes console.log calls</div>
                <div>Comments out debug statements</div>
                <div>Cleans up test code</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Accessibility issues</h3>
              <p className="text-gray-600 mb-4">
                Adds missing ARIA labels and alt text that accessibility audits flag, 
                helping meet WCAG compliance requirements.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Adds aria-label to buttons</div>
                <div>Requires alt text on images</div>
                <div>Checks form accessibility</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Next.js App Router</h3>
              <p className="text-gray-600 mb-4">
                Helps migrate to Next.js App Router with type-safe route parameters 
                and proper async component patterns.
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Type-safe params and searchParams</div>
                <div>Server Action error handling</div>
                <div>Metadata API setup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-2">1. Install</div>
              <div className="bg-gray-900 rounded p-3 mb-3">
                <code className="text-green-400 font-mono text-xs">
                  npm install -g @neurolint/cli
                </code>
              </div>
              <p className="text-gray-600 text-sm">
                Install the CLI globally. Works with any React or Next.js project.
              </p>
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-900 mb-2">2. Analyze</div>
              <div className="bg-gray-900 rounded p-3 mb-3">
                <code className="text-green-400 font-mono text-xs">
                  neurolint analyze src/
                </code>
              </div>
              <p className="text-gray-600 text-sm">
                Scan your codebase to see what issues exist.
              </p>
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-900 mb-2">3. Fix</div>
              <div className="bg-gray-900 rounded p-3 mb-3">
                <code className="text-green-400 font-mono text-xs">
                  neurolint fix --all-layers
                </code>
              </div>
              <p className="text-gray-600 text-sm">
                Apply fixes. Backups are created automatically.
              </p>
            </div>
          </div>

          {/* Terminal */}
          <div className="bg-gray-900 rounded p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="font-mono text-sm">
              <div className="text-green-400">$ neurolint fix src/ --all-layers --verbose</div>
              <div className="text-gray-400 mt-2">Running fix...</div>
              <div className="text-gray-300 mt-1">Created backup: Component.jsx.backup</div>
              <div className="text-gray-300">Fixed 12 hydration issues</div>
              <div className="text-gray-300">Added 8 missing React keys</div>
              <div className="text-gray-300">Removed 15 console.log statements</div>
              <div className="text-white mt-2">
                Files Processed: 47<br/>
                Fixes Applied: 127<br/>
                Success Rate: 100%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Background */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Background</h2>
          <div className="prose prose-lg">
            <p className="text-gray-700 mb-4">
              I built this while working on Taxfy.co.za. The codebase had over 700 ESLint errors—mostly 
              hydration bugs, missing React keys, and console.log statements left in production code. 
              Fixing them manually would have taken weeks.
            </p>
            <p className="text-gray-700 mb-4">
              Instead of clicking through files one by one, I wrote scripts using Babel's AST parser 
              to find and fix patterns automatically. The scripts reduced the error count from 600+ down 
              to about 70 in a few hours. Most of the remaining issues were actual logic bugs that needed 
              human judgment.
            </p>
            <p className="text-gray-700">
              NeuroLint is those scripts cleaned up and packaged as a CLI tool. It uses the same 
              approach: parse JavaScript/TypeScript into an abstract syntax tree, find problematic 
              patterns, apply deterministic transformations, and write the fixed code back to disk.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Technical approach</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AST-based transformations</h3>
              <p className="text-gray-600">
                Uses Babel parser to convert code into an abstract syntax tree, applies 
                pattern-based transformations, then generates the modified code. This ensures 
                changes are syntactically correct and preserve formatting where possible.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Deterministic output</h3>
              <p className="text-gray-600">
                Same input always produces the same output. No LLMs or probabilistic models. 
                This makes it safe for CI/CD pipelines and easier to audit what changed.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Seven fix layers</h3>
              <p className="text-gray-600">
                Fixes are organized into seven layers that run sequentially: configuration, 
                patterns, components, hydration, Next.js-specific, testing, and adaptive learning. 
                You can run specific layers or all of them.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatic backups</h3>
              <p className="text-gray-600">
                Before modifying any file, creates a timestamped backup in .neurolint-backups/. 
                You can restore from backups using the CLI if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">FAQ</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Is it really free?</h3>
              <p className="text-gray-600">
                Yes. All seven layers work without any API keys or payment. The authentication 
                code was removed—it's just a local CLI tool now.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Will it break my code?</h3>
              <p className="text-gray-600">
                It creates backups before making changes. Run with --dry-run first to preview 
                what would change. The transformations are deterministic and tested, but you 
                should review the diffs before committing.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Does it use AI or LLMs?</h3>
              <p className="text-gray-600">
                No. It uses pattern matching and AST transformations. This makes the output 
                predictable and avoids the hallucination problems that come with language models.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">What if I disagree with a fix?</h3>
              <p className="text-gray-600">
                You can exclude specific files or directories using config, run only certain 
                layers, or just restore from the automatic backups if you don't like what it did.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">How long does it take?</h3>
              <p className="text-gray-600">
                Depends on codebase size. A medium-sized React app (50-100 files) usually takes 
                1-2 minutes to analyze and fix. Larger codebases take longer but still faster 
                than manual fixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Install NeuroLint
          </h2>
          
          <div className="bg-gray-900 rounded p-6 mb-8 text-left relative group max-w-2xl mx-auto">
            <code className="text-green-400 font-mono">
              $ npm install -g @neurolint/cli
            </code>
            <button
              onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'final')}
              className="absolute right-3 top-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm opacity-0 group-hover:opacity-100"
            >
              {copiedCommand === 'final' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              View on npm
            </a>
            <a 
              href="https://github.com/neurolint/neurolint-cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded"></div>
                <span className="text-lg font-semibold text-gray-900">NeuroLint</span>
              </div>
              <p className="text-sm text-gray-600">
                Automatically fix React and Next.js bugs
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#problems" className="hover:text-gray-900">What It Fixes</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-900">How It Works</a></li>
                <li><a href="#faq" className="hover:text-gray-900">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://www.npmjs.com/package/@neurolint/cli" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">npm</a></li>
                <li><a href="https://github.com/neurolint/neurolint-cli" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">MIT License</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-sm text-gray-600 text-center">
            <p>© 2025 NeuroLint</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
