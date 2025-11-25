"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function InstallationPage() {
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
            <div className="layer-badge">Installation</div>
            <h1>Installation & Setup</h1>
            <p>Get NeuroLint up and running in your development environment</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Requirements</h2>
            <div className="requirements-grid">
              <div className="requirement-item">
                <h3>Node.js</h3>
                <p>Version 18 or higher required for modern JavaScript features</p>
                <div className="code-block">
                  <code>node --version</code>
                </div>
              </div>
              
              <div className="requirement-item">
                <h3>Package Manager</h3>
                <p>npm, yarn, or pnpm for installing the CLI tool</p>
                <div className="code-block">
                  <code>npm --version</code>
                </div>
              </div>
              
              <div className="requirement-item">
                <h3>Project Type</h3>
                <p>React or Next.js codebase with TypeScript/JavaScript files</p>
                <div className="code-block">
                  <code>package.json with react/next dependencies</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Installation Methods</h2>
            <div className="installation-methods">
              <div className="method-card">
                <h3>Global Installation (Recommended)</h3>
                <p>Install NeuroLint CLI globally for use across all projects</p>
                <div className="code-block enhanced-code-block">
                  <code>npm install -g @neurolint/cli</code>
                </div>
                <div className="method-features">
                  <div className="feature">Available from any directory</div>
                  <div className="feature">Works with any React/Next.js project</div>
                  <div className="feature">Easy to update globally</div>
                </div>
              </div>
              
              <div className="method-card">
                <h3>Local Installation</h3>
                <p>Install as a dev dependency in your project</p>
                <div className="code-block enhanced-code-block">
                  <code>npm install --save-dev @neurolint/cli</code>
                </div>
                <div className="method-features">
                  <div className="feature">Project-specific version control</div>
                  <div className="feature">Team consistency</div>
                  <div className="feature">CI/CD integration ready</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Configuration</h2>
            <div className="config-section">
              <h3>Create Configuration File</h3>
              <p>Create a <code>.neurolintrc</code> file in your project root:</p>
              <div className="code-block enhanced-code-block">
                <pre>{`{
  "enabledLayers": [1, 2, 3, 4, 5, 6, 7],
  "include": ["**/*.{ts,tsx,js,jsx,json}"],
  "exclude": ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  "verbose": false,
  "backup": true,
  "format": "console",
  "strictValidation": true
}`}</pre>
              </div>
              
              <div className="config-options">
                <div className="option-item">
                  <h4>enabledLayers</h4>
                  <p>Array of layer numbers to enable (1-7)</p>
                </div>
                <div className="option-item">
                  <h4>include</h4>
                  <p>Glob patterns for files to analyze</p>
                </div>
                <div className="option-item">
                  <h4>exclude</h4>
                  <p>Glob patterns for files to ignore</p>
                </div>
                <div className="option-item">
                  <h4>verbose</h4>
                  <p>Enable detailed logging output</p>
                </div>
                <div className="option-item">
                  <h4>backup</h4>
                  <p>Create backups before applying fixes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Verification</h2>
            <div className="verification-steps">
              <div className="step-item">
                <h3>1. Check Installation</h3>
                <div className="code-block">
                  <code>neurolint --version</code>
                </div>
              </div>
              
              <div className="step-item">
                <h3>2. Test Analysis</h3>
                <div className="code-block">
                  <code>neurolint analyze src/ --verbose</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps">
              <p>Now that NeuroLint is installed, you can:</p>
              <div className="next-steps-grid">
                <Link href="/docs/getting-started" className="next-step-card">
                  <h4>Getting Started</h4>
                  <p>Run your first analysis and apply fixes</p>
                </Link>
                <Link href="/docs/configuration" className="next-step-card">
                  <h4>Configuration</h4>
                  <p>Customize settings for your project</p>
                </Link>
                <Link href="/docs/cli" className="next-step-card">
                  <h4>CLI Reference</h4>
                  <p>Learn all available commands</p>
                </Link>
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

          .requirements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .requirement-item {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .requirement-item h3 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .requirement-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .installation-methods {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .method-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .method-card h3 {
            color: #4caf50;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .method-card p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .method-features {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;
          }

          .feature {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border: 1px solid #000000;
          }

          .config-section h3 {
            color: #ffffff;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .config-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .option-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 8px;
            padding: 1rem;
          }

          .option-item h4 {
            color: #ff9800;
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .option-item p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            margin: 0;
          }

          .verification-steps {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .step-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .step-item h3 {
            color: #4caf50;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .code-block {
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #000000;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }

          .enhanced-code-block {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #000000;
          }

          .code-block code,
          .code-block pre {
            margin: 0;
            font-family: monospace;
            font-size: 0.9rem;
            line-height: 1.4;
            color: rgba(255, 255, 255, 0.9);
            overflow-x: auto;
          }

          .next-steps {
            text-align: center;
          }

          .next-steps p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
          }

          .next-steps-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
          }

          .next-step-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            color: #ffffff;
            transition: all 0.3s ease;
          }

          .next-step-card:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
          }

          .next-step-card h4 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .next-step-card p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0;
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

            .requirements-grid {
              grid-template-columns: 1fr;
            }

            .installation-methods {
              grid-template-columns: 1fr;
            }

            .config-options {
              grid-template-columns: 1fr;
            }

            .next-steps-grid {
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