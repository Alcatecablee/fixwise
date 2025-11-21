import React from "react";
import { Code2, Lightbulb, Eye, Settings, Download, Star } from "lucide-react";

export function VSCodeSection() {
  return (
    <section
      className="py-24 px-4"
      role="region"
      aria-labelledby="vscode-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            id="vscode-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            Auto-Fix in Your Editor
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Experience NeuroLint's 7-layer auto-fix engine directly in VS Code. 
            Rule-based transformations (not AI) that actually fix your code, not just suggest changes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* VS Code Screenshot/Demo */}
          <div className="order-1 lg:order-1">
            <div className="bg-[#111111] border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl hover:border-zinc-600 transition-all duration-300">
              {/* VS Code Title Bar */}
              <div className="bg-zinc-900 px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-300 ml-4 font-medium">
                  LegacyComponent.tsx - 7-Layer Auto-Fix
                </div>
              </div>

              {/* VS Code Interface */}
              <div className="bg-black p-6">
                <div className="font-mono text-sm space-y-2">
                  <div className="text-gray-400">
                    1 import React, &#123; Component &#125; from 'react';
                  </div>
                  <div className="text-gray-400">2 </div>
                  <div className="flex items-center">
                    <div className="text-gray-400 mr-1">3</div>
                    <div className="text-red-400 mr-1">class Header extends Component &#123;</div>
                    <div className="bg-green-500 text-white px-2 py-1 text-xs rounded-md font-medium">
                      Auto-fix available
                    </div>
                  </div>
                  <div className="text-gray-400">
                    4 render() &#123;
                  </div>
                  <div className="text-gray-400">
                    5 const items = ['Home', 'About', 'Contact'];
                  </div>
                  <div className="text-gray-400">6 </div>
                  <div className="text-gray-400">
                    7 return (
                  </div>
                  <div className="text-gray-400">
                    8 &lt;div&gt;&#123;items.map(item =&gt;
                  </div>
                  <div className="text-gray-400">
                    9 &lt;div&gt;&#123;item&#125;&lt;/div&gt;)&#125;
                  </div>
                  <div className="text-gray-400">10 &lt;/div&gt;</div>
                  <div className="text-gray-400">11 );</div>
                  <div className="text-gray-400">12 &#125; &#125;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="order-2 lg:order-2 space-y-8">
            <h3 className="text-2xl font-black text-white mb-8 tracking-tight">
              Auto-Fix Smarter with 7-Layer Engine
            </h3>

            <div className="space-y-4">
              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Code2 className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    7-Layer Auto-Fix Engine
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Rule-based transformations across configuration, patterns, components, 
                  SSR/hydration, and performance optimization.
                </p>
              </div>

              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Lightbulb className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    Instant Auto-Fixes
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Not AI-based - deterministic rule engine applies fixes automatically 
                  with 95% accuracy and zero breaking changes.
                </p>
              </div>

              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Eye className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    Real-Time Validation
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Every fix is validated in real-time with before/after comparisons 
                  and instant rollback capabilities.
                </p>
              </div>

              <div className="bg-black/70 backdrop-blur-xl p-6 rounded-3xl border-2 border-zinc-800/50 hover:border-zinc-600/80 transition-all duration-300 hover:bg-black/90 group">
                <div className="flex items-center gap-4 mb-3">
                  <Settings className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  <h4 className="text-xl font-black text-white">
                    One-Click Fixes
                  </h4>
                </div>
                <p className="text-gray-300 leading-relaxed font-medium">
                  Click any highlighted issue to apply the fix instantly. 
                  No manual refactoring required.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 flex-wrap">
              <a
                href="https://marketplace.visualstudio.com/items?itemName=neurolint.neurolint-vscode"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl flex items-center gap-3"
              >
                <Download className="w-6 h-6" />
                Install Extension
              </a>
              <a
                href="https://app.neurolint.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:border-zinc-600 transition-all duration-300"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
