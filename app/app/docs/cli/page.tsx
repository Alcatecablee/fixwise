"use client";

import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";

export default function CLIPage() {
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
            <div className="layer-badge">CLI Reference</div>
            <h1>NeuroLint CLI Commands</h1>
            <p>Complete command reference for the NeuroLint command-line interface</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="layer-content">
          <div className="layer-section">
            <h2>Installation</h2>
            <p>Install the NeuroLint CLI globally to access all commands:</p>
            
            <div className="install-commands">
              <div className="code-block enhanced-code-block">
                <code>npm install -g @neurolint/cli</code>
              </div>
              <div className="code-block enhanced-code-block">
                <code>yarn global add @neurolint/cli</code>
              </div>
              <div className="code-block enhanced-code-block">
                <code>pnpm add -g @neurolint/cli</code>
              </div>
            </div>
            
            <p>Or use npx for one-time execution:</p>
            <div className="code-block enhanced-code-block">
              <code>npx @neurolint/cli --help</code>
            </div>
          </div>

          <div className="layer-section">
            <h2>Authentication</h2>
            <p>Authenticate with your NeuroLint account to access premium features:</p>
            
            <div className="command-group">
              <h3>Login</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint login &lt;api-key&gt;</code>
              </div>
              <p>Store your API key locally for authenticated operations</p>
            </div>
            
            <div className="command-group">
              <h3>Logout</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint logout</code>
              </div>
              <p>Removes stored authentication credentials</p>
            </div>
            
            <div className="command-group">
              <h3>Status</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint status</code>
              </div>
              <p>Show authentication and usage status</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Analysis Commands</h2>
            <p>Analyze your codebase to identify modernization opportunities:</p>
            
            <div className="command-group">
              <h3>Basic Analysis</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze &lt;path&gt;</code>
              </div>
              <p>Analyze files in the specified path (default: current directory)</p>
              
              <h4>Examples:</h4>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze src/</code>
              </div>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze . --include "**/*.{'{'}ts,tsx,js,jsx{'}'}"</code>
              </div>
            </div>
            
            <div className="command-group">
              <h3>Verbose Analysis</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze &lt;path&gt; --verbose</code>
              </div>
              <p>Show detailed analysis progress and file-by-file results</p>
            </div>
            
            <div className="command-group">
              <h3>Output to File</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze &lt;path&gt; --output analysis.json</code>
              </div>
              <p>Save analysis results to a JSON file for later review</p>
            </div>
            
            <div className="command-group">
              <h3>Layer-Specific Analysis</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint analyze &lt;path&gt; --layers 1,2,3</code>
              </div>
              <p>Analyze only specific layers (1-7)</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Transformation Commands</h2>
            <p>Apply modernization fixes to your codebase:</p>
            
            <div className="command-group">
              <h3>Dry Run</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint fix &lt;path&gt; --dry-run</code>
              </div>
              <p>Preview changes without modifying files (recommended first step)</p>
            </div>
            
            <div className="command-group">
              <h3>Apply Fixes</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint fix &lt;path&gt;</code>
              </div>
              <p>Apply all available fixes to the specified path</p>
            </div>
            
            <div className="command-group">
              <h3>Layer-Specific Fixes</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint fix &lt;path&gt; --layers 1,2</code>
              </div>
              <p>Apply fixes for specific layers only</p>
            </div>
            
            <div className="command-group">
              <h3>Backup Before Fixing</h3>
              <div className="code-block enhanced-code-block">
                <code>neurolint fix &lt;path&gt; --backup</code>
              </div>
              <p>Create backup files before applying changes</p>
            </div>
          </div>

          <div className="layer-section">
            <h2>Layer-Specific Commands</h2>
            <p>Work with individual modernization layers:</p>
            
            <div className="layers-commands">
              <div className="layer-command">
                <h3>Layer 1: Configuration</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer1 &lt;path&gt; [options]</code>
                </div>
                <p>Update TypeScript, Next.js, and package.json configurations</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 2: Patterns</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer2 &lt;path&gt; [options]</code>
                </div>
                <p>Apply code patterns and best practices</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 3: Components</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer3 &lt;path&gt; [options]</code>
                </div>
                <p>Modernize React components</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 4: Hooks</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer4 &lt;path&gt; [options]</code>
                </div>
                <p>Optimize custom hooks and state management</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 5: Performance</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer5 &lt;path&gt; [options]</code>
                </div>
                <p>Apply performance optimizations</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 6: Testing</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer6 &lt;path&gt; [options]</code>
                </div>
                <p>Update testing patterns and coverage</p>
              </div>
              
              <div className="layer-command">
                <h3>Layer 7: Deployment</h3>
                <div className="code-block enhanced-code-block">
                  <code>neurolint layer7 &lt;path&gt; [options]</code>
                </div>
                <p>Optimize CI/CD and deployment configurations</p>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Global Options</h2>
            <p>Common options available for most commands:</p>
            
            <div className="options-grid">
              <div className="option-item">
                <h4>--verbose, -v</h4>
                <p>Enable verbose output with detailed progress information</p>
              </div>
              
              <div className="option-item">
                <h4>--quiet, -q</h4>
                <p>Suppress non-essential output</p>
              </div>
              
              <div className="option-item">
                <h4>--config &lt;file&gt;</h4>
                <p>Use custom configuration file</p>
              </div>
              
              <div className="option-item">
                <h4>--include &lt;pattern&gt;</h4>
                <p>Include files matching pattern (glob syntax)</p>
              </div>
              
              <div className="option-item">
                <h4>--exclude &lt;pattern&gt;</h4>
                <p>Exclude files matching pattern (glob syntax)</p>
              </div>
              
              <div className="option-item">
                <h4>--output &lt;file&gt;</h4>
                <p>Output results to specified file</p>
              </div>
              
              <div className="option-item">
                <h4>--format &lt;format&gt;</h4>
                <p>Output format: console, json (default: console)</p>
              </div>
              
              <div className="option-item">
                <h4>--help, -h</h4>
                <p>Show help information for command</p>
              </div>
              
              <div className="option-item">
                <h4>--version</h4>
                <p>Show version information</p>
              </div>
            </div>
          </div>

                    <div className="layer-section">
            <h2>Configuration</h2>
            <p>Customize NeuroLint behavior with configuration files:</p>
            
            <div className="config-example">
              <h3>neurolint.config.js</h3>
              <p>Create a configuration file to customize NeuroLint behavior:</p>
              <ul>
                <li>File patterns: include/exclude specific file types</li>
                <li>Layer settings: enable/disable specific modernization layers</li>
                <li>Custom rules: define project-specific linting rules</li>
                <li>Output settings: configure report format and destination</li>
              </ul>
            </div>
          </div>

          <div className="layer-section">
            <h2>Examples</h2>
            <p>Common usage patterns and examples:</p>
            
            <div className="examples-grid">
              <div className="example-item">
                <h4>Quick Analysis</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze src/ --verbose</code>
                </div>
              </div>
              
              <div className="example-item">
                <h4>Safe Configuration Updates</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/ --layers 1,2 --dry-run</code>
                </div>
              </div>
              
              <div className="example-item">
                <h4>Component Modernization</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix src/components/ --layers 3 --backup</code>
                </div>
              </div>
              
              <div className="example-item">
                <h4>Full Modernization</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint fix . --layers 1,2,3,4,5 --output modernization.json</code>
                </div>
              </div>
              
              <div className="example-item">
                <h4>Custom Configuration</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --config ./custom-neurolint.config.js</code>
                </div>
              </div>
              
              <div className="example-item">
                <h4>CI/CD Integration</h4>
                <div className="code-block enhanced-code-block">
                  <code>neurolint analyze . --format json --output neurolint-report.json</code>
                </div>
              </div>
            </div>
          </div>

          <div className="layer-section">
            <h2>Exit Codes</h2>
            <p>NeuroLint uses standard exit codes for automation:</p>
            
            <div className="exit-codes">
              <div className="exit-code">
                <h4>0</h4>
                <p>Success - no errors or warnings</p>
              </div>
              
              <div className="exit-code">
                <h4>1</h4>
                <p>General error - command failed</p>
              </div>
              
              <div className="exit-code">
                <h4>2</h4>
                <p>Configuration error - invalid settings</p>
              </div>
              
              <div className="exit-code">
                <h4>3</h4>
                <p>Authentication error - login required</p>
              </div>
              
              <div className="exit-code">
                <h4>4</h4>
                <p>Permission error - insufficient access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 