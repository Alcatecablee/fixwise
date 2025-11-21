import React from "react";
import { Code, Settings, Cpu, Database, Zap, Target } from "lucide-react";

export const TechnologySection: React.FC = () => {
  const technologies = [
    {
      icon: Code,
      title: "AST Parsing",
      description:
        "Advanced Abstract Syntax Tree parsing using Babel for precise code analysis and transformation",
      current: true,
    },
    {
      icon: Settings,
      title: "Rule-Based Engine",
      description:
        "Sophisticated pattern matching and rule-based transformations for consistent code improvements",
      current: true,
    },
    {
      icon: Cpu,
      title: "6-Layer Architecture",
      description:
        "Modular transformation pipeline: Configuration, Entities, Components, Hydration, Next.js, Testing",
      current: true,
    },
    {
      icon: Database,
      title: "Code Validation",
      description:
        "Multi-stage validation ensuring transformations maintain code integrity and functionality",
      current: true,
    },
    {
      icon: Zap,
      title: "Machine Learning",
      description:
        "Neural networks for pattern recognition and context-aware code analysis",
      current: false,
      comingSoon: true,
    },
    {
      icon: Target,
      title: "Adaptive Learning",
      description:
        "Self-improving algorithms that learn from codebases and user feedback",
      current: false,
      comingSoon: true,
    },
  ];

  return (
    <section
      id="technology"
      className="py-24 px-4"
      role="region"
      aria-labelledby="technology-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2
            id="technology-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            How NeuroLint Works
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Currently in beta with AI-ready architecture. Built on proven
            rule-based technologies with comprehensive patterns designed for
            future AI integration.
          </p>
        </div>

        {/* Current Implementation */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            Current Implementation
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {technologies
              .filter((tech) => tech.current)
              .map((tech, index) => (
                <div
                  key={index}
                  className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <tech.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {tech.title}
                      </h4>
                      <p className="text-zinc-400 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* AI Features Coming Soon */}
        <div>
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            AI Integration Roadmap
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {technologies
              .filter((tech) => tech.comingSoon)
              .map((tech, index) => (
                <div
                  key={index}
                  className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl relative opacity-75"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <tech.icon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-zinc-300 mb-2">
                        {tech.title}
                      </h4>
                      <p className="text-zinc-500 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Transparency Note */}
        <div className="mt-16 p-8 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Built for Transparency
            </h3>
            <p className="text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              NeuroLint uses sophisticated rule-based transformations and AST
              parsing to deliver reliable code improvements. Currently in beta
              with AI-ready architecture. AI integration planned for future
              releases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
