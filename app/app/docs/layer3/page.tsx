"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function Layer3Page() {
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
        <div className="layer-header severity-low">
          <div className="layer-header-content">
            <div className="layer-badge">React Layer</div>
            <h1>Layer 3: Component Intelligence</h1>
            <p>Adds missing key props, fixes accessibility, and enhances React components using AST transformations</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>What Layer 3 Does</h2>
            <p>Layer 3 uses Abstract Syntax Tree (AST) analysis to intelligently enhance React components. It identifies missing key props in lists, standardizes component patterns, improves accessibility, and optimizes component structure for better performance and maintainability.</p>
          </div>

          <div className="layer-section">
            <h2>Why Components Matter</h2>
            <div className="importance-grid">
              <div className="importance-item low">
                <h3>React Console Warnings</h3>
                <p>Missing key props in mapped arrays trigger console warnings and can cause rendering issues</p>
              </div>
              <div className="importance-item low">
                <h3>Accessibility Compliance</h3>
                <p>Missing ARIA attributes and improper button implementations fail accessibility audits</p>
              </div>
              <div className="importance-item low">
                <h3>Performance Optimization</h3>
                <p>Inconsistent component patterns prevent React from optimizing renders effectively</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Common Fixes Applied</h2>
            <div className="fixes-grid">
              <div className="fix-category">
                <h3>Key Props & Lists</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>{`items.map(item => <Item />)`}</code></div>
                    <div className="fix-after">After: <code>{`items.map(item => <Item key={item.id} />)`}</code></div>
                    <div className="fix-explanation">Adds proper key props to prevent React reconciliation issues</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>{`arr.map((item, index) => <div key={index}>`}</code></div>
                    <div className="fix-after">After: <code>{`arr.map((item, index) => <div key={item.id || \`item-\${index}\`}>`}</code></div>
                    <div className="fix-explanation">Replaces index-based keys with stable identifiers</div>
                  </div>
                </div>
              </div>

              <div className="fix-category">
                <h3>Component Props & Structure</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>{`<Button>Click me</Button>`}</code></div>
                    <div className="fix-after">After: <code>{`<Button variant="primary" size="medium">Click me</Button>`}</code></div>
                    <div className="fix-explanation">Ensures buttons have proper variant and size props</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>{`<Icon />`}</code></div>
                    <div className="fix-after">After: <code>{`<Icon size={24} className="icon" />`}</code></div>
                    <div className="fix-explanation">Standardizes icon component props for consistency</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>const Component = forwardRef(...)</code></div>
                    <div className="fix-after">After: <code>Component.displayName = 'Component'</code></div>
                    <div className="fix-explanation">Adds display names to forwardRef components for debugging</div>
                  </div>
                </div>
              </div>

              <div className="fix-category">
                <h3>Import & Interface Generation</h3>
                <div className="fix-list">
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>Missing React imports</code></div>
                    <div className="fix-after">After: <code>import React from 'react'</code></div>
                    <div className="fix-explanation">Adds missing imports for React components and hooks</div>
                  </div>
                  <div className="fix-item">
                    <div className="fix-before">Before: <code>Inline prop types</code></div>
                    <div className="fix-after">After: <code>interface ComponentProps {`{ ... }`}</code></div>
                    <div className="fix-explanation">Generates TypeScript interfaces for component props</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Professional Features</h2>
            <div className="tier-comparison">
              <div className="tier-item unavailable">
                <h3>Free Tier ✗</h3>
                <div className="tier-features">
                  <div className="feature disabled">Layer 3 requires Professional+ plan</div>
                  <div className="feature disabled">AST transformations need premium access</div>
                  <div className="feature disabled">Component intelligence features locked</div>
                </div>
              </div>
              <div className="tier-item available">
                <h3>Professional+ ✓</h3>
                <div className="tier-features">
                  <div className="feature">Smart key prop detection and addition</div>
                  <div className="feature">Component prop standardization</div>
                  <div className="feature">Interface generation from usage</div>
                  <div className="feature">ForwardRef display name addition</div>
                  <div className="feature">Import optimization and detection</div>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Technical Implementation</h2>
            <div className="code-example">
              <h3>Example Component Enhancement</h3>
              <div className="code-block">
                <div className="code-before">
                  <span className="code-label">Before (Basic)</span>
                  <pre>{`function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <div>
          <h3>{user.name}</h3>
          <Button>View Profile</Button>
        </div>
      ))}
    </div>
  );
}`}</pre>
                </div>
                <div className="code-after">
                  <span className="code-label">After (Enhanced)</span>
                  <pre>{`import React from 'react';

interface UserListProps {
  users: User[];
}

function UserList({ users }: UserListProps) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <Button variant="primary" size="medium">
            View Profile
          </Button>
        </div>
      ))}
    </div>
  );
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>For Non-Technical Founders</h2>
            <div className="non-tech-explanation">
              <h3>Why Component Quality Matters</h3>
              <div className="business-benefits">
                <div className="benefit-item">
                  <h4>User Experience</h4>
                  <p>Proper accessibility and component structure means your app works for all users, including those with disabilities</p>
                </div>
                <div className="benefit-item">
                  <h4>Fewer Bugs</h4>
                  <p>Standardized component patterns reduce the likelihood of UI bugs and inconsistent behavior</p>
                </div>
                <div className="benefit-item">
                  <h4>Performance</h4>
                  <p>Optimized React components render faster, making your app feel more responsive to users</p>
                </div>
                <div className="benefit-item">
                  <h4>Team Productivity</h4>
                  <p>Consistent component patterns make it easier for developers to understand and modify the codebase</p>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Next Steps</h2>
            <div className="next-steps">
              <p>After Layer 3 enhances your React components, your project is ready for:</p>
              <div className="next-layer-link">
                <Link href="/docs/layer4" className="next-layer-btn">
                  Continue to Layer 4: Hydration →
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
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
            border: 2px solid #000000;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
          }

          .layer-badge {
            display: inline-block;
            background: rgba(76, 175, 80, 0.2);
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

          .layer-section p {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            margin: 0 0 1rem 0;
          }

          .importance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
          }

          .importance-item {
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .importance-item.low {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
          }

          .importance-item h3 {
            color: #4caf50;
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .importance-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin: 0;
          }

          .fixes-grid {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .fix-category {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .fix-category h3 {
            color: #2196f3;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .fix-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .fix-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #000000;
            border-radius: 8px;
            padding: 1rem;
          }

          .fix-before,
          .fix-after {
            font-family: monospace;
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }

          .fix-before {
            color: #f44336;
          }

          .fix-after {
            color: #4caf50;
          }

          .fix-explanation {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.8rem;
            font-style: italic;
          }

          .tier-comparison {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .tier-item {
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .tier-item.available {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
          }

          .tier-item.unavailable {
            background: linear-gradient(135deg, rgba(158, 158, 158, 0.15) 0%, rgba(158, 158, 158, 0.05) 100%);
          }

          .tier-item h3 {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .tier-item.available h3 {
            color: #4caf50;
          }

          .tier-item.unavailable h3 {
            color: #9e9e9e;
          }

          .tier-features {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .feature {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
          }

          .feature.disabled {
            color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.02);
          }

          .code-example {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .code-example h3 {
            color: #ffffff;
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .code-block {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .code-before,
          .code-after {
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #000000;
            border-radius: 8px;
            padding: 1rem;
          }

          .code-label {
            display: block;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .code-before .code-label {
            color: #f44336;
          }

          .code-after .code-label {
            color: #4caf50;
          }

          .code-block pre {
            margin: 0;
            font-family: monospace;
            font-size: 0.8rem;
            line-height: 1.4;
            color: rgba(255, 255, 255, 0.9);
            overflow-x: auto;
          }

          .non-tech-explanation {
            background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.2) 0%,
              rgba(33, 150, 243, 0.15) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .non-tech-explanation h3 {
            color: #ffffff;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
          }

          .business-benefits {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
          }

          .benefit-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 1rem;
          }

          .benefit-item h4 {
            color: #ffffff;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
          }

          .benefit-item p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8rem;
            margin: 0;
            line-height: 1.4;
          }

          .next-steps {
            text-align: center;
          }

          .next-layer-link {
            margin-top: 1.5rem;
          }

          .next-layer-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.2) 0%,
              rgba(33, 150, 243, 0.15) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            border: 2px solid #000000;
            border-radius: 12px;
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .next-layer-btn:hover {
            transform: translateY(-2px);
            background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.3) 0%,
              rgba(33, 150, 243, 0.25) 50%,
              rgba(255, 255, 255, 0.15) 100%
            );
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

            .importance-grid {
              grid-template-columns: 1fr;
            }

            .tier-comparison {
              grid-template-columns: 1fr;
            }

            .code-block {
              grid-template-columns: 1fr;
            }

            .business-benefits {
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
