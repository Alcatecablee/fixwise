import { Copy, Check, X } from "lucide-react";
import { useState } from "react";

const BetaBanner = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm md:text-base">
        <p className="text-center">
          <strong>NeuroLint CLI is currently in beta.</strong> We're actively improving and would love your feedback and contribution!
        </p>
        <button
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Close banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export function QuickStart() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  const copyToClipboard = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CommandBlock = ({ 
    command, 
    id
  }: { 
    command: string; 
    id: string;
  }) => (
    <div className="max-w-2xl mx-auto bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 md:p-5 backdrop-blur-sm relative group hover:border-zinc-600/50 transition-colors duration-300 mb-4">
      <code className="text-green-400 font-mono text-sm md:text-base block text-center pr-10">
        {command}
      </code>
      <button
        onClick={() => copyToClipboard(command, id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors"
        aria-label="Copy command"
      >
        {copiedCommand === id ? (
          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white" />
        )}
      </button>
    </div>
  );

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
        className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-md border-b border-white/10 transition-all duration-300" 
        style={{ marginTop: bannerVisible ? '48px' : '0' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="NeuroLint" className="h-9" />
            </a>
            <div className="flex items-center gap-6">
              <a 
                href="/" 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Home
              </a>
              <a 
                href="/quick-start" 
                className="text-white font-medium text-sm"
              >
                Quick Start
              </a>
              <a 
                href="/#faq" 
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

      {/* Main Content */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-4 py-16 pt-20 relative"
        aria-label="Quick Start Guide"
        role="main"
      >
        <div className="max-w-6xl mx-auto z-10">
          <div className="mb-6 md:mb-8">
            <span
              className="inline-block px-4 md:px-5 py-1.5 md:py-2 bg-white text-black rounded-full text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition-shadow duration-300 cursor-default"
            >
              Complete CLI Reference
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white">
            Quick Start
          </h1>
          
          <div className="mb-12">
            <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              All NeuroLint commands with examples for Windows and Mac
            </p>
          </div>

          {/* Basic Commands */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Basic Commands</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">Show Version</h3>
            <CommandBlock command="neurolint --version" id="version" />
            
            <h3 className="text-lg text-gray-300 mb-4">Show Help</h3>
            <CommandBlock command="neurolint --help" id="help" />
            
            <h3 className="text-lg text-gray-300 mb-4">Show All Layers</h3>
            <CommandBlock command="neurolint layers" id="layers" />
          </div>

          {/* Analysis Commands */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-4">Analysis Commands (Safe - No Changes)</h2>
            <p className="text-sm text-gray-400 mb-8">These commands analyze your project without making any modifications</p>
            
            <h3 className="text-lg text-gray-300 mb-4">Analyze Project</h3>
            <CommandBlock command="neurolint analyze C:\Users\YourName\your-project" id="analyze-win" />
            <CommandBlock command="neurolint analyze /Users/YourName/your-project" id="analyze-mac" />
            <CommandBlock command="neurolint analyze C:\Users\YourName\your-project --verbose" id="analyze-verbose-win" />
            <CommandBlock command="neurolint analyze /Users/YourName/your-project --verbose" id="analyze-verbose-mac" />
            <CommandBlock command="neurolint analyze C:\Users\YourName\your-project\src --verbose" id="analyze-folder-win" />
            <CommandBlock command="neurolint analyze /Users/YourName/your-project/src --verbose" id="analyze-folder-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Check Project Statistics</h3>
            <CommandBlock command="neurolint stats C:\Users\YourName\your-project --verbose" id="stats-win" />
            <CommandBlock command="neurolint stats /Users/YourName/your-project --verbose" id="stats-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Validate Without Changes</h3>
            <CommandBlock command="neurolint validate C:\Users\YourName\your-project --verbose" id="validate-win" />
            <CommandBlock command="neurolint validate /Users/YourName/your-project --verbose" id="validate-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Check React 19 Dependency Compatibility</h3>
            <CommandBlock command="neurolint check-deps C:\Users\YourName\your-project --verbose" id="check-deps-win" />
            <CommandBlock command="neurolint check-deps /Users/YourName/your-project --verbose" id="check-deps-mac" />
            <CommandBlock command="neurolint check-deps C:\Users\YourName\your-project --fix --verbose" id="check-deps-fix-win" />
            <CommandBlock command="neurolint check-deps /Users/YourName/your-project --fix --verbose" id="check-deps-fix-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Check Turbopack Migration Readiness</h3>
            <CommandBlock command="neurolint check-turbopack C:\Users\YourName\your-project --verbose" id="turbopack-win" />
            <CommandBlock command="neurolint check-turbopack /Users/YourName/your-project --verbose" id="turbopack-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Check React Compiler Opportunities</h3>
            <CommandBlock command="neurolint check-compiler C:\Users\YourName\your-project --verbose" id="compiler-win" />
            <CommandBlock command="neurolint check-compiler /Users/YourName/your-project --verbose" id="compiler-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Assess Router Complexity</h3>
            <CommandBlock command="neurolint assess-router C:\Users\YourName\your-project --verbose" id="router-win" />
            <CommandBlock command="neurolint assess-router /Users/YourName/your-project --verbose" id="router-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Detect React 19.2 Feature Opportunities</h3>
            <CommandBlock command="neurolint detect-react192 C:\Users\YourName\your-project --verbose" id="react192-win" />
            <CommandBlock command="neurolint detect-react192 /Users/YourName/your-project --verbose" id="react192-mac" />
          </div>

          {/* Dry Run Commands */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-4">Dry Run Commands (Preview Changes - No Modifications)</h2>
            <p className="text-sm text-gray-400 mb-8">See what would be fixed without actually changing your files</p>
            
            <h3 className="text-lg text-gray-300 mb-4">Preview All Layer Fixes</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --dry-run --verbose" id="preview-all-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --dry-run --verbose" id="preview-all-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Preview Specific Layer Fixes</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=1 --dry-run --verbose" id="layer1-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=1 --dry-run --verbose" id="layer1-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=2 --dry-run --verbose" id="layer2-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=2 --dry-run --verbose" id="layer2-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=3 --dry-run --verbose" id="layer3-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=3 --dry-run --verbose" id="layer3-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=4 --dry-run --verbose" id="layer4-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=4 --dry-run --verbose" id="layer4-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=5 --dry-run --verbose" id="layer5-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=5 --dry-run --verbose" id="layer5-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=6 --dry-run --verbose" id="layer6-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=6 --dry-run --verbose" id="layer6-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=7 --dry-run --verbose" id="layer7-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=7 --dry-run --verbose" id="layer7-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=1,2,3 --dry-run --verbose" id="layers-multi-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=1,2,3 --dry-run --verbose" id="layers-multi-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Preview Migration Commands</h3>
            <CommandBlock command="neurolint migrate-react19 C:\Users\YourName\your-project --dry-run --verbose" id="migrate-react19-preview-win" />
            <CommandBlock command="neurolint migrate-react19 /Users/YourName/your-project --dry-run --verbose" id="migrate-react19-preview-mac" />
            <CommandBlock command="neurolint migrate-nextjs-16 C:\Users\YourName\your-project --dry-run --verbose" id="migrate-next16-preview-win" />
            <CommandBlock command="neurolint migrate-nextjs-16 /Users/YourName/your-project --dry-run --verbose" id="migrate-next16-preview-mac" />
            <CommandBlock command="neurolint migrate-nextjs-15.5 C:\Users\YourName\your-project --dry-run --verbose" id="migrate-next155-preview-win" />
            <CommandBlock command="neurolint migrate-nextjs-15.5 /Users/YourName/your-project --dry-run --verbose" id="migrate-next155-preview-mac" />
            <CommandBlock command="neurolint migrate-biome C:\Users\YourName\your-project --dry-run --verbose" id="migrate-biome-preview-win" />
            <CommandBlock command="neurolint migrate-biome /Users/YourName/your-project --dry-run --verbose" id="migrate-biome-preview-mac" />
          </div>

          {/* Actual Fix Commands */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Actual Fix Commands (MAKES CHANGES - Use with caution)</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">Apply Fixes with Backup</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --backup --verbose" id="fix-backup-all-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --backup --verbose" id="fix-backup-all-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=1,2,3 --backup --verbose" id="fix-backup-specific-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=1,2,3 --backup --verbose" id="fix-backup-specific-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Apply Fixes Without Backup (Use with caution)</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --verbose" id="fix-no-backup-all-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --verbose" id="fix-no-backup-all-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=1 --verbose" id="fix-no-backup-layer1-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=1 --verbose" id="fix-no-backup-layer1-mac" />
          </div>

          {/* Migration Commands */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Migration Commands (MAKES CHANGES)</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">React 19 Migration</h3>
            <CommandBlock command="neurolint migrate-react19 C:\Users\YourName\your-project --backup --verbose" id="migrate-react19-backup-win" />
            <CommandBlock command="neurolint migrate-react19 /Users/YourName/your-project --backup --verbose" id="migrate-react19-backup-mac" />
            <CommandBlock command="neurolint migrate-react19 C:\Users\YourName\your-project --verbose" id="migrate-react19-no-backup-win" />
            <CommandBlock command="neurolint migrate-react19 /Users/YourName/your-project --verbose" id="migrate-react19-no-backup-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Next.js 16 Migration</h3>
            <CommandBlock command="neurolint migrate-nextjs-16 C:\Users\YourName\your-project --backup --verbose" id="migrate-next16-win" />
            <CommandBlock command="neurolint migrate-nextjs-16 /Users/YourName/your-project --backup --verbose" id="migrate-next16-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Biome Migration</h3>
            <CommandBlock command="neurolint migrate-biome C:\Users\YourName\your-project --backup --verbose" id="migrate-biome-win" />
            <CommandBlock command="neurolint migrate-biome /Users/YourName/your-project --backup --verbose" id="migrate-biome-mac" />
          </div>

          {/* Backup Management */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Backup Management</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">List Backups</h3>
            <CommandBlock command="neurolint backup list" id="backup-list" />
            
            <h3 className="text-lg text-gray-300 mb-4">Restore from Backup</h3>
            <CommandBlock command="neurolint restore --interactive" id="restore" />
          </div>

          {/* Testing Workflow */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Testing Workflow (Recommended Order)</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">Step 1: Analyze First</h3>
            <CommandBlock command="neurolint analyze C:\Users\YourName\your-project --verbose" id="workflow-analyze-win" />
            <CommandBlock command="neurolint analyze /Users/YourName/your-project --verbose" id="workflow-analyze-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Step 2: Check Dependencies</h3>
            <CommandBlock command="neurolint check-deps C:\Users\YourName\your-project --verbose" id="workflow-deps-win" />
            <CommandBlock command="neurolint check-deps /Users/YourName/your-project --verbose" id="workflow-deps-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Step 3: Preview Fixes</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --dry-run --verbose" id="workflow-preview-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --dry-run --verbose" id="workflow-preview-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Step 4: Apply Layer by Layer (Safest Approach)</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=1 --backup --verbose" id="workflow-layer1-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=1 --backup --verbose" id="workflow-layer1-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=2 --backup --verbose" id="workflow-layer2-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=2 --backup --verbose" id="workflow-layer2-mac" />
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --layers=3 --backup --verbose" id="workflow-layer3-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --layers=3 --backup --verbose" id="workflow-layer3-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">Step 5: Validate</h3>
            <CommandBlock command="neurolint validate C:\Users\YourName\your-project --verbose" id="workflow-validate-win" />
            <CommandBlock command="neurolint validate /Users/YourName/your-project --verbose" id="workflow-validate-mac" />
          </div>

          {/* Quick Reference by Use Case */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Quick Reference by Use Case</h2>
            
            <h3 className="text-lg text-gray-300 mb-4">"I want to see what issues exist"</h3>
            <CommandBlock command="neurolint analyze C:\Users\YourName\your-project --verbose" id="usecase-issues-win" />
            <CommandBlock command="neurolint analyze /Users/YourName/your-project --verbose" id="usecase-issues-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">"I want to see what would be fixed"</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --dry-run --verbose" id="usecase-preview-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --dry-run --verbose" id="usecase-preview-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">"I want to fix everything safely"</h3>
            <CommandBlock command="neurolint fix C:\Users\YourName\your-project --all-layers --backup --verbose" id="usecase-fix-win" />
            <CommandBlock command="neurolint fix /Users/YourName/your-project --all-layers --backup --verbose" id="usecase-fix-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">"I want to migrate to React 19"</h3>
            <CommandBlock command="neurolint migrate-react19 C:\Users\YourName\your-project --dry-run --verbose" id="usecase-react19-preview-win" />
            <CommandBlock command="neurolint migrate-react19 /Users/YourName/your-project --dry-run --verbose" id="usecase-react19-preview-mac" />
            <CommandBlock command="neurolint migrate-react19 C:\Users\YourName\your-project --backup --verbose" id="usecase-react19-apply-win" />
            <CommandBlock command="neurolint migrate-react19 /Users/YourName/your-project --backup --verbose" id="usecase-react19-apply-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">"I want to check Turbopack compatibility"</h3>
            <CommandBlock command="neurolint check-turbopack C:\Users\YourName\your-project --verbose" id="usecase-turbopack-win" />
            <CommandBlock command="neurolint check-turbopack /Users/YourName/your-project --verbose" id="usecase-turbopack-mac" />

            <h3 className="text-lg text-gray-300 mb-4 mt-8">"I need to undo changes"</h3>
            <CommandBlock command="neurolint restore --interactive" id="usecase-undo" />
          </div>

          {/* Notes */}
          <div className="mb-16 text-left">
            <h2 className="text-2xl font-bold text-white mb-8">Notes</h2>
            <div className="text-sm text-gray-400 space-y-2">
              <p>• Always use <code className="text-green-400">--dry-run</code> first to preview changes before applying</p>
              <p>• Always use <code className="text-green-400">--backup</code> when making actual changes to create restore points</p>
              <p>• Use <code className="text-green-400">--verbose</code> to see detailed output and understand what's happening</p>
              <p>• The CLI validates all transformations twice (AST + regex fallback) to prevent breaking your code</p>
              <p>• All paths can be relative or absolute</p>
              <p>• On Windows, use backslashes <code className="text-green-400">\</code> or forward slashes <code className="text-green-400">/</code> in paths</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-zinc-800 py-12 px-4 text-center text-gray-400">
        <div className="max-w-7xl mx-auto">
          <p className="mb-6">© 2024 NeuroLint. All rights reserved.</p>
          <div className="flex justify-center gap-8 text-sm">
            <a 
              href="https://github.com/Alcatecablee/Neurolint-CLI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors font-medium"
            >
              GitHub
            </a>
            <a 
              href="https://www.npmjs.com/package/@neurolint/cli" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors font-medium"
            >
              npm
            </a>
            <a 
              href="mailto:clivemakazhu@gmail.com"
              className="hover:text-white transition-colors font-medium"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
