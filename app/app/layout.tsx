import React from "react";
import type { Metadata } from "next";

// Force dynamic rendering to avoid SSR context issues
export const dynamic = 'force-dynamic';
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "../lib/auth-context";
import { AuthErrorBoundary } from "../lib/auth-error-boundary";
import { AuthErrorHandler } from "../lib/auth-error-handler";
import ScrollToTop from "../src/components/ScrollToTop";
import NoSSR from "../src/components/NoSSR";
import { NextJSErrorBoundary } from "../components/NextJSErrorBoundary";
import StructuredData from "../components/StructuredData";
import PerformanceMonitor from "../components/PerformanceMonitor";
import { ModalProvider } from "../components/ui/ProductionModal";
import { ToastProvider } from "../components/ui/Toast";
import { AccessibilityProvider } from "../components/ui/AccessibilityProvider";
import "./globals.css";
import "../styles/design-system.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://app.neurolint.dev'),
  title: {
    default: "NeuroLint - Rule-Based React/Next.js Code Transformation Engine | 7-Layer Auto-Fix Platform",
    template: "%s | NeuroLint - React/Next.js Code Transformation"
  },
  description: "Transform legacy React/Next.js code with NeuroLint's rule-based 7-layer engine. Automated fixes for accessibility, hydration, patterns, and configurations with 95% accuracy. Not AI - proven rule-based transformations that actually fix your code.",
  keywords: [
    "React code transformation",
    "Next.js code fixes",
    "React modernization",
    "Next.js migration",
    "React 18 upgrade",
    "App Router migration",
    "TypeScript conversion",
    "legacy React code",
    "React hooks migration",
    "code modernization",
    "automated refactoring",
    "React development tools",
    "Next.js tools",
    "React migration service",
    "frontend modernization",
    "React codebase upgrade",
    "rule-based code analysis",
    "automated code transformation",
    "React performance optimization",
    "Next.js performance",
    "React best practices",
    "TypeScript migration",
    "React component refactoring",
    "Next.js App Router",
    "React Server Components",
    "code quality tools",
    "React linting",
    "automated testing",
    "React security",
    "Next.js security",
    "React accessibility",
    "Next.js accessibility",
    "7-layer transformation engine",
    "code auto-fix",
    "React patterns",
    "Next.js patterns",
    "SSR hydration fixes",
    "React configuration",
    "Next.js configuration",
    "React code quality",
    "Next.js code quality",
    "automated code fixes",
    "React refactoring",
    "Next.js refactoring",
    "React legacy code",
    "Next.js legacy code",
    "React upgrade",
    "Next.js upgrade",
    "React migration tools",
    "Next.js migration tools",
    "React automation",
    "Next.js automation",
    "React code analysis",
    "Next.js code analysis",
    "React code optimization",
    "Next.js code optimization",
    "React development automation",
    "Next.js development automation",
    "React code transformation engine",
    "Next.js code transformation engine",
    "React code modernization platform",
    "Next.js code modernization platform",
    "React automated fixes",
    "Next.js automated fixes",
    "React code improvement",
    "Next.js code improvement",
    "React code enhancement",
    "Next.js code enhancement",
    "React code standardization",
    "Next.js code standardization",
    "React code patterns",
    "Next.js code patterns",
    "React code best practices",
    "Next.js code best practices",
    "React code quality tools",
    "Next.js code quality tools",
    "React code analysis tools",
    "Next.js code analysis tools",
    "React code transformation tools",
    "Next.js code transformation tools",
    "React code modernization tools",
    "Next.js code modernization tools",
    "React code refactoring tools",
    "Next.js code refactoring tools",
    "React code optimization tools",
    "Next.js code optimization tools",
    "React code automation tools",
    "Next.js code automation tools",
    "React code improvement tools",
    "Next.js code improvement tools",
    "React code enhancement tools",
    "Next.js code enhancement tools",
    "React code standardization tools",
    "Next.js code standardization tools",
    "React code patterns tools",
    "Next.js code patterns tools",
    "React code best practices tools",
    "Next.js code best practices tools",
    "React development platform",
    "Next.js development platform",
    "React code transformation platform",
    "Next.js code transformation platform",
    "React code modernization service",
    "Next.js code modernization service",
    "React code transformation service",
    "Next.js code transformation service",
    "React code quality service",
    "Next.js code quality service",
    "React code analysis service",
    "Next.js code analysis service",
    "React code optimization service",
    "Next.js code optimization service",
    "React code automation service",
    "Next.js code automation service",
    "React code improvement service",
    "Next.js code improvement service",
    "React code enhancement service",
    "Next.js code enhancement service",
    "React code standardization service",
    "Next.js code standardization service",
    "React code patterns service",
    "Next.js code patterns service",
    "React code best practices service",
    "Next.js code best practices service"
  ],
  authors: [{ name: "NeuroLint Team", url: "https://neurolint.dev" }],
  creator: "NeuroLint",
  publisher: "NeuroLint",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.neurolint.dev',
    siteName: 'NeuroLint',
    title: 'NeuroLint - Rule-Based React/Next.js Code Transformation Engine',
    description: 'Transform legacy React/Next.js code with our rule-based 7-layer engine. Automated fixes for accessibility, hydration, patterns, and configurations with 95% accuracy.',
    images: [
      {
        url: 'https://app.neurolint.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeuroLint - Rule-Based React/Next.js Code Transformation Engine',
      },
      {
        url: 'https://app.neurolint.dev/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'NeuroLint - Rule-Based React/Next.js Code Transformation Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@neurolint',
    creator: '@neurolint',
    title: 'NeuroLint - Rule-Based React/Next.js Code Transformation Engine',
    description: 'Transform legacy React/Next.js code with our rule-based 7-layer engine. Automated fixes with 95% accuracy.',
    images: ['https://app.neurolint.dev/twitter-image.png'],
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://app.neurolint.dev',
    languages: {
      'en-US': 'https://app.neurolint.dev',
    },
    types: {
      'application/rss+xml': [
        { url: 'https://app.neurolint.dev/feed.xml', title: 'NeuroLint Blog RSS Feed' }
      ]
    }
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.png',
        color: '#000000',
      },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'technology',
  classification: 'Software Development Tools',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    'theme-color': '#2196f3',
    'color-scheme': 'dark light',
    'application-name': 'NeuroLint',
    'apple-mobile-web-app-title': 'NeuroLint',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#2196f3',
    'msapplication-config': '/browserconfig.xml',
    'google-site-verification': 'your-google-verification-code',
    'msvalidate.01': 'your-bing-verification-code',
    'yandex-verification': 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <StructuredData type="website" />
        <StructuredData type="organization" />
        <StructuredData type="softwareApplication" />
        <link rel="canonical" href="https://app.neurolint.dev" />
      </head>
      <body suppressHydrationWarning={true}>
        <AuthErrorHandler />
        <ScrollToTop />
        {/* Space Bee */}
        <div className="shooting-star" id="space-bee" suppressHydrationWarning></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                // Global error handler to suppress response stream errors
                window.addEventListener('error', function(e) {
                  if (e.error && e.error.message &&
                      (e.error.message.includes('body stream already read') ||
                       e.error.message.includes('Response body is already used') ||
                       e.error.message.includes('Failed to execute \\'text\\' on \\'Response\\'') ||
                       e.error.message.includes('Failed to execute \\'json\\' on \\'Response\\''))) {
                    console.warn('Suppressed response stream error:', e.error.message);
                    e.preventDefault();
                    return false;
                  }
                });

                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message &&
                      (e.reason.message.includes('body stream already read') ||
                       e.reason.message.includes('Response body is already used') ||
                       e.reason.message.includes('Failed to execute \\'text\\' on \\'Response\\'') ||
                       e.reason.message.includes('Failed to execute \\'json\\' on \\'Response\\''))) {
                    console.warn('Suppressed unhandled response stream error:', e.reason.message);
                    e.preventDefault();
                    return false;
                  }
                });

                function randomizeBee() {
                  const bee = document.getElementById('space-bee');
                  if (!bee) return;

                  // Random direction: 0 = left to right, 1 = right to left, 2 = top to bottom, 3 = bottom to top
                  const direction = Math.floor(Math.random() * 4);
                  const startY = 20 + Math.random() * 60; // 20-80% of screen height

                  // Random delays between 20-45 seconds for longer pauses
                  const delay = 20 + Math.random() * 25;

                  // Use requestAnimationFrame to avoid hydration conflicts
                  requestAnimationFrame(() => {
                    // Set initial position without animation
                    bee.style.transition = 'none';
                    
                    switch(direction) {
                      case 0: // Left to right
                        bee.style.left = '-50px';
                        bee.style.top = startY + '%';
                        bee.style.transform = 'translateY(-50%)';
                        break;
                      case 1: // Right to left
                        bee.style.left = 'calc(100vw + 50px)';
                        bee.style.top = startY + '%';
                        bee.style.transform = 'translateY(-50%) scaleX(-1)';
                        break;
                      case 2: // Top to bottom
                        bee.style.left = (20 + Math.random() * 60) + '%';
                        bee.style.top = '-50px';
                        bee.style.transform = 'translateX(-50%) rotate(90deg)';
                        break;
                      case 3: // Bottom to top
                        bee.style.left = (20 + Math.random() * 60) + '%';
                        bee.style.top = 'calc(100vh + 50px)';
                        bee.style.transform = 'translateX(-50%) rotate(-90deg)';
                        break;
                    }

                    // Force a reflow to ensure styles are applied
                    bee.offsetHeight;
                    
                    // Now enable animation
                    bee.style.transition = 'all 30s linear';
                    bee.style.animationDelay = delay + 's';
                    bee.style.opacity = '1';
                  });

                  // Re-randomize after animation completes with longer total cycle
                  setTimeout(randomizeBee, (30 + delay) * 1000);
                }

                // Wait for hydration to complete before starting space bee
                function startSpaceBee() {
                  // Additional delay to ensure hydration is complete
                  setTimeout(randomizeBee, 2000);
                }

                // Start after hydration
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', startSpaceBee);
                } else {
                  startSpaceBee();
                }
              })();
            `
          }}
        />
        <NextJSErrorBoundary>
          <AuthErrorBoundary>
            <NoSSR fallback={<div>Loading...</div>}>
              <AuthProvider>
                <AccessibilityProvider>
                  <ToastProvider>
                    <ModalProvider>
                      {children}
                    </ModalProvider>
                  </ToastProvider>
                </AccessibilityProvider>
              </AuthProvider>
            </NoSSR>
          </AuthErrorBoundary>
        </NextJSErrorBoundary>
        <PerformanceMonitor />
        <Analytics />
        <SpeedInsights />
        {/* PayPal SDK is loaded per-page in checkout */}
        <Script id="error-handler" strategy="beforeInteractive">
          {`
            // Global error handler for external services and Next.js dev issues
            window.addEventListener('error', function(event) {
              if (event.error && event.error.message &&
                  (event.error.message.includes('Failed to fetch') ||
                   event.error.message.includes('fullstory') ||
                   event.error.message.includes('webpack') ||
                   event.error.message.includes('RSC payload') ||
                   event.error.message.includes('Fast Refresh') ||
                   event.error.message.includes('fetchServerResponse'))) {
                console.warn('Development service error caught:', event.error.message);
                event.preventDefault();
                return false;
              }
            });

            // Handle unhandled promise rejections from external services and Next.js
            window.addEventListener('unhandledrejection', function(event) {
              if (event.reason && event.reason.message &&
                  (event.reason.message.includes('Failed to fetch') ||
                   event.reason.message.includes('fullstory') ||
                   event.reason.message.includes('webpack') ||
                   event.reason.message.includes('RSC payload') ||
                   event.reason.message.includes('Fast Refresh') ||
                   event.reason.message.includes('fetchServerResponse'))) {
                console.warn('Development promise rejection caught:', event.reason.message);
                event.preventDefault();
                return false;
              }
            });

                        // Override fetch to handle dev server connectivity issues
            if (typeof window !== 'undefined') {
              const originalFetch = window.fetch;
              window.fetch = function(...args) {
                return originalFetch.apply(this, args).catch(error => {
                  if (error.message && error.message.includes('Failed to fetch')) {
                    console.warn('Development fetch error suppressed:', error.message);
                    return new Response('{}', { status: 200 });
                  }
                  throw error;
                });
              };
            }
          `}
        </Script>
      </body>
    </html>
  );
}
