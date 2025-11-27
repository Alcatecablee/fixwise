import React, { useEffect, useState, useRef } from "react";
import { FAQSection } from "./FAQSection";
import { ModalDemo } from "./components/ModalDemo";
import { LayersDocSection } from "./components/LayersDocSection";
import { LandingFooter } from "./LandingFooter";
import 'asciinema-player/dist/bundle/asciinema-player.css';

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
  X,
} from "lucide-react";

// Beta Banner Component - Floating notification style
const BetaBanner = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-slide-in-up">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10">
            <span className="text-sm">Beta</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-white font-medium">NeuroLint CLI is in beta.</span>{" "}
              We'd love your feedback and contributions!
            </p>
            <a 
              href="https://github.com/Alcatecablee/Neurolint-CLI/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Share feedback
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
            aria-label="Close banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

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

// CLI Demo Player Component with real asciinema player
const AsciinemaPlayerComponent = () => {
  const playerRef = React.useRef<HTMLDivElement>(null);
  const playerInstance = React.useRef<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [player, setPlayer] = React.useState<any>(null);

  // Dynamically import the player module
  React.useEffect(() => {
    import('asciinema-player').then((p) => {
      setPlayer(p);
    });
  }, []);

  // Create and dispose player instance
  React.useEffect(() => {
    if (!player || !playerRef.current || playerInstance.current) return;

    try {
      playerInstance.current = player.create(
        '/demo-new.cast',
        playerRef.current,
        {
          autoPlay: true,
          loop: true,
          speed: speed,
          fit: 'width',
        }
      );

      setIsPlaying(true);

      const intervalId = setInterval(() => {
        if (playerInstance.current) {
          setCurrentTime(playerInstance.current.getCurrentTime() || 0);
          setDuration(playerInstance.current.getDuration() || 0);
        }
      }, 100);

      return () => {
        clearInterval(intervalId);
        if (playerInstance.current) {
          try {
            playerInstance.current.dispose();
          } catch (e) {
            // Ignore disposal errors
          }
          playerInstance.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to load asciinema player:', error);
      return;
    }
  }, [player, speed]);

  const togglePlayPause = () => {
    if (!playerInstance.current) return;
    
    if (isPlaying) {
      playerInstance.current.pause();
      setIsPlaying(false);
    } else {
      playerInstance.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    if (nextSpeed !== undefined) {
      setSpeed(nextSpeed);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerInstance.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    playerInstance.current.seek(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full relative">
      <div 
        ref={playerRef} 
        className="w-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Professional Control Bar Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col gap-2">
          {/* Progress Bar */}
          <div 
            className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-green-400 rounded-full transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div className="text-white text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex-1"></div>

            {/* Speed Control */}
            <button 
              onClick={changeSpeed}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm font-mono transition-colors"
              aria-label={`Playback speed: ${speed}x`}
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Index() {
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(true);

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
      {/* Beta Banner */}
      {bannerVisible && <BetaBanner onClose={() => setBannerVisible(false)} />}

      {/* Global Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-green-500/15 to-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <nav 
        className="fixed top-0 w-full z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center group">
              <img src="/logo.png" alt="NeuroLint" className="h-9 transition-transform duration-200 group-hover:scale-105" />
            </a>
            <div className="flex items-center gap-1">
              <a 
                href="#comprehensive-demo" 
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Demo
              </a>
              <a 
                href="/quick-start" 
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Quick Start
              </a>
              <a 
                href="#faq" 
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                FAQ
              </a>
              <a 
                href="https://github.com/Alcatecablee/Neurolint-CLI/blob/main/CLI_USAGE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Docs
              </a>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <a 
                href="https://github.com/Alcatecablee/Neurolint-CLI"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://www.npmjs.com/package/@neurolint/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-5 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 text-sm"
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
              <code className="text-blue-400 font-mono text-sm md:text-base lg:text-lg block text-center pr-10">
                $ npm install -g @neurolint/cli
              </code>
              <button
                onClick={copyToClipboard}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Copy install command"
              >
                {copied ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                ) : (
                  <Copy className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up animate-delay-800">
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-black via-zinc-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8 tracking-tight text-white">
              See It In Action
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Watch NeuroLint automatically fix your code in seconds
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <span>Interactive Player</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <span>Pause & Resume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                <span>Speed Control</span>
              </div>
            </div>
          </div>
          
          {/* Terminal-style wrapper */}
          <div className="relative group">
            {/* Terminal Header */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-x-2 border-white/10 rounded-t-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                </div>
                <div className="ml-4 text-sm text-gray-400 font-mono flex items-center gap-2">
                  <span className="text-gray-500">❯</span>
                  <span>terminal — neurolint-demo</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10 font-mono">Space</kbd>
                <span>to pause/play</span>
              </div>
            </div>
            
            {/* Player Container */}
            <div className="relative bg-black border-2 border-t-0 border-white/10 rounded-b-2xl overflow-hidden shadow-2xl">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              
              {/* Player */}
              <div className="relative z-10">
                <AsciinemaPlayerComponent />
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          </div>
          
          {/* Helper text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Click inside the terminal to pause, use the controls to adjust speed, or press <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-400 font-mono text-xs">f</kbd> for fullscreen
            </p>
          </div>
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
      <section ref={orchestrationSectionRef} className="py-20 md:py-32 px-4 bg-gradient-to-b from-black via-zinc-900/30 to-black">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-700 ease-out transform ${
            orchestrationSectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`}>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8 tracking-tight text-white transition-all duration-700 delay-100 ease-out transform ${
              orchestrationSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              Why NeuroLint Never Breaks Your Code
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium leading-relaxed transition-all duration-700 delay-200 ease-out transform ${
              orchestrationSectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}>
              The 5-Step Fail-Safe Orchestration System That AI Tools Can't Match
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-20">
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
                className={`bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl p-6 md:p-8 rounded-2xl border-2 border-white/10 hover:border-white/20 hover:from-white/8 hover:to-white/4 transition-all duration-700 ease-out transform shadow-lg hover:shadow-2xl ${
                  orchestrationSectionInView
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{ transitionDelay: `${(index * 100) + 400}ms` }}
              >
                <div className="mb-4">
                  <item.Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-3">Stage {item.stage}</div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-white leading-tight">{item.title}</h3>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className={`max-w-6xl mx-auto space-y-12 transition-all duration-700 ease-out transform ${
            orchestrationSectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-20'
          }`} style={{ transitionDelay: '850ms' }}>
            
            {/* AI Tools vs NeuroLint Comparison */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden">
              <div className="bg-black/40 border-b border-white/20 p-6 md:p-8">
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-white text-center tracking-tight">AI Tools vs NeuroLint</h3>
              </div>
              <div className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-black/60 border-2 border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300">
                    <h4 className="text-xl md:text-2xl font-black text-zinc-400 mb-6">
                      AI Code Tools
                    </h4>
                    <div className="space-y-4 text-zinc-400 text-sm md:text-base">
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-zinc-500 font-mono">01</span>
                        <span>Generate code without validation</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-zinc-500 font-mono">02</span>
                        <span>Hallucinate invalid syntax</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-zinc-500 font-mono">03</span>
                        <span>Break production deployments</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-zinc-500 font-mono">04</span>
                        <span>Waste developer time debugging</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/60 border-2 border-white/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    <h4 className="text-xl md:text-2xl font-black text-white mb-6 relative">
                      NeuroLint
                    </h4>
                    <div className="space-y-4 text-gray-200 text-sm md:text-base relative">
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/10 border border-white/20">
                        <span className="text-white font-mono font-bold">01</span>
                        <span>Validate every transformation twice</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/10 border border-white/20">
                        <span className="text-white font-mono font-bold">02</span>
                        <span>Deterministic, rule-based fixes</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/10 border border-white/20">
                        <span className="text-white font-mono font-bold">03</span>
                        <span>Auto-revert on validation failure</span>
                      </div>
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-white/10 border border-white/20">
                        <span className="text-white font-mono font-bold">04</span>
                        <span>Guaranteed valid code output</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
