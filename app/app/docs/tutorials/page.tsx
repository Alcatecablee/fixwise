"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function TutorialsPage() {
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
            <div className="layer-badge">Tutorials</div>
            <h1>Step-by-Step Tutorials</h1>
            <p>Practical guides for common React/Next.js modernization scenarios</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Tutorial 1: First Project Analysis</h2>
            <p>Learn how to analyze your first React/Next.js project with NeuroLint:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Install NeuroLint CLI</h4>
                <div className="code-block enhanced-code-block">
                  <code>npm install -g @neurolint/cli</code>
                </div>
                <p>Install the CLI globally to access all commands</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Navigate to Your Project</h4>
                <div className="code-block enhanced-code-block">
                  <code>cd /path/to/your/react-project</code>
                </div>
                <p>Make sure you're in the root directory of your project</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Run Initial Analysis</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze src/ --verbose</code>
                </div>
                <p>This will scan your codebase and identify modernization opportunities</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Review the Results</h4>
                <p>NeuroLint will show you:</p>
                <ul>
                  <li>Files analyzed and their status</li>
                  <li>Modernization opportunities by layer</li>
                  <li>Estimated impact of changes</li>
                  <li>Safety recommendations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Tutorial 2: Safe Configuration Updates</h2>
            <p>Update your TypeScript and Next.js configurations safely:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Backup Your Project</h4>
                <div className="code-block enhanced-code-block">
                  <code>git add . && git commit -m "Backup before NeuroLint changes"</code>
                </div>
                <p>Always commit your current state before making changes</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Preview Configuration Changes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/ --layers 1,2 --dry-run</code>
                </div>
                <p>See what changes will be made without applying them</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Apply Safe Configuration Updates</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/ --layers 1,2</code>
                </div>
                <p>Apply configuration and pattern layer fixes</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Test Your Application</h4>
                <div className="code-block enhanced-code-block">
                  <code>npm run build && npm run dev</code>
                </div>
                <p>Ensure everything still works correctly</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Tutorial 3: Component Modernization</h2>
            <p>Modernize your React components with best practices:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Analyze Component Issues</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze src/components/ --layers 3 --verbose</code>
                </div>
                <p>Focus on component-specific modernization opportunities</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Preview Component Changes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/components/ --layers 3 --dry-run</code>
                </div>
                <p>Review the component modernization changes</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Apply Component Fixes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/components/ --layers 3 --backup</code>
                </div>
                <p>Apply component modernization with automatic backups</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Verify Component Functionality</h4>
                <div className="code-block enhanced-code-block">
                  <code>npm run test && npm run build</code>
                </div>
                <p>Run tests and build to ensure components work correctly</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Tutorial 4: Next.js App Router Migration</h2>
            <p>Migrate from Pages Router to App Router safely:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Check Current Router Usage</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --layers 5 --verbose</code>
                </div>
                <p>Identify Pages Router patterns and App Router opportunities</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Create Migration Plan</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --layers 5 --output migration-plan.json</code>
                </div>
                <p>Generate a detailed migration plan</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Apply App Router Changes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix . --layers 5 --backup</code>
                </div>
                <p>Apply App Router modernization with backups</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Update Dependencies</h4>
                <div className="code-block enhanced-code-block">
                  <code>npm install next@latest react@latest react-dom@latest</code>
                </div>
                <p>Update to the latest Next.js and React versions</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Tutorial 5: Team Collaboration Setup</h2>
            <p>Set up NeuroLint for team collaboration:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Create Team Configuration</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint init-config --team</code>
                </div>
                <p>Generate team-specific configuration</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Set Up Shared Rules</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint rules --export team-rules.json</code>
                </div>
                <p>Export current rules for team sharing</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Configure CI/CD Integration</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --format json --output neurolint-report.json</code>
                </div>
                <p>Generate reports for CI/CD pipelines</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Set Up Pre-commit Hooks</h4>
                <div className="code-block enhanced-code-block">
                  <code>npx husky add .husky/pre-commit "neurolint analyze . --layers 1,2"</code>
                </div>
                <p>Automate analysis in your development workflow</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Tutorial 6: CI/CD Integration</h2>
            <p>Integrate NeuroLint into your CI/CD pipeline:</p>
            
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <h4>Step 1: Create GitHub Actions Workflow</h4>
                <div className="code-block enhanced-code-block">
                  <code>mkdir -p .github/workflows</code>
                </div>
                <p>Set up GitHub Actions directory structure</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 2: Configure NeuroLint Action</h4>
                <p>Create <code>.github/workflows/neurolint.yml</code>:</p>
                <div className="code-block enhanced-code-block">
                  <code>{`name: NeuroLint Analysis
on: [push, pull_request]
jobs:
  neurolint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @neurolint/cli
      - run: neurolint analyze . --format json --output neurolint-report.json
      - uses: actions/upload-artifact@v3
        with:
          name: neurolint-report
          path: neurolint-report.json`}</code>
                </div>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 3: Set Up Automated Fixes</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix . --layers 1,2 --no-backup</code>
                </div>
                <p>Apply safe fixes in CI environment</p>
              </div>
              
              <div className="tutorial-step">
                <h4>Step 4: Configure Notifications</h4>
                <p>Set up Slack or email notifications for analysis results</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Best Practices</h2>
            <div className="best-practices-grid">
              <div className="practice-item">
                <h4>Always Use Dry Run First</h4>
                <p>Preview changes before applying them to understand the impact</p>
              </div>
              
              <div className="practice-item">
                <h4>Commit Frequently</h4>
                <p>Commit your changes after each layer to maintain a clear history</p>
              </div>
              
              <div className="practice-item">
                <h4>Test Thoroughly</h4>
                <p>Run tests and builds after each modernization step</p>
              </div>
              
              <div className="practice-item">
                <h4>Use Layer Progression</h4>
                <p>Apply layers sequentially (1→2→3→4→5→6→7) for best results</p>
              </div>
              
              <div className="practice-item">
                <h4>Backup Important Files</h4>
                <p>Use the --backup flag for critical files and configurations</p>
              </div>
              
              <div className="practice-item">
                <h4>Review Changes</h4>
                <p>Always review the generated code before committing</p>
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
              
              <Link href="/docs/layer1" className="next-step-card">
                <h4>Layer 1: Configuration</h4>
                <p>Start with configuration modernization</p>
              </Link>
              
              <Link href="/docs/faq" className="next-step-card">
                <h4>FAQ</h4>
                <p>Common questions and troubleshooting</p>
              </Link>
              
              <Link href="/dashboard" className="next-step-card">
                <h4>Web Dashboard</h4>
                <p>Use the web interface for visual analysis</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 