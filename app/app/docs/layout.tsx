import Link from "next/link";
import { Metadata } from 'next';
import './docs-layout.css';
import './docs-theme.css';

export const metadata: Metadata = {
  title: "Documentation - NeuroLint React/Next.js Modernization",
  description:
    "Comprehensive documentation for NeuroLint's modernization system: installation, CLI, API, layers, workflows, configuration, troubleshooting, and best practices.",
  keywords: [
    "NeuroLint documentation",
    "React modernization docs",
    "Next.js migration guide",
    "React 18 upgrade",
    "TypeScript conversion",
    "SSR hydration fixes",
  ],
  alternates: { canonical: "https://app.neurolint.dev/docs" },
  robots: { index: true, follow: true },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="Documentation navigation">
        <div className="sidebar-section">
          <div className="sidebar-title">Overview</div>
          <nav className="sidebar-links">
            <Link className="nav-link" href="/docs">Introduction</Link>
            <Link className="nav-link" href="/docs/getting-started">Getting Started</Link>
            <Link className="nav-link" href="/docs/installation">Installation</Link>
            <Link className="nav-link" href="/docs/configuration">Configuration</Link>
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Core Concepts</div>
          <nav className="sidebar-links">
            <Link className="nav-link" href="/docs/layers">Layers Overview</Link>
            <Link className="nav-link" href="/docs/layer1">Layer 1: Configuration</Link>
            <Link className="nav-link" href="/docs/layer2">Layer 2: Patterns</Link>
            <Link className="nav-link" href="/docs/layer3">Layer 3: Components</Link>
            <Link className="nav-link" href="/docs/layer4">Layer 4: Hydration</Link>
            <Link className="nav-link" href="/docs/layer5">Layer 5: Next.js</Link>
            <Link className="nav-link" href="/docs/layer6">Layer 6: Testing</Link>
            <Link className="nav-link" href="/docs/layer7">Layer 7: Adaptive</Link>
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Usage</div>
          <nav className="sidebar-links">
            <Link className="nav-link" href="/docs/cli">CLI</Link>
            <Link className="nav-link" href="/docs/api">API</Link>
            <Link className="nav-link" href="/docs/workflows">Workflows</Link>
            <Link className="nav-link" href="/docs/tutorials">Tutorials</Link>
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Support</div>
          <nav className="sidebar-links">
            <Link className="nav-link" href="/docs/troubleshooting">Troubleshooting</Link>
            <Link className="nav-link" href="/docs/faq">FAQ</Link>
            <Link className="nav-link" href="/api-docs">API Docs</Link>
          </nav>
        </div>
      </aside>

      <main className="docs-content" id="content" role="main">
        {children}
      </main>
    </div>
  );
}
