import React, { useEffect, useState, useRef } from "react";
import { FAQSection } from "./FAQSection";
import { ModalDemo } from "./components/ModalDemo";
import { LayersDocSection } from "./components/LayersDocSection";
import { LandingFooter } from "./LandingFooter";

import {
  Target,
  Zap,
  Search,
  Puzzle,
  BarChart3,
  Atom,
  Settings,
  Copy,
  Check,
  GitBranch,
  Shield,
  RefreshCw,
  CheckSquare,
  FileCheck,
} from "lucide-react";

// Lazy Loading Hook
const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
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
const TypewriterHeadline = () => {
  const [currentText, setCurrentText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0);

  const words = [
    "Stop Hydration Crashes",
    "Kill Missing Keys",
    "Fix ESLint Errors",
    "Prevent Deploy Bugs",
    "Ship Clean Code",
  ];

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const delayBetweenWords = 2000;

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    if (currentIndex < currentWord.length) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev + currentWord[currentIndex]);
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
        currentText.length === currentWord.length
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
  const [copied, setCopied] = React.useState(false);

  // Lazy loading refs for each section
  const [demoSectionRef, demoSectionInView] = useInView(0.1);
  const [howItWorksSectionRef, howItWorksInView] = useInView(0.2);
  const [orchestrationSectionRef, orchestrationSectionInView] = useInView(0.2);
  const [faqSectionRef, faqSectionInView] = useInView(0.2);
  const [finalCtaSectionRef, finalCtaSectionInView] = useInView(0.2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText('npm install -g @neurolint/cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="NeuroLint" className="h-9" />
            </a>
            <div className="flex items-center gap-6">
              <a 
                href="#comprehensive-demo" 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Demo
              </a>
              <a 
                href="#features" 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Features
              </a>
              <a 
                href="#faq" 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                FAQ
              </a>
              <a 
                href="https://github.com/Alcatecablee/Neurolint-CLI/blob/main/CLI_USAGE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Docs
              </a>
              <a 
                href="https://www.npmjs.com/package/@neurolint/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm shadow-lg"
              >
                Install
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-4 py-16 pt-20 relative"
        aria-label="Hero section"
        role="main"
      >

        <div className="max-w-6xl mx-auto z-10 animate-fade-in-blur">
          <div className="mb-6 md:mb-8 animate-slide-in-down animate-delay-200">
            <span
              className="inline-block px-4 md:px-5 py-1.5 md:py-2 bg-white text-black rounded-full text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition-shadow duration-300 cursor-default"
              role="banner"
              aria-label="Product category"
            >
              The Only Tool That Actually Fixes Your Code
            </span>
          </div>

          <TypewriterHeadline />

          <div className="mb-8 md:mb-10 animate-slide-in-up animate-delay-500">
            <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              While other tools tell you what's wrong, we{" "}
              <span className="text-white font-bold">
                actually fix your code
              </span>
              . Rule-based transformations (not AI) with{" "}
              <span className="text-white font-bold">
                deterministic fixes in seconds
              </span>
              .
            </p>
          </div>

          {/* Install Command */}
          <div className="mb-6 md:mb-8 animate-slide-in-up animate-delay-700">
            <div className="max-w-2xl mx-auto bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 md:p-5 backdrop-blur-sm relative group hover:border-zinc-600/50 transition-colors duration-300">
              <code className="text-green-400 font-mono text-sm md:text-base lg:text-lg block text-center pr-10">
                $ npm install -g @neurolint/cli
              </code>
              <button
                onClick={copyToClipboard}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Copy install command"
              >
                {copied ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3 mb-10 md:mb-12 animate-slide-in-up animate-delay-800">
            <a 
              href="https://github.com/Alcatecablee/Neurolint-CLI" 
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://img.shields.io/github/stars/Alcatecablee/Neurolint-CLI?style=social" 
                alt="GitHub stars"
                className="h-5"
              />
            </a>
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://img.shields.io/npm/v/@neurolint/cli.svg?style=flat-square&color=blue" 
                alt="npm version"
                className="h-5"
              />
            </a>
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://img.shields.io/npm/dm/@neurolint/cli.svg?style=flat-square&color=green" 
                alt="npm downloads"
                className="h-5"
              />
            </a>
            <a 
              href="./LICENSE" 
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://img.shields.io/badge/license-BSL%201.1-blue.svg?style=flat-square" 
                alt="BSL 1.1 License"
                className="h-5"
              />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up animate-delay-900">
            <a
              href="#comprehensive-demo"
              className="group relative px-8 md:px-10 py-3.5 md:py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300 ease-out flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black touch-manipulation min-h-[48px]"
              aria-label="Try interactive demo - scroll to demo section"
            >
              Try Interactive Demo
              <svg
                className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-300 ease-out"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* CLI Demo Video Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black via-zinc-900/50 to-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
              See It In Action
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Watch NeuroLint automatically fix your code in seconds
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black/40 backdrop-blur-xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
              poster="/logo.png"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Placeholder demo - Replace with actual CLI recording
          </p>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <div ref={demoSectionRef} id="comprehensive-demo" className={`transition-all duration-1000 transform ${
        demoSectionInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
      }`}>
        <ModalDemo />
      </div>

      {/* Layers Documentation Section */}
      <LayersDocSection />

      {/* How It Works Section - Simplified and moved up */}
      <section ref={howItWorksSectionRef} className="py-16 md:py-24 px-4" aria-labelledby="how-it-works-heading">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 md:mb-20 transition-all duration-700 ease-out transform ${
            howItWorksInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`}>
            <h2 
              id="how-it-works-heading"
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8 tracking-tight text-white transition-all duration-700 delay-100 ease-out transform px-4 ${
                howItWorksInView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
            >
              One Command, Thousands of Fixes
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium transition-all duration-700 delay-200 ease-out transform px-4 ${
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
              <div 
                key={index} 
                className={`group relative transition-all duration-700 ease-out transform ${
                  howItWorksInView
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{ transitionDelay: `${(index * 150) + 400}ms` }}
              >
                <div className="relative p-6 md:p-8 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl border-2 border-black rounded-2xl transition-all duration-300 ease-out hover:bg-gradient-to-br hover:from-white/8 hover:to-white/4 hover:border-white/20 min-h-[280px] sm:min-h-[320px] flex flex-col shadow-lg hover:shadow-2xl focus-within:ring-2 focus-within:ring-white/30 focus-within:ring-offset-2 focus-within:ring-offset-black">
                  <div className="text-4xl md:text-5xl font-black text-white mb-3 md:mb-4" aria-hidden="true">
                    {item.step}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed font-medium text-sm md:text-base flex-grow">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Orchestration Pattern Section */}
      <section ref={orchestrationSectionRef} className="py-24 px-4 bg-gradient-to-b from-black via-zinc-900/30 to-black">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ease-out transform ${
            orchestrationSectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`}>
            <h2 className={`text-4xl md:text-6xl font-black mb-6 tracking-tight text-white transition-all duration-700 delay-100 ease-out transform ${
              orchestrationSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Why NeuroLint Never Breaks Your Code
            </h2>
            <p className={`text-lg md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium transition-all duration-700 delay-200 ease-out transform ${
              orchestrationSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              The 5-Step Fail-Safe Orchestration System That AI Tools Can't Match
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                stage: "1",
                title: "AST Transform",
                description: "Try precise code transformation using Abstract Syntax Tree parsing for deep structural understanding.",
                Icon: GitBranch
              },
              {
                stage: "2",
                title: "First Validation",
                description: "Immediately validate the AST result to ensure code remains syntactically correct and semantically sound.",
                Icon: FileCheck
              },
              {
                stage: "3",
                title: "Regex Fallback",
                description: "If AST or validation fails, fall back to regex-based transformation as a safety net.",
                Icon: RefreshCw
              },
              {
                stage: "4",
                title: "Second Validation",
                description: "Re-validate the regex result with the same strict checks. Every path must pass validation — no shortcuts.",
                Icon: CheckSquare
              },
              {
                stage: "5",
                title: "Accept or Revert",
                description: "Only apply changes if validation passed. If validation fails at any step, automatically revert to last known good state.",
                Icon: Shield
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`bg-white/5 backdrop-blur-xl p-8 rounded-2xl border-2 border-white/10 hover:border-white/20 transition-all duration-700 ease-out transform ${
                  orchestrationSectionInView
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{ transitionDelay: `${(index * 150) + 400}ms` }}
              >
                <div className="mb-4">
                  <item.Icon className="w-12 h-12 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-2">Stage {item.stage}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className={`bg-zinc-900/50 backdrop-blur-xl border-2 border-white/10 rounded-2xl p-8 md:p-12 transition-all duration-700 ease-out transform ${
            orchestrationSectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`} style={{ transitionDelay: '850ms' }}>
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-6 text-center">AI Tools vs NeuroLint</h3>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-zinc-800/40 border-2 border-zinc-600/30 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-zinc-300 mb-3">AI Code Tools</h4>
                  <div className="space-y-2 text-zinc-400 text-sm">
                    <p>— Generate code without validation</p>
                    <p>— Hallucinate invalid syntax</p>
                    <p>— Break production deployments</p>
                    <p>— Waste developer time debugging</p>
                  </div>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-white mb-3">NeuroLint</h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <p>— Validate every transformation twice</p>
                    <p>— Deterministic, rule-based fixes</p>
                    <p>— Auto-revert on validation failure</p>
                    <p>— Guaranteed valid code output</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl md:text-2xl font-black text-white mb-4 text-center">The 5-Step Flow</h3>
              <div className="bg-black/40 rounded-xl p-6 font-mono text-sm overflow-x-auto">
                <div className="text-blue-400">Step 1: Original Code (Last Known Good State)</div>
                <div className="text-gray-400 ml-4">↓</div>
                <div className="text-cyan-400">Step 2: Try AST Transformation</div>
                <div className="text-gray-400 ml-4">↓</div>
                <div className="text-white">Step 3: Validate AST Result</div>
                <div className="text-gray-400 ml-4">├─ Valid → Step 5: Accept changes</div>
                <div className="text-gray-400 ml-4">└─ Invalid → Try Regex Fallback</div>
                <div className="text-purple-400 ml-8">↓</div>
                <div className="text-purple-400 ml-8">Step 4: Validate Regex Result</div>
                <div className="text-gray-400 ml-8">├─ Valid → Step 5: Accept changes</div>
                <div className="text-gray-400 ml-8">└─ Invalid → REVERT to original</div>
              </div>
              <p className="text-lg leading-relaxed pt-6 text-gray-300 text-center">
                <span className="text-white font-bold">This is why NeuroLint never breaks your code</span> — every transformation is validated twice before acceptance.
              </p>
            </div>
          </div>
        </div>
      </section>

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
          <div className={`relative bg-gradient-to-r from-zinc-800 to-black backdrop-blur-xl border-2 border-black rounded-3xl p-8 sm:p-12 md:p-16 lg:p-24 text-center transition-all duration-700 ease-out transform shadow-lg ${
            finalCtaSectionInView
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-20 scale-95'
          }`}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 md:mb-8 tracking-tight text-white transition-all duration-700 delay-100 ease-out transform px-4 ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Stop Shipping Bugs. Start Using NeuroLint.
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 md:mb-16 max-w-4xl mx-auto font-medium transition-all duration-700 delay-200 ease-out transform px-4 ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              100% Free CLI. No registration required. Automatic backups included.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center transition-all duration-700 delay-300 ease-out transform ${
              finalCtaSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
            }`}>
              <a
                href="https://www.npmjs.com/package/@neurolint/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300 ease-out text-base sm:text-lg shadow-2xl hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[48px] touch-manipulation"
                aria-label="Install NeuroLint CLI from npm"
              >
                Install Free CLI
              </a>
              <a
                href="#comprehensive-demo"
                className="px-8 sm:px-10 py-4 sm:py-5 bg-black/60 text-white font-bold rounded-2xl border-2 border-white/20 hover:bg-black/80 hover:border-white/30 active:bg-black transition-all duration-300 ease-out text-base sm:text-lg backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[48px] touch-manipulation"
                aria-label="Try interactive demo"
              >
                Try Interactive Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
