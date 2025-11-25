"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function Layer7Page() {
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
            <div className="layer-badge">Adaptive Layer</div>
            <h1>Layer 7: Adaptive Pattern Learning</h1>
            <p>Learns patterns from previous transformations and applies them consistently across your codebase</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>What it does</h2>
            <p>
              Layer 7 extracts patterns from earlier fixes and applies them across the codebase with confidence scoring. 
              It learns from successful transformations in previous layers and intelligently applies similar patterns 
              to matching code structures throughout your project.
            </p>
            
            <h2>Use when</h2>
            <p>
              You have consistent patterns to propagate across a large codebase or multiple repositories. 
              This layer is particularly useful for maintaining coding standards and ensuring consistency 
              in large-scale applications or when working with distributed teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}