"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function ConfigurationPage() {
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
            <div className="layer-badge">Configuration</div>
            <h1>Configuration</h1>
            <p>Customize NeuroLint behavior with configuration files and options</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Configuration File</h2>
            <p>Create a <code>.neurolintrc</code> file in your project root to control NeuroLint's behavior.</p>
            
            <div className="config-example">
              <h3>Basic Configuration</h3>
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
            </div>
          </div>

          <div className="layer-section">
            <h2>Configuration Options</h2>
            <div className="config-options-grid">
              <div className="config-option">
                <h3>enabledLayers</h3>
                <p>Array of layer numbers to enable (1-7)</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>[1, 2, 3, 4, 5, 6, 7]</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>include</h3>
                <p>Glob patterns for files to analyze</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json"]</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>exclude</h3>
                <p>Glob patterns for files to ignore</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>["**/node_modules/**", "**/dist/**"]</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>verbose</h3>
                <p>Enable detailed logging output</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>true</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>backup</h3>
                <p>Create backups before applying fixes</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>true</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>format</h3>
                <p>Output format for analysis results</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>"console" | "json" | "markdown"</code>
                </div>
              </div>
              
              <div className="config-option">
                <h3>strictValidation</h3>
                <p>Enable strict validation mode</p>
                <div className="option-example">
                  <span className="option-label">Example:</span>
                  <code>true</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Advanced Configuration</h2>
            <div className="advanced-config">
              <h3>Layer-Specific Settings</h3>
              <p>Configure specific behavior for individual layers:</p>
              <div className="code-block enhanced-code-block">
                <pre>{`{
  "enabledLayers": [1, 2, 3, 4, 5, 6, 7],
  "layerSettings": {
    "layer1": {
      "typescriptTarget": "ES2020",
      "strictMode": true
    },
    "layer2": {
      "removeUnusedImports": true,
      "fixHtmlEntities": true
    },
    "layer3": {
      "addMissingKeys": true,
      "improveAccessibility": true
    }
  }
}`}</pre>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Environment Variables</h2>
            <div className="env-vars">
              <div className="env-var">
                <h3>NEUROLINT_API_KEY</h3>
                <p>Your API key for premium features and fixes</p>
                <div className="code-block">
                  <code>export NEUROLINT_API_KEY="your-api-key-here"</code>
                </div>
              </div>
              
              <div className="env-var">
                <h3>NEUROLINT_CONFIG_PATH</h3>
                <p>Custom path to configuration file</p>
                <div className="code-block">
                  <code>export NEUROLINT_CONFIG_PATH="./.neurolintrc"</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps">
              <p>Now that you understand configuration, you can:</p>
              <div className="next-steps-grid">
                <Link href="/docs/getting-started" className="next-step-card">
                  <h4>Getting Started</h4>
                  <p>Run your first analysis with custom configuration</p>
                </Link>
                <Link href="/docs/cli" className="next-step-card">
                  <h4>CLI Reference</h4>
                  <p>Learn command-line options and flags</p>
                </Link>
                <Link href="/docs/layers" className="next-step-card">
                  <h4>Layers Overview</h4>
                  <p>Understand what each layer does</p>
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

          .config-example {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 1rem;
          }

          .config-options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1.5rem;
          }

          .config-option {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .config-option h3 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .config-option p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .option-example {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #000000;
            border-radius: 8px;
            padding: 0.75rem;
          }

          .option-label {
            color: #ff9800;
            font-size: 0.8rem;
            font-weight: 600;
            margin-right: 0.5rem;
          }

          .option-example code {
            color: #4caf50;
            font-family: monospace;
            font-size: 0.85rem;
          }

          .advanced-config {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .env-vars {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .env-var {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .env-var h3 {
            color: #4caf50;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .env-var p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
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

            .config-options-grid {
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