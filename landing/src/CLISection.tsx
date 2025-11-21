import React, { useState, useEffect } from "react";
import {
  Terminal,
  Users,
  BarChart3,
  Key,
  FileText,
  Download,
  ExternalLink,
  Monitor,
  Zap,
  Database,
  Shield,
  Settings,
  Webhook,
  Check,
} from "lucide-react";

function TypingTerminal() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const terminalLines = [
    "$ npm install -g @neurolint/cli",
    "Installing NeuroLint CLI...",
    "[SUCCESS] Installation complete - 100% Free!",
    "$ neurolint analyze src/",
    "[PROCESSING] Analyzing files...",
    "[INFO] Found 47 React & Next.js files",
    "[FOUND] 12 hydration crashes (window is not defined)",
    "[FOUND] 18 missing React keys in .map() loops",
    "[FOUND] 8 ESLint errors blocking deploy",
    "[FOUND] 5 accessibility issues (missing aria-labels)",
    "[FOUND] 4 Next.js App Router migration issues",
    "[COMPLETE] Analysis complete - 47 issues found",
    "$ neurolint fix src/ --backup",
    "[PROCESSING] Applying automatic fixes...",
    "[SUCCESS] Fixed all 12 hydration crashes",
    "[SUCCESS] Added 18 React keys automatically",
    "[SUCCESS] Fixed 8 ESLint errors",
    "[SUCCESS] Added 5 aria-labels for accessibility",
    "[SUCCESS] Created automatic backup in .neurolint/backup",
    "[COMPLETE] All fixes applied - 0 breaking changes",
  ];

  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) return;

    let timeout: NodeJS.Timeout;
    const currentLine = terminalLines[currentLineIndex];
    const isCommand = currentLine.startsWith("$");
    const typingSpeed = isCommand ? 80 : 40;

    if (currentCharIndex < currentLine.length) {
      // Type next character
      timeout = setTimeout(() => {
        setCurrentText(currentLine.substring(0, currentCharIndex + 1));
        setCurrentCharIndex((prev) => prev + 1);
      }, typingSpeed);
    } else {
      // Line completed, wait then move to next line
      timeout = setTimeout(
        () => {
          setDisplayedLines((prev) => [...prev, currentLine]);
          setCurrentLineIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
          setCurrentText("");
        },
        isCommand ? 1000 : 500,
      );
    }

    return () => clearTimeout(timeout);
  }, [currentLineIndex, currentCharIndex, terminalLines]);

  const renderLine = (line: string) => {
    if (line.startsWith("$ npm install")) {
      // npm install command with syntax highlighting
      return (
        <div className="flex">
          <span className="text-green-400">$</span>
          <span className="text-blue-400 ml-2">npm</span>
          <span className="text-white ml-2">install -g</span>
          <span className="text-yellow-400 ml-2">@neurolint/cli</span>
        </div>
      );
    } else if (line.startsWith("$ neurolint")) {
      // neurolint commands with syntax highlighting
      const parts = line.substring(2).split(" ");
      return (
        <div className="flex">
          <span className="text-green-400">$</span>
          <span className="text-blue-400 ml-2">{parts[0]}</span>
          {parts.slice(1).map((part, i) => (
            <span key={i} className={i === 0 ? "text-cyan-400 ml-2" : "text-white ml-2"}>
              {part}
            </span>
          ))}
        </div>
      );
    } else if (line.startsWith("[SUCCESS]")) {
      return <div className="text-green-400 pl-2">{line}</div>;
    } else if (line.startsWith("[WARNING]")) {
      return <div className="text-yellow-400 pl-2">{line}</div>;
    } else if (line.startsWith("[INFO]")) {
      return <div className="text-blue-400 pl-2">{line}</div>;
    } else if (line.startsWith("[PROCESSING]")) {
      return <div className="text-cyan-400 pl-2">{line}</div>;
    } else if (line.startsWith("[COMPLETE]")) {
      return <div className="text-green-400 pl-2">{line}</div>;
    } else if (line.startsWith("✓")) {
      return <div className="text-green-400 pl-2">{line}</div>;
    } else if (line.startsWith("⚠")) {
      return <div className="text-yellow-400 pl-2">{line}</div>;
    } else if (line === "NeuroLint CLI") {
      return <div className="text-white font-bold pl-2">{line}</div>;
    } else if (line.startsWith("●")) {
      return (
        <div className="text-gray-300 pl-4">
          <span className="text-green-400">●</span>
          <span className="ml-2">{line.substring(2)}</span>
        </div>
      );
    } else if (line.startsWith("  ")) {
      return <div className="text-gray-300 pl-6">{line}</div>;
    } else if (line.includes("neurolint") && line.includes(" - ")) {
      const [command, description] = line.split(" - ");
      return (
        <div className="text-gray-300 pl-2">
          <span className="text-cyan-400">{command}</span>
          <span> - {description}</span>
        </div>
      );
    } else {
      return <div className="text-gray-400 pl-2">{line}</div>;
    }
  };

  return (
    <div className="font-mono text-sm space-y-2 bg-black p-6 rounded-2xl border border-zinc-800 min-h-[400px]">
      {/* Completed lines */}
      {displayedLines.map((line, index) => (
        <div key={index}>{renderLine(line)}</div>
      ))}

      {/* Currently typing line */}
      {currentLineIndex < terminalLines.length && (
        <div className="flex items-center">
          <span className="text-white">{currentText}</span>
          <span className="text-green-400 ml-1 animate-pulse">█</span>
        </div>
      )}

      {/* Final prompt when done */}
      {currentLineIndex >= terminalLines.length && (
        <div className="flex items-center">
          <span className="text-green-400">$</span>
          <span className="text-green-400 ml-2 animate-pulse">█</span>
        </div>
      )}
    </div>
  );
}

export function CLISection() {
  const [copied, setCopied] = useState(false);

  const handleInstallClick = async () => {
    const installCommand = "npm install -g @neurolint/cli";

    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      
      // Use proper timer management
      const copyTimer = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      // Cleanup timer on component unmount
      return () => {
        if (copyTimer) {
          clearTimeout(copyTimer);
        }
      };
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = installCommand;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      
      // Use proper timer management
      const copyTimer = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      // Cleanup timer on component unmount
      return () => {
        if (copyTimer) {
          clearTimeout(copyTimer);
        }
      };
    }
  };

  const handleNpmClick = () => {
    window.open("https://www.npmjs.com/package/@neurolint/cli", "_blank", "noopener,noreferrer");
  };



  return (
    <section className="py-24 px-4" role="region" aria-labelledby="cli-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            id="cli-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            100% Free CLI Tool
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Rule-based transformations (not AI) that fix hydration crashes, missing keys, and ESLint errors. 
            No registration required. Automatic backups included.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white tracking-tight">
                Install from NPM
              </h3>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl flex items-center gap-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-6 h-6" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6" />
                      Copy Install Command
                    </>
                  )}
                </button>

                <button
                  onClick={handleNpmClick}
                  className="border-2 border-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:border-zinc-600 transition-all duration-300 flex items-center gap-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  View on NPM
                </button>
                <a
                  href="https://app.neurolint.dev/docs#cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:border-zinc-600 transition-all duration-300 flex items-center gap-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Documentation
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Zap className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    7-Layer Auto-Fix Engine
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Rule-based transformations across configuration, patterns, components, and more
                </p>
              </div>
              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Shield className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    95% Accuracy Guarantee
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Not AI-based - deterministic rule engine ensures consistent, reliable fixes
                </p>
              </div>
              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Check className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    Zero Breaking Changes
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Every fix is validated automatically - no manual testing required
                </p>
              </div>
              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Settings className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    Instant Rollback
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  One command to revert any changes - complete safety and control
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border-2 border-zinc-800 rounded-3xl p-10 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900/50">
            <div className="flex items-center gap-3 mb-6 text-sm text-gray-300">
              <Terminal className="w-5 h-5" />
              <span className="font-medium">Terminal</span>
              <div className="flex gap-2 ml-auto">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <TypingTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
