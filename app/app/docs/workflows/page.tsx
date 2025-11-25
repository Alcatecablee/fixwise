"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function WorkflowsPage() {
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
            <div className="layer-badge">Usage Guide</div>
            <h1>Workflows</h1>
            <p>Recommended usage patterns and integrations for individuals and teams</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Development Workflows</h2>
            
            <h3>Pre-commit Hook</h3>
            <p>Automatically check code quality before commits:</p>
            <pre className="code-block">
{`"husky": {
  "hooks": {
    "pre-commit": "neurolint fix src/ --layers 2,3 --dry-run || exit 1"
  }
}`}
            </pre>

            <h3>CI/CD Pipeline</h3>
            <p>Integrate NeuroLint into your continuous integration:</p>
            <pre className="code-block">
{`neurolint analyze src/ --format=json --output=analysis.json
neurolint fix src/ --layers 1,2,5`}
            </pre>

            <h2>Team Collaboration</h2>
            
            <h3>GitHub Integration</h3>
            <p>Use repository scan endpoints and status checks to gate merges. Connect your GitHub repositories to automatically scan pull requests and maintain code quality standards.</p>
            
            <h3>Team Collaboration</h3>
            <p>Share analysis results and run collaborative fixes in sessions. Multiple team members can work together on code modernization tasks with real-time collaboration features.</p>
          </div>
        </div>
      </div>
    </div>
  );
}