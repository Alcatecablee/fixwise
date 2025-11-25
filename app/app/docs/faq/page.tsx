"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function FAQPage() {
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
            <div className="layer-badge">FAQ</div>
            <h1>Frequently Asked Questions</h1>
            <p>Common questions and troubleshooting for NeuroLint</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Getting Started</h2>
            
            <div className="faq-item">
              <h3>What is NeuroLint?</h3>
              <p>NeuroLint is an intelligent code modernization tool that automatically transforms React/Next.js codebases using a 7-layer approach. It updates configurations, modernizes components, applies best practices, and ensures your code follows the latest standards.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I install NeuroLint?</h3>
              <p>Install the CLI globally with: <code>npm install -g @neurolint/cli</code>. You can also use the web dashboard at app.neurolint.dev or install the VS Code extension from the marketplace.</p>
            </div>
            
            <div className="faq-item">
              <h3>What are the 7 layers?</h3>
              <p>The 7 layers are: 1) Configuration (TypeScript, Next.js), 2) Patterns (code patterns), 3) Components (React components), 4) Hooks (state management), 5) Performance (optimizations), 6) Testing (test coverage), and 7) Deployment (CI/CD).</p>
            </div>
            
            <div className="faq-item">
              <h3>Is NeuroLint safe to use?</h3>
              <p>Yes! NeuroLint uses a conservative approach with dry-run previews, automatic backups, and layer-by-layer progression. It never makes breaking changes and always allows you to review changes before applying them.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Installation & Setup</h2>
            
            <div className="faq-item">
              <h3>I get permission errors during installation. What should I do?</h3>
              <p>Use <code>sudo npm install -g @neurolint/cli</code> on Unix systems, or configure npm to use a different directory. Alternatively, use <code>npx @neurolint/cli</code> for one-time execution without global installation.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I authenticate with NeuroLint?</h3>
              <p>Run <code>neurolint login</code> to open the browser for OAuth authentication with GitHub, Google, or email. Authentication is required for premium features and team collaboration.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I use NeuroLint without authentication?</h3>
              <p>Yes! The free tier allows basic analysis and fixes without authentication. Premium features like team collaboration, advanced rules, and priority support require authentication.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I check my authentication status?</h3>
              <p>Run <code>neurolint status</code> to see your current authentication status, account details, and plan information.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Usage & Commands</h2>
            
            <div className="faq-item">
              <h3>What's the difference between analyze and fix commands?</h3>
              <p><code>analyze</code> scans your code and shows what can be improved without making changes. <code>fix</code> applies the actual transformations to your code. Always use <code>--dry-run</code> first to preview changes.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I preview changes before applying them?</h3>
              <p>Use the <code>--dry-run</code> flag: <code>neurolint fix src/ --layers 1,2 --dry-run</code>. This shows exactly what changes will be made without modifying your files.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I apply only specific layers?</h3>
              <p>Yes! Use the <code>--layers</code> flag: <code>neurolint fix src/ --layers 1,2,3</code>. This applies only the specified layers (1-7).</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I exclude certain files from analysis?</h3>
              <p>Use the <code>--exclude</code> flag: <code>neurolint analyze . --exclude "**/*.test.*" --exclude "node_modules/**"</code>. You can also create a <code>neurolint.config.js</code> file for persistent exclusions.</p>
            </div>
            
            <div className="faq-item">
              <h3>What output formats are available?</h3>
              <p>NeuroLint supports text (default), JSON, and table formats. Use <code>--format json --output report.json</code> to save results to a file for CI/CD integration.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Safety & Backups</h2>
            
            <div className="faq-item">
              <h3>Does NeuroLint create backups?</h3>
              <p>Yes! NeuroLint automatically creates backups before making changes. Use <code>--backup</code> to ensure backups are created, or <code>--no-backup</code> to skip them (not recommended).</p>
            </div>
            
            <div className="faq-item">
              <h3>How can I restore from a backup?</h3>
              <p>NeuroLint creates timestamped backup files. You can restore manually by copying the backup file back, or use <code>neurolint backups --restore backup-id</code> to restore from the centralized backup system.</p>
            </div>
            
            <div className="faq-item">
              <h3>What if my build breaks after applying fixes?</h3>
              <p>First, check the backup files NeuroLint created. You can restore them manually or run <code>neurolint fix . --layers 1,2,3</code> to apply configuration fixes that might resolve build issues.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I undo NeuroLint changes?</h3>
              <p>Yes! NeuroLint creates automatic backups, and you can use git to revert changes: <code>git reset --hard HEAD~1</code> if you committed before applying fixes.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Troubleshooting</h2>
            
            <div className="faq-item">
              <h3>Analysis returns "0 files analyzed". What's wrong?</h3>
              <p>Check your path and file patterns. Try <code>neurolint analyze . --verbose</code> to see what's happening. Ensure you're in the correct directory and your files match the include/exclude patterns.</p>
            </div>
            
            <div className="faq-item">
              <h3>I get TypeScript errors after applying fixes. What should I do?</h3>
              <p>Run <code>neurolint fix . --layers 1,2,3</code> to apply configuration and component fixes that should resolve TypeScript issues. Always test your build after applying changes.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I check NeuroLint's health and configuration?</h3>
              <p>Run <code>neurolint health</code> to check your configuration, dependencies, and connectivity. This helps identify any setup issues.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I customize NeuroLint's behavior?</h3>
              <p>Yes! Create a <code>neurolint.config.js</code> file to customize file patterns, layer settings, rules, and output options. See the CLI documentation for configuration examples.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I report a bug or request a feature?</h3>
              <p>Visit our GitHub repository to report bugs or request features. For premium users, contact support through the web dashboard for priority assistance.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Advanced Features</h2>
            
            <div className="faq-item">
              <h3>What are custom rules and how do I use them?</h3>
              <p>Custom rules allow you to define project-specific patterns. Use <code>neurolint rules --export</code> to export current rules and <code>neurolint rules --import</code> to import custom rules for your team.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I integrate NeuroLint into my CI/CD pipeline?</h3>
              <p>Use <code>neurolint analyze . --format json --output neurolint-report.json</code> in your CI/CD scripts. The JSON output can be parsed by other tools for automated reporting and decision-making.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I use NeuroLint with monorepos?</h3>
              <p>Yes! NeuroLint works with monorepos. Run it from the root directory and use <code>--include</code> patterns to target specific packages: <code>neurolint analyze . --include "packages/*/src/**/*"</code>.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I set up team collaboration?</h3>
              <p>Use <code>neurolint init-config --team</code> to create team configuration, export shared rules with <code>neurolint rules --export</code>, and set up CI/CD integration for automated analysis.</p>
            </div>
            
            <div className="faq-item">
              <h3>What's the difference between CLI, web dashboard, and VS Code extension?</h3>
              <p>CLI is for automation and CI/CD, web dashboard provides visual analysis and team collaboration, and VS Code extension offers real-time analysis and inline suggestions during development.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Pricing & Plans</h2>
            
            <div className="faq-item">
              <h3>What's included in the free tier?</h3>
              <p>The free tier includes basic analysis, Layer 1-3 fixes, CLI access, and community support. Perfect for individual developers and small projects.</p>
            </div>
            
            <div className="faq-item">
              <h3>What do I get with the premium plan?</h3>
              <p>Premium includes all layers (1-7), advanced rules, team collaboration, priority support, CI/CD integration, and advanced reporting features.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is there an enterprise plan?</h3>
              <p>Yes! Enterprise includes custom rules, dedicated support, on-premise deployment, advanced security features, and custom integrations.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I upgrade or downgrade my plan?</h3>
              <p>Yes! You can change your plan at any time through the web dashboard. Changes take effect immediately, and you'll be charged or credited proportionally.</p>
            </div>
            
            <div className="faq-item">
              <h3>Do you offer refunds?</h3>
              <p>We offer a 30-day money-back guarantee. If you're not satisfied, contact support within 30 days for a full refund.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Support & Community</h2>
            
            <div className="faq-item">
              <h3>How can I get help?</h3>
              <p>Check our documentation, FAQ, and troubleshooting guides first. For additional help, use community forums, GitHub issues, or contact support through the web dashboard.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is there a community forum?</h3>
              <p>Yes! Join our community forum to ask questions, share experiences, and connect with other NeuroLint users. Great for learning best practices and getting help.</p>
            </div>
            
            <div className="faq-item">
              <h3>Do you offer training or workshops?</h3>
              <p>Yes! We offer team training sessions, workshops, and custom onboarding for enterprise customers. Contact us to schedule a session for your team.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I contribute to NeuroLint?</h3>
              <p>Absolutely! We welcome contributions on GitHub. Check our contributing guidelines for information on bug reports, feature requests, and code contributions.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I stay updated with new features?</h3>
              <p>Follow our blog, subscribe to our newsletter, or watch our GitHub repository for releases. We also announce major updates through our social media channels.</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Still Need Help?</h2>
            <div className="help-options">
              <div className="help-option">
                <h4>Documentation</h4>
                <p>Browse our comprehensive documentation for detailed guides and examples</p>
                <Link href="/docs" className="docs-link">View Documentation →</Link>
              </div>
              
              <div className="help-option">
                <h4>Community Forum</h4>
                <p>Ask questions and get help from other NeuroLint users</p>
                <Link href="/docs" className="docs-link">Browse Docs →</Link>
              </div>
              
              <div className="help-option">
                <h4>GitHub Issues</h4>
                <p>Report bugs or request new features</p>
                <Link href="https://github.com/neurolint/neurolint/issues" className="docs-link">View Issues →</Link>
              </div>
              
              <div className="help-option">
                <h4>Contact Support</h4>
                <p>Get priority support for premium users</p>
                <Link href="/dashboard" className="docs-link">Open Dashboard →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 