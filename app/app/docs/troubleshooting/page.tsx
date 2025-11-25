"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function TroubleshootingPage() {
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
            <div className="layer-badge">Troubleshooting</div>
            <h1>Troubleshooting Guide</h1>
            <p>Common issues and solutions for NeuroLint</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Common Issues</h2>
            <div className="issues-grid">
              <div className="issue-item">
                <h3>Syntax Error After Fix</h3>
                <p>If you encounter syntax errors after running fixes, try these steps:</p>
                <div className="solution-steps">
                  <div className="step">1. Run with <code>--dry-run</code> flag to preview changes</div>
                  <div className="step">2. Check the backup files created by NeuroLint</div>
                  <div className="step">3. Review the specific error messages</div>
                  <div className="step">4. Restore from backup if needed</div>
                </div>
              </div>
              
              <div className="issue-item">
                <h3>Critical Imports Removed</h3>
                <p>If important imports are accidentally removed:</p>
                <div className="solution-steps">
                  <div className="step">1. Check the backup files for original imports</div>
                  <div className="step">2. Manually re-add required imports</div>
                  <div className="step">3. Use <code>--verbose</code> flag for detailed logs</div>
                  <div className="step">4. Adjust include/exclude patterns in config</div>
                </div>
              </div>
              
              <div className="issue-item">
                <h3>Hydration Mismatch</h3>
                <p>Server-side rendering issues after modernization:</p>
                <div className="solution-steps">
                  <div className="step">1. Ensure client-only APIs are properly guarded</div>
                  <div className="step">2. Check for window/document usage</div>
                  <div className="step">3. Use dynamic imports for client components</div>
                  <div className="step">4. Verify Next.js configuration</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Configuration Issues</h2>
            <div className="config-issues">
              <div className="issue-item">
                <h3>False Positives</h3>
                <p>If NeuroLint reports issues that aren't actually problems:</p>
                <div className="solution-steps">
                  <div className="step">1. Disable <code>strictValidation</code> in config</div>
                  <div className="step">2. Add specific files to exclude patterns</div>
                  <div className="step">3. Use <code>--ignore-patterns</code> flag</div>
                  <div className="step">4. Review layer-specific settings</div>
                </div>
              </div>
              
              <div className="issue-item">
                <h3>Performance Issues</h3>
                <p>If analysis is slow or consumes too much memory:</p>
                <div className="solution-steps">
                  <div className="step">1. Limit include patterns to specific folders</div>
                  <div className="step">2. Run analysis on smaller file sets</div>
                  <div className="step">3. Use <code>--max-files</code> flag</div>
                  <div className="step">4. Exclude large dependency folders</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Recovery Options</h2>
            <div className="recovery-options">
              <div className="recovery-item">
                <h3>Rollback Changes</h3>
                <p>If you need to undo NeuroLint changes:</p>
                <div className="solution-steps">
                  <div className="step">1. Use NeuroLint backup files (if enabled)</div>
                  <div className="step">2. Restore from version control (git checkout)</div>
                  <div className="step">3. Use <code>--backup</code> flag for future runs</div>
                  <div className="step">4. Check backup directory for original files</div>
                </div>
              </div>
              
              <div className="recovery-item">
                <h3>Partial Fixes</h3>
                <p>Apply fixes to specific layers only:</p>
                <div className="solution-steps">
                  <div className="step">1. Use <code>--layers</code> flag to specify layers</div>
                  <div className="step">2. Run individual layers: <code>neurolint layer1</code></div>
                  <div className="step">3. Test each layer before proceeding</div>
                  <div className="step">4. Use <code>--dry-run</code> for safety</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Getting Help</h2>
            <div className="help-options">
              <div className="help-item">
                <h3>Documentation</h3>
                <p>Check the comprehensive documentation for detailed guides and examples.</p>
                <Link href="/docs" className="help-link">View Documentation →</Link>
              </div>
              
              <div className="help-item">
                <h3>FAQ</h3>
                <p>Browse frequently asked questions for quick solutions.</p>
                <Link href="/docs/faq" className="help-link">View FAQ →</Link>
              </div>
              
              <div className="help-item">
                <h3>Support</h3>
                <p>Contact support for complex issues or feature requests.</p>
                <Link href="/dashboard" className="help-link">Open Dashboard →</Link>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .docs-container {
            min-height: 100vh;
            background: radial-gradient(ellipse at top, rgba(120, 119, 198, 0.3), transparent),
                        radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.1), transparent);
          }

          .docs-nav-header-internal {
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.15) 0%,
              rgba(255, 255, 255, 0.08) 50%,
              rgba(255, 255, 255, 0.05) 100%
            );
            border-bottom: 2px solid #000000;
            backdrop-filter: blur(10px);
            margin: -2rem -2rem 2rem -2rem;
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .docs-nav-container-internal {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          .docs-nav-left-internal {
            display: flex;
            align-items: center;
          }

          .docs-brand-internal {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: #ffffff;
            font-weight: 600;
            font-size: 1.25rem;
          }

          .docs-nav-center-internal {
            display: flex;
            gap: 2rem;
          }

          .docs-nav-link-internal {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            border: 1px solid transparent;
          }

          .docs-nav-link-internal:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
            border-color: #000000;
          }

          .docs-nav-link-internal.active {
            color: #2196f3;
            background: rgba(33, 150, 243, 0.15);
            border-color: #000000;
          }

          .docs-nav-right-internal {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .docs-user-menu-internal,
          .docs-auth-links-internal {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .docs-nav-btn-internal {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: 2px solid #000000;
            background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.2) 0%,
              rgba(33, 150, 243, 0.15) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            color: #ffffff;
            text-decoration: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
          }

          .docs-nav-btn-internal.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
          }

          .docs-nav-btn-internal:hover {
            transform: translateY(-2px);
            background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.3) 0%,
              rgba(33, 150, 243, 0.25) 50%,
              rgba(255, 255, 255, 0.15) 100%
            );
          }

          .docs-root {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .back-nav {
            margin-bottom: 2rem;
          }

          .back-link {
            color: #2196f3;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .back-link:hover {
            color: #ffffff;
            transform: translateX(-4px);
          }

          .layer-header {
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%);
            border: 2px solid #000000;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }

          .layer-badge {
            display: inline-block;
            background: rgba(255, 152, 0, 0.2);
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 1rem;
            border: 1px solid #000000;
          }

          .layer-header h1 {
            color: #ffffff;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 1rem 0;
          }

          .layer-header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            margin: 0;
            max-width: 600px;
            margin: 0 auto;
          }

          .layer-content {
            display: flex;
            flex-direction: column;
            gap: 3rem;
          }

          .layer-section {
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.08) 0%,
              rgba(255, 255, 255, 0.04) 50%,
              rgba(255, 255, 255, 0.02) 100%
            );
            border: 2px solid #000000;
            border-radius: 16px;
            padding: 2rem;
          }

          .layer-section h2 {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0 0 1.5rem 0;
          }

          .layer-section h3 {
            color: #ffffff;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .layer-section p {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            margin: 0 0 1rem 0;
          }

          .issues-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
          }

          .issue-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .issue-item h3 {
            color: #f44336;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .issue-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .solution-steps {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .step {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border: 1px solid #000000;
          }

          .step code {
            color: #4caf50;
            font-family: monospace;
            font-size: 0.8rem;
          }

          .config-issues {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .recovery-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .recovery-item {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .recovery-item h3 {
            color: #ff9800;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .help-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .help-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
          }

          .help-item h3 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .help-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .help-link {
            color: #4caf50;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .help-link:hover {
            color: #ffffff;
          }

          @media (max-width: 1024px) {
            .docs-nav-center-internal {
              display: none;
            }
          }

          @media (max-width: 768px) {
            .docs-root {
              padding: 1rem;
            }

            .layer-header {
              padding: 1.5rem;
            }

            .layer-header h1 {
              font-size: 2rem;
            }

            .issues-grid,
            .config-issues,
            .recovery-options {
              grid-template-columns: 1fr;
            }

            .help-options {
              grid-template-columns: 1fr;
            }

            .layer-section {
              padding: 1.5rem;
            }

            .docs-nav-right-internal .docs-auth-links-internal,
            .docs-nav-right-internal .docs-user-menu-internal {
              flex-direction: column;
              gap: 0.5rem;
            }

            .docs-nav-btn-internal {
              padding: 0.4rem 0.8rem;
              font-size: 0.85rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
} 