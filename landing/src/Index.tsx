import React, { useEffect, useState, useRef } from "react";
import { FAQSection } from "@/components/landing/FAQSection";
import { ComprehensiveDemoSection } from "@/components/landing/ComprehensiveDemoSection";

import {
  Target,
  Zap,
  Search,
  Puzzle,
  BarChart3,
  Atom,
  Settings,
} from "lucide-react";

// Lazy Loading Hook
const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
};

// TypewriterHeadline Component
const TypewriterHeadline: React.FC = () => {
  const [currentText, setCurrentText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0);

  const words = [
    "Auto-Fix Code",
    "Transform Code",
    "Fix Accessibility",
    "Upgrade Patterns",
    "Modernize Safely",
  ];

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const delayBetweenWords = 2000;

    if (currentIndex < words[currentWordIndex].length) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev + words[currentWordIndex][currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);
    } else {
      timeout = setTimeout(
        () => {
          if (currentText.length > 0) {
            setCurrentText((prev) => prev.slice(0, -1));
          } else {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
            setCurrentIndex(0);
          }
        },
        currentText.length === words[currentWordIndex].length
          ? delayBetweenWords
          : deletingSpeed,
      );
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, currentText, currentWordIndex, words]);

  return (
    <div className="mb-12">
      <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white min-h-[1.2em]">
        {currentText}
      </h1>
    </div>
  );
};

export default function Index() {
  const [mounted, setMounted] = React.useState(false);

  // Lazy loading refs for each section
  const [demoSectionRef, demoSectionInView] = useInView(0.1);
  const [featuresSectionRef, featuresSectionInView] = useInView(0.1);
  const [howItWorksSectionRef, howItWorksInView] = useInView(0.2);
  const [vscodeSectionRef, vscodeSectionInView] = useInView(0.2);
  const [faqSectionRef, faqSectionInView] = useInView(0.2);
  const [finalCtaSectionRef, finalCtaSectionInView] = useInView(0.2);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".feature-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
        (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" id="main-content">
      {/* Global Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-green-500/15 to-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-4 py-16 relative"
        aria-label="Hero section"
        role="main"
      >

        <div className="max-w-6xl mx-auto z-10 animate-fade-in-blur">
          <div className="mb-8 md:mb-12 animate-slide-in-down animate-delay-200">
            <span
              className="px-4 md:px-6 py-2 md:py-3 bg-white text-black rounded-xl md:rounded-2xl text-sm md:text-base font-bold backdrop-blur-xl border-2 border-black transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover:scale-105 hover:-translate-y-1 cursor-default interactive shadow-lg"
              role="banner"
              aria-label="Product category"
            >
              The Only Tool That Actually Fixes Your Code
            </span>
          </div>

          <TypewriterHeadline />

          <div className="relative mb-12 md:mb-16 animate-slide-in-up animate-delay-500">
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-zinc-200 mb-12 md:mb-16 max-w-4xl mx-auto leading-relaxed px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl lg:rounded-3xl border-2 border-black font-medium transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover:bg-white/8 interactive shadow-lg">
              While other tools tell you what's wrong, we{" "}
              <span className="text-white font-black">
                actually fix your code
              </span>
              . Rule-based transformations (not AI) with{" "}
              <span className="text-white font-black">
                deterministic fixes in seconds
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 lg:gap-8 justify-center animate-slide-in-up animate-delay-700">
                          <a
                href="https://www.npmjs.com/package/@neurolint/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-6 md:px-8 lg:px-10 py-3 md:py-4 lg:py-5 bg-white text-black font-black rounded-lg md:rounded-xl lg:rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg lg:text-xl shadow-2xl hover:shadow-white/30 hover:scale-105 active:scale-95 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 focus-visible:ring-offset-4 focus-visible:ring-offset-black touch-manipulation interactive min-h-[48px] md:min-h-[56px]"
                aria-label="Install NeuroLint CLI - 100% Free"
              >
                Install Free CLI
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 group-focus-visible:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>

                          <a
                href="#comprehensive-demo"
                className="group relative px-6 md:px-8 lg:px-10 py-3 md:py-4 lg:py-5 bg-black/60 text-white font-black rounded-lg md:rounded-xl lg:rounded-2xl border-2 border-black hover:bg-black/80 active:bg-black/90 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg lg:text-xl backdrop-blur-xl hover:scale-105 active:scale-95 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-500/30 focus-visible:ring-offset-4 focus-visible:ring-offset-black touch-manipulation interactive min-h-[48px] md:min-h-[56px] shadow-lg"
                aria-label="Try interactive demo"
              >
                Try Interactive Demo
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:translate-y-1 group-focus-visible:translate-y-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>
          </div>
        </div>
      </section>

      {/* Comprehensive Demo Section - MOVED UP for immediate engagement */}
      <div ref={demoSectionRef} className={`transition-all duration-1000 transform ${
        demoSectionInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
      }`}>
        <ComprehensiveDemoSection />
      </div>

      {/* Features Section - Moved after demo for context */}
      <section ref={featuresSectionRef} id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-1000 transform ${
            featuresSectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`}>
            <h2 className={`text-5xl md:text-7xl font-black mb-8 tracking-tight text-white transition-all duration-1000 delay-200 transform ${
              featuresSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Problems We Fix Automatically
            </h2>
            <p className={`text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium transition-all duration-1000 delay-400 transform ${
              featuresSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Rule-based transformations (not AI) that fix real bugs in your React & Next.js code
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[
              {
                title: "Next.js 15.5 Migration",
                description:
                  "Automatically migrates your codebase to Next.js 15.5 with Server Actions enhancement, Metadata API modernization, and Turbopack integration.",
                layer: "NEW",
              },
              {
                title: "Configuration Layer",
                description:
                  "Upgrades TypeScript to ES2022 with strict mode, Next.js security headers, and build optimizations.",
                layer: "L1",
              },
              {
                title: "Pattern Standardization",
                description:
                  "Fixes HTML entities, console statements, browser APIs, and standardizes React patterns.",
                layer: "L2",
              },
              {
                title: "Component Modernization",
                description:
                  "Converts HTML to UI components, adds missing keys, aria-labels, and button variants.",
                layer: "L3",
              },
              {
                title: "Hydration & SSR Safety",
                description:
                  "Adds window/document guards, mounted state for theme providers, and fixes hydration mismatches.",
                layer: "L4",
              },
              {
                title: "Next.js App Router",
                description:
                  "Adds 'use client' directives, fixes React imports, and optimizes for App Router patterns.",
                layer: "L5",
              },
              {
                title: "Testing & Validation",
                description:
                  "Adds error boundaries, prop type interfaces, loading states, and validates component exports.",
                layer: "L6",
              },
              {
                title: "Adaptive Pattern Learning",
                description:
                  "Learns from previous transformations and applies learned patterns to improve future fixes.",
                layer: "L7",
              },
            ].map((feature, index) => {
              const getGlowClass = () => {
                const colors = [
                  "red",
                  "blue",
                  "purple",
                  "green",
                  "pink",
                  "orange",
                  "cyan",
                  "yellow",
                ];
                const color = colors[index];

                if (index === 0)
                  return `glow-border glow-border-always glow-border-${color}`;
                if (index === 1)
                  return `glow-border glow-border-hover glow-border-${color}`;
                if (index === 2)
                  return `glow-border glow-border-delay-1 glow-border-${color}`;
                if (index === 3)
                  return `glow-border glow-border-hover glow-border-${color}`;
                if (index === 4)
                  return `glow-border glow-border-delay-2 glow-border-${color}`;
                if (index === 5)
                  return `glow-border glow-border-hover glow-border-${color}`;
                if (index === 6)
                  return `glow-border glow-border-delay-3 glow-border-${color}`;
                if (index === 7)
                  return `glow-border glow-border-hover glow-border-${color}`;
                return "";
              };

              return (
                <div
                  key={index}
                  className={`feature-card bg-white/5 backdrop-blur-xl p-10 rounded-3xl relative border-2 border-black transition-all duration-1000 hover:bg-white/8 group h-[280px] flex flex-col transform shadow-lg hover:shadow-xl ${
                    featuresSectionInView
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-20 scale-95'
                  } ${getGlowClass()}`}
                  style={{ transitionDelay: `${(index * 100) + 600}ms` }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform duration-300">
                      {feature.layer}
                    </div>
                    <h3 className="text-2xl font-black text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed font-medium flex-grow">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section - Simplified and moved up */}
      <section ref={howItWorksSectionRef} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-1000 transform ${
            howItWorksInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`}>
            <h2 className={`text-5xl md:text-7xl font-black mb-8 tracking-tight text-white transition-all duration-1000 delay-200 transform ${
              howItWorksInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              One Command, Thousands of Fixes
            </h2>
            <p className={`text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium transition-all duration-1000 delay-400 transform ${
              howItWorksInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Unlike other tools that suggest fixes, we actually apply them automatically
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Install",
                description:
                  "npm install -g @neurolint/cli - One command to install the free CLI tool globally",
              },
              {
                step: "02",
                title: "Analyze",
                description:
                  "neurolint analyze src/ - Scan your codebase and detect hydration crashes, missing keys, and ESLint errors",
              },
              {
                step: "03",
                title: "Fix",
                description:
                  "neurolint fix --all-layers - Apply automatic fixes with built-in backups. Rollback anytime if needed.",
              },
            ].map((item, index) => (
              <div key={index} className={`group relative transition-all duration-1000 transform ${
                howItWorksInView
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-20 scale-95'
              }`}
              style={{ transitionDelay: `${(index * 200) + 600}ms` }}>
                <div className="relative p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl border-2 border-black rounded-3xl transition-all duration-300 hover:bg-gradient-to-br hover:from-white/8 hover:to-white/4 min-h-[320px] md:h-[360px] lg:h-[320px] flex flex-col shadow-lg hover:shadow-xl">
                  <div className="text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 lg:mb-8">
                    {item.step}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6 text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-zinc-300 leading-relaxed font-medium text-sm md:text-base lg:text-lg flex-grow overflow-hidden">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VSCode Section - Removed: CLI-only now */}

      {/* FAQ Section */}
      <div ref={faqSectionRef} className={`transition-all duration-1000 transform ${
        faqSectionInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
      }`}>
        <FAQSection />
      </div>

      {/* Final CTA Section */}
      <section ref={finalCtaSectionRef} className="py-24 px-4">
        <div className="max-w-6xl mx-auto relative">
          <div className={`relative bg-gradient-to-r from-zinc-800 to-black backdrop-blur-xl border-2 border-black rounded-3xl p-16 md:p-24 text-center transition-all duration-1000 transform shadow-lg ${
            finalCtaSectionInView
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-20 scale-95'
          }`}>
            <h2 className={`text-5xl md:text-7xl font-black mb-8 tracking-tight text-white transition-all duration-1000 delay-200 transform ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Stop Shipping Bugs. Start Using NeuroLint.
            </h2>
            <p className={`text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto font-medium transition-all duration-1000 delay-400 transform ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              100% Free CLI. No registration required. Automatic backups included.
            </p>
            <div className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-1000 delay-600 transform ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
            }`}>
              <a
                href="https://www.npmjs.com/package/@neurolint/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all duration-300 text-lg shadow-2xl hover:scale-105"
              >
                Install Free CLI
              </a>
              <a
                href="https://app.neurolint.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-black/60 text-white font-black rounded-2xl border-2 border-black hover:bg-black/80 transition-all duration-300 text-lg backdrop-blur-xl hover:scale-105 shadow-lg"
              >
                View Demo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
