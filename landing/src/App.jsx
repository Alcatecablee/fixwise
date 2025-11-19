import React, { useState } from 'react'

function App() {
  const [copiedCommand, setCopiedCommand] = useState('')

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(''), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">NeuroLint</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#problems" className="text-gray-600 hover:text-gray-900">Problems We Fix</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
            </div>
            <a 
              href="#install" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Fix React & Next.js Bugs<br />
            <span className="text-gradient">Before They Ship</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Deterministic code transformation tool that automatically fixes hydration errors, 
            missing keys, and 600+ common issues. <span className="font-semibold">No AI. No guesswork. Just working code.</span>
          </p>
          
          {/* Command */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-900 rounded-lg p-4 text-left relative group">
              <code className="text-green-400 font-mono text-sm">
                $ npm install -g @neurolint/cli
              </code>
              <button
                onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'install')}
                className="absolute right-2 top-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedCommand === 'install' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#install" 
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Install Now - It's Free
            </a>
            <a 
              href="#how-it-works" 
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-lg hover:border-gray-400 transition-colors font-semibold text-lg"
            >
              See How It Works
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No API Keys Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Automatic Backups</span>
            </div>
          </div>
        </div>

        {/* Before/After Code Example */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Before</span>
              <span className="text-gray-500 text-sm">Crashes in production</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300"><code>{`function ThemeToggle() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme')
  )
  
  return (
    <div>
      {items.map(item => 
        <div>{item}</div>
      )}
    </div>
  )
}`}</code></pre>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">After</span>
              <span className="text-gray-500 text-sm">Production ready</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300"><code>{`function ThemeToggle() {
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' 
      ? localStorage.getItem('theme')
      : 'light'
  )
  
  return (
    <div>
      {items.map(item => 
        <div key={item.id}>{item}</div>
      )}
    </div>
  )
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Stop These Production Disasters</h2>
            <p className="text-xl text-gray-600">The bugs that keep you up at 2am, automatically fixed</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Problem 1 */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hydration Crashes</h3>
              <p className="text-gray-600 mb-4">
                "window is not defined" errors killing your SSR app? We automatically add guards.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Auto-add typeof window checks<br/>
                ✅ Fix localStorage SSR issues<br/>
                ✅ Prevent hydration mismatches
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Missing React Keys</h3>
              <p className="text-gray-600 mb-4">
                Console flooded with "key" warnings? We find and fix every single one.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Auto-add keys to .map() loops<br/>
                ✅ Detect duplicate keys<br/>
                ✅ Fix nested iterations
              </div>
            </div>

            {/* Problem 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">React 19 Migration</h3>
              <p className="text-gray-600 mb-4">
                Breaking changes blocking your upgrade? Migrate in hours, not weeks.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Convert ReactDOM APIs<br/>
                ✅ Update forwardRef patterns<br/>
                ✅ Fix legacy Context API
              </div>
            </div>

            {/* Problem 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">600+ ESLint Errors</h3>
              <p className="text-gray-600 mb-4">
                Runaway tech debt blocking deploys? We clean it up automatically.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Remove console.logs<br/>
                ✅ Fix deprecated patterns<br/>
                ✅ Enforce best practices
              </div>
            </div>

            {/* Problem 5 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accessibility Gaps</h3>
              <p className="text-gray-600 mb-4">
                Failing WCAG audits? We add missing alt text and ARIA labels.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Add aria-label attributes<br/>
                ✅ Enforce alt text on images<br/>
                ✅ Fix button accessibility
              </div>
            </div>

            {/* Problem 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Next.js App Router</h3>
              <p className="text-gray-600 mb-4">
                Struggling with App Router migration? We handle the complex stuff.
              </p>
              <div className="bg-white rounded p-3 text-sm font-mono text-gray-700">
                ✅ Type-safe routing setup<br/>
                ✅ Server Action optimization<br/>
                ✅ Metadata API fixes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How NeuroLint Works</h2>
            <p className="text-xl text-gray-600">Three commands. Hundreds of fixes. Zero manual work.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Install</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 relative group">
                <code className="text-green-400 font-mono text-sm">
                  npm install -g @neurolint/cli
                </code>
              </div>
              <p className="text-gray-600">One command to install globally. Works with any React or Next.js project.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyze</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <code className="text-green-400 font-mono text-sm">
                  neurolint analyze src/
                </code>
              </div>
              <p className="text-gray-600">Scan your codebase and see exactly what issues we found.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Fix</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <code className="text-green-400 font-mono text-sm">
                  neurolint fix --all-layers
                </code>
              </div>
              <p className="text-gray-600">Automatically fix everything. Backups created automatically.</p>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-gray-400 text-sm">Terminal</span>
            </div>
            <div className="font-mono text-sm">
              <div className="text-green-400">$ neurolint fix src/ --all-layers --verbose</div>
              <div className="text-gray-400 mt-2">Running fix......</div>
              <div className="text-blue-400 mt-1">✅ Created backup: Component.jsx.backup</div>
              <div className="text-green-400 mt-1">✅ Fixed 12 hydration issues</div>
              <div className="text-green-400">✅ Added 8 missing React keys</div>
              <div className="text-green-400">✅ Removed 15 console.log statements</div>
              <div className="text-green-400">✅ Added 6 accessibility attributes</div>
              <div className="text-white mt-2">
                [FIX SUMMARY]<br/>
                <span className="text-gray-400">  Files Processed: 47</span><br/>
                <span className="text-gray-400">  Fixes Applied: 127</span><br/>
                <span className="text-gray-400">  Success Rate: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Real Production Crises</h2>
            <p className="text-xl text-gray-600">Born from fixing 600+ ESLint errors on Taxfy.co.za</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">600+</div>
              <div className="text-gray-600">ESLint errors reduced to 70 in one session</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-gray-600">Deterministic - same input, same output</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">7</div>
              <div className="text-gray-600">Transformation layers working together</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 border border-blue-100">
            <div className="max-w-3xl mx-auto">
              <svg className="w-12 h-12 text-blue-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <blockquote className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed">
                "Instead of manually fixing hundreds of hydration bugs and missing React keys, 
                I built NeuroLint. What took weeks now takes minutes. The deterministic approach 
                means it's audit-friendly and safe for production codebases."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full"></div>
                <div>
                  <div className="font-bold text-gray-900">NeuroLint Team</div>
                  <div className="text-gray-600">Creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why NeuroLint */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose NeuroLint?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Deterministic & Safe</h3>
              <p className="text-gray-600">
                No AI guesswork. Same input always produces the same output. 
                Perfect for audit requirements and enterprise codebases. Automatic 
                backups before every change.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">100% Free</h3>
              <p className="text-gray-600">
                All 7 transformation layers are completely free. No API keys, 
                no subscriptions, no hidden costs. Open source and ready to use.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Battle-Tested</h3>
              <p className="text-gray-600">
                Born from real production crises. Reduced 600+ errors to 70 on 
                Taxfy.co.za. Every fix is based on real-world patterns that 
                actually break production apps.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Adaptive Learning</h3>
              <p className="text-gray-600">
                Layer 7 learns from your codebase patterns and applies them 
                automatically. Never repeat the same fix twice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Is NeuroLint really free?</h3>
              <p className="text-gray-600">
                Yes, completely free. All 7 layers are available without any API keys, 
                subscriptions, or hidden costs. We removed all payment gates.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Will it break my code?</h3>
              <p className="text-gray-600">
                NeuroLint creates automatic backups before making any changes. You can 
                always use --dry-run to preview changes first. Every transformation is 
                deterministic and tested.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Does it use AI?</h3>
              <p className="text-gray-600">
                No. NeuroLint uses deterministic, rule-based transformations. This makes 
                it predictable, audit-friendly, and safe for production codebases.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">What frameworks are supported?</h3>
              <p className="text-gray-600">
                React, Next.js (App Router & Pages Router), TypeScript, and JavaScript. 
                Works with any React-based framework.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">How long does it take?</h3>
              <p className="text-gray-600">
                Analyzing a medium-sized codebase takes seconds. Fixing hundreds of 
                issues typically takes 1-2 minutes. Much faster than manual fixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="install" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Shipping Bugs. Start Using NeuroLint.
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join developers who've fixed thousands of production issues automatically
          </p>

          {/* Install Command */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-900 rounded-lg p-6 text-left relative group">
              <code className="text-green-400 font-mono">
                $ npm install -g @neurolint/cli
              </code>
              <button
                onClick={() => copyToClipboard('npm install -g @neurolint/cli', 'final')}
                className="absolute right-3 top-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedCommand === 'final' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              View on npm
            </a>
            <a 
              href="https://github.com/neurolint/neurolint-cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold text-lg"
            >
              View on GitHub
            </a>
          </div>

          <p className="text-blue-100 text-sm">
            Free forever • No API keys • Automatic backups
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                <span className="text-xl font-bold text-white">NeuroLint</span>
              </div>
              <p className="text-sm">
                Fix React & Next.js bugs automatically. Deterministic code transformation tool.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#problems" className="hover:text-white transition-colors">Problems We Fix</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://www.npmjs.com/package/@neurolint/cli" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">npm Package</a></li>
                <li><a href="https://github.com/neurolint/neurolint-cli" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MIT License</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2025 NeuroLint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
