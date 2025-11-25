"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function GettingStartedPage() {
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
            <div className="layer-badge">Getting Started</div>
            <h1>Getting Started with NeuroLint</h1>
            <p>Transform your React/Next.js codebase in minutes with our 7-layer modernization engine</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Quick Start (5 minutes)</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h4>Install CLI</h4>
                <div className="code-block enhanced-code-block">
                  <code>npm install -g @neurolint/cli</code>
                </div>
              </div>
              
              <div className="step-card">
                <div className="step-number">2</div>
                <h4>Analyze Project</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze src/ --verbose</code>
                </div>
              </div>
              
              <div className="step-card">
                <div className="step-number">3</div>
                <h4>Apply Fixes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/ --layers 1,2,3 --dry-run</code>
                </div>
              </div>
              
              <div className="step-card">
                <div className="step-number">4</div>
                <h4>Commit Changes</h4>
                <div className="code-block enhanced-code-block">
                  <code>git add . && git commit -m "NeuroLint modernization"</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Installation Options</h2>
            
            <div className="install-options-grid">
              <div className="install-option">
                <h3>Command Line Interface</h3>
                <p>Full-featured CLI for automation and CI/CD integration</p>
                <div className="code-block enhanced-code-block">
                  <code>npm install -g @neurolint/cli</code>
                </div>
                <div className="code-block enhanced-code-block">
                  <code>yarn global add @neurolint/cli</code>
                </div>
                <div className="code-block enhanced-code-block">
                  <code>pnpm add -g @neurolint/cli</code>
                </div>
                <Link href="/docs/cli" className="docs-link">
                  View CLI Documentation →
                </Link>
              </div>

              <div className="install-option">
                <h3>VS Code Extension</h3>
                <p>Integrated development experience with real-time analysis</p>
                <div className="code-block enhanced-code-block">
                  <code>code --install-extension neurolint.neurolint-vscode</code>
                </div>
                <p className="install-note">Or search "NeuroLint" in VS Code Extensions marketplace</p>
              </div>

              <div className="install-option">
                <h3>Web Dashboard</h3>
                <p>Collaborative analysis with team features and reporting</p>
                <div className="code-block enhanced-code-block">
                  <code>Open <Link href="/dashboard">app.neurolint.dev</Link></code>
                </div>
                <p className="install-note">No installation required - works in any browser</p>
                <Link href="/dashboard" className="docs-link">
                  Launch Dashboard →
                </Link>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Your First Analysis</h2>
            <p>Follow this step-by-step guide to analyze and modernize your first project:</p>
            
            <div className="analysis-steps">
              <div className="analysis-step">
                <h4>Step 1: Navigate to Your Project</h4>
                <div className="code-block enhanced-code-block">
                  <code>cd /path/to/your/react-project</code>
                </div>
              </div>
              
              <div className="analysis-step">
                <h4>Step 2: Run Initial Analysis</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze src/ --output analysis.json</code>
                </div>
                <p>This creates a detailed report of modernization opportunities</p>
              </div>
              
              <div className="analysis-step">
                <h4>Step 3: Review the Report</h4>
                <div className="code-block enhanced-code-block">
                  <code>cat analysis.json</code>
                </div>
                <p>Understand what changes NeuroLint recommends for your codebase</p>
              </div>
              
              <div className="analysis-step">
                <h4>Step 4: Apply Safe Fixes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/ --layers 1,2 --dry-run</code>
                </div>
                <p>Start with configuration and pattern layers for maximum safety</p>
              </div>
              
              <div className="analysis-step">
                <h4>Step 5: Commit Your Changes</h4>
                <div className="code-block enhanced-code-block">
                  <code>git add . && git commit -m "NeuroLint: Layer 1-2 modernization"</code>
                </div>
                <p>Always commit changes before applying more advanced layers</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Understanding the 7-Layer System</h2>
            <p>NeuroLint uses a sophisticated 7-layer approach to ensure safe, incremental modernization:</p>
            
            <div className="layers-overview">
              <div className="layer-item">
                <div className="layer-number">1</div>
                <div className="layer-info">
                  <h4>Configuration</h4>
                  <p>TypeScript, Next.js, and package.json updates</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">2</div>
                <div className="layer-info">
                  <h4>Patterns</h4>
                  <p>Code patterns and best practices</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">3</div>
                <div className="layer-info">
                  <h4>Components</h4>
                  <p>React component modernization</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">4</div>
                <div className="layer-info">
                  <h4>Hydration</h4>
                  <p>SSR-safety and hydration protection</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">5</div>
                <div className="layer-info">
                  <h4>Next.js</h4>
                  <p>App Router directives and structure</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">6</div>
                <div className="layer-info">
                  <h4>Testing</h4>
                  <p>Quality and testing enhancements</p>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-number">7</div>
                <div className="layer-info">
                  <h4>Adaptive</h4>
                  <p>Adaptive pattern learning</p>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps-grid">
              <Link href="/docs/cli" className="next-step-card">
                <h4>CLI Reference</h4>
                <p>Complete command reference and options</p>
              </Link>
              
              <Link href="/docs/tutorials" className="next-step-card">
                <h4>Step-by-Step Tutorials</h4>
                <p>Practical guides for common scenarios</p>
              </Link>
              
              <Link href="/docs/layer1" className="next-step-card">
                <h4>Layer 1: Configuration</h4>
                <p>Start with configuration modernization</p>
              </Link>
              
              <Link href="/docs/faq" className="next-step-card">
                <h4>FAQ</h4>
                <p>Common questions and troubleshooting</p>
              </Link>
            </div>
          </div>

          <div className="layer-section">
            <h2>Troubleshooting</h2>
            <div className="troubleshooting-grid">
              <div className="trouble-item">
                <h4>Installation Issues</h4>
                <p>If you encounter permission errors during global installation:</p>
                <div className="code-block enhanced-code-block">
                  <code>sudo npm install -g @neurolint/cli</code>
                </div>
                <p>Or use npx for one-time execution:</p>
                <div className="code-block enhanced-code-block">
                  <code>npx @neurolint/cli analyze src/</code>
                </div>
              </div>
              
              <div className="trouble-item">
                <h4>Analysis Errors</h4>
                <p>If analysis fails, check your project structure:</p>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --verbose</code>
                </div>
                <p>Ensure you're running the command from your project root</p>
              </div>
              
              <div className="trouble-item">
                <h4>Permission Issues</h4>
                <p>For file permission errors on Unix systems:</p>
                <div className="code-block enhanced-code-block">
                  <code>chmod +x node_modules/.bin/neurolint</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 