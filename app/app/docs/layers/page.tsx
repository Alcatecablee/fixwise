"use client";

import Link from "next/link";

export default function LayersOverviewPage() {
  return (
    <div className="layers-overview">
      <div className="page-header">
        <h1>Layers Overview</h1>
        <p className="page-description">
          NeuroLint's 7-layer modernization system systematically transforms React/Next.js codebases. 
          Each layer targets specific issues and can be run independently or as part of a complete modernization workflow.
        </p>
      </div>

      <div className="layers-intro">
        <div className="intro-content">
          <h2>How the Layer System Works</h2>
          <p>
            The layer system is designed to be <strong>progressive</strong> and <strong>safe</strong>. 
            Each layer builds upon the previous ones, ensuring that foundational issues are resolved before 
            applying more complex transformations. You can run individual layers or multiple layers together 
            based on your specific needs.
          </p>
          
          <div className="layer-workflow">
            <div className="workflow-step">
              <span className="step-number">1</span>
              <span className="step-text">Analyze your codebase to identify issues</span>
            </div>
            <div className="workflow-step">
              <span className="step-number">2</span>
              <span className="step-text">Choose which layers to apply</span>
            </div>
            <div className="workflow-step">
              <span className="step-number">3</span>
              <span className="step-text">Run fixes with validation and backups</span>
            </div>
          </div>
        </div>
      </div>

      <section className="quick-actions-section">
        <div className="section-header">
          <h3>The 7 Modernization Layers</h3>
          <p>Click on any layer to view detailed documentation and examples.</p>
        </div>
        
        <div className="layer-grid">
          <Link href="/docs/layer1" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">01</span>
              <span className="layer-label">Configuration</span>
            </div>
            <p className="layer-description">
              Modernizes TypeScript configuration, Next.js settings, and package.json dependencies. 
              Ensures your project uses the latest recommended configurations and removes deprecated options.
            </p>
            <div className="layer-details">
              <span className="layer-tag">TypeScript</span>
              <span className="layer-tag">Next.js</span>
              <span className="layer-tag">Dependencies</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer2" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">02</span>
              <span className="layer-label">Patterns</span>
            </div>
            <p className="layer-description">
              Fixes HTML entities, cleans up imports, and standardizes common patterns. 
              Improves code consistency and removes potential rendering issues.
            </p>
            <div className="layer-details">
              <span className="layer-tag">HTML Entities</span>
              <span className="layer-tag">Imports</span>
              <span className="layer-tag">Patterns</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer3" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">03</span>
              <span className="layer-label">Components</span>
            </div>
            <p className="layer-description">
              Adds missing key props, improves accessibility, and enhances component structure. 
              Ensures your components follow React best practices and accessibility guidelines.
            </p>
            <div className="layer-details">
              <span className="layer-tag">Accessibility</span>
              <span className="layer-tag">Keys</span>
              <span className="layer-tag">Structure</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer4" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">04</span>
              <span className="layer-label">Hydration</span>
            </div>
            <p className="layer-description">
              Guards client-only APIs for SSR safety and prevents hydration mismatches. 
              Critical for Next.js applications to ensure proper server-side rendering.
            </p>
            <div className="layer-details">
              <span className="layer-tag">SSR</span>
              <span className="layer-tag">Hydration</span>
              <span className="layer-tag">Client APIs</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer5" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">05</span>
              <span className="layer-label">Next.js</span>
            </div>
            <p className="layer-description">
              Adds 'use client' directives and optimizes imports for Next.js 13+ App Router. 
              Ensures compatibility with the latest Next.js features and conventions.
            </p>
            <div className="layer-details">
              <span className="layer-tag">App Router</span>
              <span className="layer-tag">Directives</span>
              <span className="layer-tag">Imports</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer6" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">06</span>
              <span className="layer-label">Testing</span>
            </div>
            <p className="layer-description">
              Adds error boundaries, loading states, and testing helpers. 
              Improves application reliability and makes testing easier.
            </p>
            <div className="layer-details">
              <span className="layer-tag">Error Boundaries</span>
              <span className="layer-tag">Loading States</span>
              <span className="layer-tag">Testing</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>

          <Link href="/docs/layer7" className="layer-item-link">
            <div className="layer-header">
              <span className="layer-number">07</span>
              <span className="layer-label">Adaptive</span>
            </div>
            <p className="layer-description">
              Learns patterns from your codebase and applies them consistently. 
              Customizes transformations based on your project's specific conventions and style.
            </p>
            <div className="layer-details">
              <span className="layer-tag">AI Learning</span>
              <span className="layer-tag">Patterns</span>
              <span className="layer-tag">Customization</span>
            </div>
            <span className="layer-learn-more">View Layer Details →</span>
          </Link>
        </div>
      </section>

      <section className="quick-actions-section">
        <div className="section-header">
          <h3>Usage Examples</h3>
          <p>Common layer combinations for different scenarios.</p>
        </div>
        
        <div className="usage-examples">
          <div className="example-card">
            <h4>Quick Start</h4>
            <p>Basic modernization for most projects</p>
            <div className="code-block">
              <p className="comment"># Run layers 1-4 for core modernization</p>
              <p>neurolint fix src/ --layers 1,2,3,4</p>
            </div>
          </div>
          
          <div className="example-card">
            <h4>Next.js Migration</h4>
            <p>Complete Next.js 13+ App Router upgrade</p>
            <div className="code-block">
              <p className="comment"># All layers for full modernization</p>
              <p>neurolint fix src/ --layers 1,2,3,4,5,6,7</p>
            </div>
          </div>
          
          <div className="example-card">
            <h4>Accessibility Focus</h4>
            <p>Improve accessibility and component structure</p>
            <div className="code-block">
              <p className="comment"># Focus on accessibility and testing</p>
              <p>neurolint fix src/ --layers 3,6</p>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-actions-section">
        <div className="section-header">
          <h3>Severity Levels</h3>
          <p>Understanding the impact and priority of each layer.</p>
        </div>
        
        <div className="severity-guide">
          <div className="severity-item">
            <div className="severity-indicator severity-high"></div>
            <div className="severity-content">
              <h4>High Priority</h4>
              <p>Critical for functionality and performance. Should be applied first.</p>
            </div>
          </div>
          
          <div className="severity-item">
            <div className="severity-indicator severity-medium"></div>
            <div className="severity-content">
              <h4>Medium Priority</h4>
              <p>Important for best practices and maintainability. Apply after high priority.</p>
            </div>
          </div>
          
          <div className="severity-item">
            <div className="severity-indicator severity-low"></div>
            <div className="severity-content">
              <h4>Low Priority</h4>
              <p>Enhancements and optimizations. Can be applied last or selectively.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 