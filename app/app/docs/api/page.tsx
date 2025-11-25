"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function APIPage() {
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
            <div className="layer-badge">API Reference</div>
            <h1>API Reference</h1>
            <p>Programmatic access to NeuroLint's modernization engine</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Authentication</h2>
            <p>All API requests require an API key. Provide either header:</p>
            <div className="code-block enhanced-code-block">
              <code>X-API-Key: YOUR_API_KEY</code>
            </div>
            <div className="code-block enhanced-code-block">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </div>
            <p>Get your API key from the <Link href="/dashboard" className="inline-link">dashboard</Link> after signing up.</p>
          </div>

          <div className="layer-section">
            <h2>Core Endpoints</h2>
            <div className="endpoints-grid">
              <div className="endpoint-item">
                <h3>POST /api/analyze</h3>
                <p>Analyze code for modernization opportunities</p>
                <div className="endpoint-details">
                  <div className="detail-item">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">Code analysis and issue detection</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Method:</span>
                    <span className="detail-value">POST</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Authentication:</span>
                    <span className="detail-value">Required</span>
                  </div>
                </div>
              </div>
              {/* Removed /api/fix since it's not implemented as a route */}
              <div className="endpoint-item">
                <h3>GET /api/analytics</h3>
                <p>Get project analytics and insights</p>
                <div className="endpoint-details">
                  <div className="detail-item">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">Project metrics and trends</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Method:</span>
                    <span className="detail-value">GET</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Authentication:</span>
                    <span className="detail-value">Required for advanced options</span>
                  </div>
                </div>
              </div>

              <div className="endpoint-item">
                <h3>POST /api/collaboration/sessions</h3>
                <p>Create collaborative analysis sessions</p>
                <div className="endpoint-details">
                  <div className="detail-item">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">Team collaboration</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Method:</span>
                    <span className="detail-value">POST</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Authentication:</span>
                    <span className="detail-value">Required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Example Requests</h2>
            <div className="examples-grid">
              <div className="example-item">
                <h3>Analyze Code (using X-API-Key)</h3>
                <div className="code-block enhanced-code-block">
                  <pre>{`POST /api/analyze
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "code": "const x = 1;",
  "filename": "App.tsx",
  "layers": [1, 2, 3],
  "applyFixes": false,
  "metadata": {
    "source": "api-example"
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Response Format</h2>
            <div className="response-example">
              <h3>Analysis Response</h3>
              <div className="code-block enhanced-code-block">
                <pre>{`{
  "success": true,
  "data": {
    "issues": [
      {
        "type": "configuration",
        "severity": "high",
        "message": "TypeScript target should be ES2020",
        "line": 1,
        "column": 1,
        "layer": 1
      }
    ],
    "recommendations": [
      {
        "layer": 1,
        "description": "Update TypeScript configuration",
        "priority": "high"
      }
    ],
    "metadata": {
      "filesAnalyzed": 1,
      "totalIssues": 1,
      "processingTime": "0.5s"
    }
  }
}`}</pre>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Rate Limits</h2>
            <div className="rate-limits">
              <div className="limit-item">
                <h3>Free Tier</h3>
                <p>Up to 1,000 requests/hour and 5,000/day</p>
              </div>
              <div className="limit-item">
                <h3>Premium</h3>
                <p>Up to 500 requests/hour and 2,000/day</p>
              </div>
              <div className="limit-item">
                <h3>Enterprise</h3>
                <p>Up to 2,000 requests/hour and 10,000/day</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps">
              <p>Ready to integrate NeuroLint into your workflow?</p>
              <div className="next-steps-grid">
                <Link href="/api-docs" className="next-step-card">
                  <h4>Interactive API Docs</h4>
                  <p>Explore endpoints with live examples</p>
                </Link>
                <Link href="/docs/getting-started" className="next-step-card">
                  <h4>Getting Started</h4>
                  <p>Learn the basics of API integration</p>
                </Link>
                <Link href="/dashboard" className="next-step-card">
                  <h4>Get API Key</h4>
                  <p>Sign up and get your API key</p>
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

          .inline-link {
            color: #2196f3;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .inline-link:hover {
            color: #ffffff;
          }

          .endpoints-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .endpoint-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .endpoint-item h3 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .endpoint-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .endpoint-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            border: 1px solid #000000;
          }

          .detail-label {
            color: #ff9800;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .detail-value {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8rem;
          }

          .examples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 2rem;
          }

          .example-item {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .example-item h3 {
            color: #4caf50;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .response-example {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .response-example h3 {
            color: #4caf50;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .rate-limits {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
          }

          .limit-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
          }

          .limit-item h3 {
            color: #ff9800;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .limit-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0;
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

            .endpoints-grid {
              grid-template-columns: 1fr;
            }

            .examples-grid {
              grid-template-columns: 1fr;
            }

            .rate-limits {
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