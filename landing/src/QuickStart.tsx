import { Copy, Check, Terminal, Play, Eye, Shield, RotateCcw } from "lucide-react";
import { useState } from "react";

export function QuickStart() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CommandBlock = ({ 
    command, 
    id, 
    description 
  }: { 
    command: string; 
    id: string; 
    description?: string;
  }) => (
    <div className="group">
      <div className="relative bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-4 hover:border-zinc-600/50 transition-colors duration-300">
        <code className="text-green-400 font-mono text-sm block pr-10 break-all">
          {command}
        </code>
        <button
          onClick={() => copyToClipboard(command, id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Copy command"
        >
          {copiedCommand === id ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />
          )}
        </button>
      </div>
      {description && (
        <p className="text-sm text-gray-400 mt-2">{description}</p>
      )}
    </div>
  );

  return (
    <section
      id="quick-start"
      className="w-full flex flex-col items-center py-24 px-4 bg-gradient-to-b from-black via-zinc-900/50 to-black"
      role="region"
      aria-labelledby="quick-start-heading"
    >
      <div className="max-w-4xl w-full">
        <h2
          id="quick-start-heading"
          className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white text-center"
        >
          Quick Start
        </h2>
        <p className="text-xl text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          Get started with NeuroLint in minutes. Simple commands to analyze and fix your code.
        </p>

        <div className="space-y-12">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              Installation
            </h3>
            <div className="space-y-3">
              <CommandBlock
                command="npm install -g @neurolint/cli"
                id="install"
                description="Install NeuroLint globally on your system"
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Check Your Code (Safe)
            </h3>
            <p className="text-gray-300 mb-4">
              These commands analyze your project without making any changes
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Windows</h4>
                <CommandBlock
                  command="neurolint analyze C:\Users\YourName\your-project"
                  id="analyze-win"
                  description="See what issues exist in your code"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Mac</h4>
                <CommandBlock
                  command="neurolint analyze /Users/YourName/your-project"
                  id="analyze-mac"
                  description="See what issues exist in your code"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Play className="w-6 h-6" />
              Preview Changes (Safe)
            </h3>
            <p className="text-gray-300 mb-4">
              See what would be fixed without actually changing your files
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Windows</h4>
                <CommandBlock
                  command="neurolint fix C:\Users\YourName\your-project --all-layers --dry-run"
                  id="preview-win"
                  description="Preview all fixes before applying them"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Mac</h4>
                <CommandBlock
                  command="neurolint fix /Users/YourName/your-project --all-layers --dry-run"
                  id="preview-mac"
                  description="Preview all fixes before applying them"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Fix Your Code (With Backup)
            </h3>
            <p className="text-gray-300 mb-4">
              Apply fixes to your code with automatic backup for safety
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Windows</h4>
                <CommandBlock
                  command="neurolint fix C:\Users\YourName\your-project --all-layers --backup"
                  id="fix-win"
                  description="Fix all issues with automatic backup"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Mac</h4>
                <CommandBlock
                  command="neurolint fix /Users/YourName/your-project --all-layers --backup"
                  id="fix-mac"
                  description="Fix all issues with automatic backup"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <RotateCcw className="w-6 h-6" />
              Backup Management
            </h3>
            <p className="text-gray-300 mb-4">
              Manage your backups and restore if needed
            </p>
            <div className="space-y-3">
              <CommandBlock
                command="neurolint backup list"
                id="backup-list"
                description="See all your backups"
              />
              <CommandBlock
                command="neurolint restore --interactive"
                id="restore"
                description="Restore from a backup if something goes wrong"
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-3">Recommended Workflow</h3>
            <ol className="space-y-2 text-gray-300">
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">1.</span>
                <span>Run <code className="text-green-400 font-mono text-sm">analyze</code> to see what issues exist</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">2.</span>
                <span>Run <code className="text-green-400 font-mono text-sm">fix --dry-run</code> to preview changes</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">3.</span>
                <span>Run <code className="text-green-400 font-mono text-sm">fix --backup</code> to apply fixes safely</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">4.</span>
                <span>Use <code className="text-green-400 font-mono text-sm">restore</code> if you need to undo changes</span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-300 mb-2">Pro Tip</h3>
            <p className="text-gray-300">
              Replace <code className="text-green-400 font-mono text-sm">C:\Users\YourName\your-project</code> (Windows) or{" "}
              <code className="text-green-400 font-mono text-sm">/Users/YourName/your-project</code> (Mac) with the actual path to your project folder.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
