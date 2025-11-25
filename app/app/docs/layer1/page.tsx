"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function Layer1Page() {
  const { user, signOut } = useAuth();

  return (
    <div className="docs-container">
      <div className="docs-root">
        {/* Navigation Header */}
        <header className="docs-nav-header-internal">
          <div className="docs-nav-container-internal">
            <div className="docs-nav-left-internal">
              <Link href="/" className="docs-brand-internal">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fbcdfdb608d38407b88c1584fe3705961%2F1b38a4a385ed4a0bb404148fae0ce80e?format=webp&width=800"
                  alt="NeuroLint"
                  width="32"
                  height="32"
                />
                <span>NeuroLint</span>
              </Link>
            </div>

            <nav className="docs-nav-center-internal">
              <Link href="/dashboard" className="docs-nav-link-internal">
                Dashboard
              </Link>
              <Link href="/docs" className="docs-nav-link-internal active">
                Documentation
              </Link>
              <Link href="/pricing" className="docs-nav-link-internal">
                Pricing
              </Link>
            </nav>

            <div className="docs-nav-right-internal">
              {user ? (
                <div className="docs-user-menu-internal">
                  <Link href="/dashboard" className="docs-nav-btn-internal secondary">
                    Go to Dashboard
                  </Link>
                  <button onClick={signOut} className="docs-nav-btn-internal">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="docs-auth-links-internal">
                  <Link href="/login" className="docs-nav-btn-internal secondary">
                    Sign In
                  </Link>
                  <Link href="/signup" className="docs-nav-btn-internal">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Back Navigation */}
        <div className="back-nav">
          <Link href="/docs" className="back-link">
            ← Back to Documentation
          </Link>
        </div>

        {/* Header */}
        <div className="layer-header severity-high">
          <div className="layer-header-content">
            <div className="layer-badge">Foundation Layer</div>
            <h1>Layer 1: Configuration Modernization</h1>
            <p>Modernizes TypeScript, Next.js, and package.json configurations with latest best practices</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>What Layer 1 Does</h2>
            <p>Layer 1 forms the foundation of modernization by updating core configuration files with modern settings, security enhancements, and performance optimizations. This layer ensures your project can leverage the latest tooling and compilation features.</p>
          </div>

          <div className="layer-section">
            <h2>Why It's Critical</h2>
            <div className="importance-grid">
              <div className="importance-item critical">
                <h3>Build Failures</h3>
                <p>Outdated TypeScript configurations cause compilation errors and prevent modern syntax from working</p>
              </div>
              <div className="importance-item critical">
                <h3>Security Vulnerabilities</h3>
                <p>Missing security headers expose applications to XSS, clickjacking, and other attacks</p>
              </div>
              <div className="importance-item critical">
                <h3>Tooling Incompatibility</h3>
                <p>Legacy settings prevent modern development tools, linters, and bundlers from functioning properly</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Common Fixes Applied</h2>
            <div className="fixes-grid">
              <div className="fix-category">
                <h3>TypeScript Configuration</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>"target": "es5"</code></div>
                    <div className="fix-after">After: <code>"target": "ES2020"</code></div>
                    <div className="fix-explanation">Enables modern JavaScript features and better performance</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>"strict": false</code></div>
                    <div className="fix-after">After: <code>"strict": true</code></div>
                    <div className="fix-explanation">Catches type errors and improves code quality</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Missing: <code>"downlevelIteration"</code></div>
                    <div className="fix-after">Added: <code>"downlevelIteration": true</code></div>
                    <div className="fix-explanation">Ensures proper iteration over arrays and iterables</div>
                  </div>
                </div>
              </div>

              <div className="fix-category">
                <h3>Next.js Configuration</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>experimental: {'{'} appDir: true {'}'}</code></div>
                    <div className="fix-after">After: Removed (stable in Next.js 13+)</div>
                    <div className="fix-explanation">Cleans up deprecated experimental flags</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Missing: Security headers</div>
                    <div className="fix-after">Added: CSP, X-Frame-Options, etc.</div>
                    <div className="fix-explanation">Protects against common web vulnerabilities</div>
                  </div>
                </div>
              </div>

              <div className="fix-category">
                <h3>Package.json Optimization</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>"build": "npm run build"</code></div>
                    <div className="fix-after">After: <code>"build": "next build"</code></div>
                    <div className="fix-explanation">Removes redundant script commands</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Missing: Modern script commands</div>
                    <div className="fix-after">Added: lint, type-check, analyze</div>
                    <div className="fix-explanation">Enables better development workflow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Professional Features</h2>
            <div className="tier-comparison">
              <div className="tier-item available">
                <h3>Free Tier ✓</h3>
                <div className="tier-features">
                  <div className="feature">Basic TypeScript target updates</div>
                  <div className="feature">Simple Next.js config cleanup</div>
                  <div className="feature">Package.json script optimization</div>
                </div>
              </div>
              <div className="tier-item available">
                <h3>Professional+ ✓</h3>
                <div className="tier-features">
                  <div className="feature">Advanced TypeScript configuration</div>
                  <div className="feature">Security header implementation</div>
                  <div className="feature">Performance optimization settings</div>
                  <div className="feature">AST-powered safe transformations</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Technical Implementation</h2>
            <div className="code-example">
              <h3>Example TypeScript Configuration Update</h3>
              <div className="code-block">
                <div className="code-before">
                  <span className="code-label">Before (Legacy)</span>
                  <pre>{`{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "strict": false,
    "forceConsistentCasingInFileNames": false
  }
}`}</pre>
                </div>
                <div className="code-after">
                  <span className="code-label">After (Modernized)</span>
                  <pre>{`{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES2020"],
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "downlevelIteration": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps">
              <p>After Layer 1 establishes a solid configuration foundation, your project is ready for:</p>
              <div className="next-layer-link">
                <Link href="/docs/layer2" className="next-layer-btn">
                  Continue to Layer 2: Content Cleanup →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
