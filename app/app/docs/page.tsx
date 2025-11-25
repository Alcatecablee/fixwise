"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import StructuredData from "../../components/StructuredData";

export default function DocsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="docs-container">
      <StructuredData type="website" />

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

        {/* Header */}
        <div className="layer-header severity-high">
          <div className="layer-header-content">
            <div className="layer-badge">Documentation</div>
            <h1>NeuroLint Documentation</h1>
            <p>Everything you need to modernize React/Next.js codebases with confidence</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Quick Start</h2>
            <div className="quick-actions-grid">
              <Link href="/docs/getting-started" className="action-card primary">
                <div className="action-icon">QS</div>
                <div className="action-content">
                  <h4>Getting Started</h4>
                  <p>Install, configure, and run your first analysis</p>
                </div>
              </Link>
              <Link href="/docs/cli" className="action-card secondary">
                <div className="action-icon">CLI</div>
                <div className="action-content">
                  <h4>CLI Guide</h4>
                  <p>Full command reference with examples</p>
                </div>
              </Link>
              <Link href="/docs/layers" className="action-card warning">
                <div className="action-icon">LY</div>
                <div className="action-content">
                  <h4>Layers</h4>
                  <p>7-layer modernization system explained</p>
                </div>
              </Link>
              <Link href="/docs/api" className="action-card primary">
                <div className="action-icon">API</div>
                <div className="action-content">
                  <h4>API Reference</h4>
                  <p>Programmatic access and integration</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="layer-section">
            <h2>Core Concepts</h2>
            <div className="concepts-grid">
              <div className="concept-card">
                <h3>7-Layer System</h3>
                <p>Our systematic approach to modernizing React/Next.js applications through progressive transformations.</p>
                <div className="layer-links">
                  <Link href="/docs/layer1" className="layer-link">Layer 1: Configuration</Link>
                  <Link href="/docs/layer2" className="layer-link">Layer 2: Patterns</Link>
                  <Link href="/docs/layer3" className="layer-link">Layer 3: Components</Link>
                  <Link href="/docs/layer4" className="layer-link">Layer 4: Hydration</Link>
                  <Link href="/docs/layer5" className="layer-link">Layer 5: Next.js</Link>
                  <Link href="/docs/layer6" className="layer-link">Layer 6: Testing</Link>
                  <Link href="/docs/layer7" className="layer-link">Layer 7: Adaptive</Link>
                </div>
              </div>
              
              <div className="concept-card">
                <h3>Installation & Setup</h3>
                <p>Get NeuroLint up and running in your development environment.</p>
                <div className="setup-links">
                  <Link href="/docs/installation" className="setup-link">Installation Guide</Link>
                  <Link href="/docs/configuration" className="setup-link">Configuration</Link>
                  <Link href="/docs/getting-started" className="setup-link">Quick Start</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Usage Guides</h2>
            <div className="guides-grid">
              <div className="guide-card">
                <h3>CLI Usage</h3>
                <p>Command-line interface for analyzing and modernizing codebases.</p>
                <Link href="/docs/cli" className="guide-link">CLI Documentation →</Link>
              </div>
              
              <div className="guide-card">
                <h3>API Integration</h3>
                <p>Programmatic access to NeuroLint's modernization engine.</p>
                <Link href="/docs/api" className="guide-link">API Reference →</Link>
              </div>
              
              <div className="guide-card">
                <h3>Workflows</h3>
                <p>Best practices and common workflows for different project types.</p>
                <Link href="/docs/workflows" className="guide-link">Workflow Guide →</Link>
              </div>
              
              <div className="guide-card">
                <h3>Tutorials</h3>
                <p>Step-by-step tutorials for specific modernization scenarios.</p>
                <Link href="/docs/tutorials" className="guide-link">Tutorials →</Link>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Support & Resources</h2>
            <div className="support-grid">
              <div className="support-card">
                <h3>Troubleshooting</h3>
                <p>Common issues and their solutions.</p>
                <Link href="/docs/troubleshooting" className="support-link">Troubleshooting Guide →</Link>
              </div>
              
              <div className="support-card">
                <h3>FAQ</h3>
                <p>Frequently asked questions and answers.</p>
                <Link href="/docs/faq" className="support-link">FAQ →</Link>
              </div>
              
              <div className="support-card">
                <h3>API Documentation</h3>
                <p>Interactive API documentation and examples.</p>
                <Link href="/api-docs" className="support-link">API Docs →</Link>
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

          .quick-actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
          }

          .action-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            color: #ffffff;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .action-card:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
          }

          .action-card.primary {
            border-color: #2196f3;
          }

          .action-card.secondary {
            border-color: #4caf50;
          }

          .action-card.warning {
            border-color: #ff9800;
          }

          .action-icon {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #000000;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
          }

          .action-content h4 {
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .action-content p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0;
          }

          .concepts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
          }

          .concept-card {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .concept-card h3 {
            color: #2196f3;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .concept-card p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 1rem 0;
            line-height: 1.6;
          }

          .layer-links,
          .setup-links {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .layer-link,
          .setup-link {
            color: #4caf50;
            text-decoration: none;
            font-size: 0.9rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border: 1px solid #000000;
            transition: all 0.3s ease;
          }

          .layer-link:hover,
          .setup-link:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }

          .guides-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .guide-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .guide-card h3 {
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .guide-card p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
            line-height: 1.5;
          }

          .guide-link {
            color: #2196f3;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .guide-link:hover {
            color: #ffffff;
          }

          .support-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .support-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .support-card h3 {
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .support-card p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
            line-height: 1.5;
          }

          .support-link {
            color: #2196f3;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .support-link:hover {
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

            .concepts-grid {
              grid-template-columns: 1fr;
            }

            .guides-grid,
            .support-grid {
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
