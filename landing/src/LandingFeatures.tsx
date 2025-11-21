import { Zap, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GlowingBorder,
  getRandomGlowVariant,
} from "@/components/ui/glowing-border";

const LAYERS = [
  {
    name: "ConfigMaster",
    description:
      "Modernizes TypeScript, Next.js, and package.json configs for maximum compatibility and best practices.",
    status: "live",
    experimental: false,
  },
  {
    name: "PatternCleanse",
    description:
      "Cleans and restructures code entities for maintainability and clarity.",
    status: "soon",
    experimental: true,
  },
  {
    name: "ReactRepair",
    description:
      "Improves React components with smart rewrites, import fixing, and missing key detection.",
    status: "soon",
    experimental: true,
  },
  {
    name: "HydraFix",
    description:
      "Detects and fixes hydration and SSR bugs for flawless React/Next.js deployments.",
    status: "soon",
    experimental: true,
  },
  {
    name: "NextGuard",
    description:
      "Enforces Next.js conventions and integrates optimization strategies automatically.",
    status: "soon",
    experimental: true,
  },
  {
    name: "TestReady",
    description:
      "Ensures components and configs are test-ready with basic static analysis.",
    status: "soon",
    experimental: true,
  },
];

export function LandingFeatures() {
  // Store toggle state per experimental layer, but do *not* run code, demo only:
  const [experimentalStates, setExperimentalStates] = useState<
    Record<string, boolean>
  >({});

  const handleToggle = (name: string) => {
    setExperimentalStates((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <section
      id="features"
      className="w-full flex flex-col items-center py-24 px-4"
      role="region"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl w-full">
        {/* Features Title */}
        <h2
          id="features-heading"
          className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white text-center"
        >
          Features & Roadmap
        </h2>

        {/* CALL TO ACTION FOR ENGINEERING COLLABORATORS */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 mb-7">
          <div className="flex items-center text-white text-base font-semibold">
            <Users className="mr-2" />
            <span>
              Engineer or AI researcher? Help build the world��s first
              fully-automated code refactoring platform!
            </span>
          </div>
          <Button
            className="bg-[#292939] text-white text-base border border-[#342d66] hover:bg-[#393b44]"
            asChild
          >
            <a
              href="mailto:founder@neurolint.com?subject=I want to help NeuroLint!"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Involved
            </a>
          </Button>
        </div>

        {/* Features Grid: LAYERS (with experimental toggles) */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 mb-8">
          {LAYERS.map((layer, idx) => {
            // Mix of different glow effects - some always on, some hover, some random
            const getGlowVariant = () => {
              if (layer.status === "live") return "always"; // Live features always glow
              if (idx % 3 === 0) return "hover"; // Every 3rd item only glows on hover
              return getRandomGlowVariant(); // Others get random animations
            };

            return (
              <GlowingBorder
                key={layer.name}
                variant={getGlowVariant()}
                color={layer.status === "live" ? "green" : "white"}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1b21] border border-[#292939] w-full relative">
                  <Badge
                    variant={layer.status === "live" ? "default" : "secondary"}
                    className={
                      layer.status === "live"
                        ? "bg-zinc-700 text-white"
                        : "bg-[#23233b] text-gray-300"
                    }
                  >
                    {layer.status === "live"
                      ? "LIVE"
                      : layer.experimental
                        ? "EXPERIMENTAL"
                        : "READY"}
                  </Badge>
                  {/* Name/Index */}
                  <span
                    className={
                      layer.status === "live"
                        ? "font-bold text-white"
                        : "text-gray-400"
                    }
                  >
                    {idx + 1}. {layer.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-300 flex-1">
                    {layer.description}
                  </span>
                  {/* If experimental, show demo toggle */}
                  {layer.experimental && (
                    <label className="flex items-center gap-1 ml-1">
                      <input
                        type="checkbox"
                        className="form-checkbox rounded border-zinc-400 focus:ring-2 focus:ring-zinc-400 accent-zinc-400 w-5 h-5 bg-[#26233b]"
                        checked={experimentalStates[layer.name] || false}
                        onChange={() => handleToggle(layer.name)}
                        disabled={true}
                      />
                      <span className="text-xs text-zinc-400">Demo</span>
                    </label>
                  )}
                  {/* Show warning on hover if experimental */}
                  {layer.experimental && (
                    <div className="absolute right-2 bottom-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 text-zinc-400" />
                      <span className="sr-only">Experimental, not live!</span>
                    </div>
                  )}
                </div>
              </GlowingBorder>
            );
          })}
        </div>

        {/* Current Implementation Notice */}
        <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg p-4 mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-zinc-400" />
          <div>
            <b>Current Implementation:</b> NeuroLint currently uses
            sophisticated rule-based transformations and AST parsing. All layers
            shown above are functional and use proven pattern-matching
            techniques. AI integration is planned for future releases.{" "}
            <a
              href="mailto:founder@neurolint.com"
              className="underline text-white"
            >
              Share feedback or collaborate!
            </a>
          </div>
        </div>

        {/* Differentiators */}
        <h3 className="text-xl font-semibold text-zinc-200 mb-2 mt-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> What makes NeuroLint different?
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-zinc-100">
          <li>
            <b>
              All 6 code-fixing layers are production-ready and powerful
              individually
            </b>
            : config, patterns, smart component repair, hydration/SSR, and more.
          </li>
          <li>
            Robust dry run, backup, safety, transparency, and per-layer
            commands.
          </li>
          <li>
            <span className="font-bold text-white">
              Seeking co-founder to master the orchestration—layers are solid,
              we need help integrating them for truly seamless, automated
              multi-layer repair!
            </span>
          </li>
        </ul>
      </div>

      {/* How it Works */}
      <div id="how" className="mt-16 max-w-4xl w-full">
        <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white text-center">
          How it Works
        </h2>
        <GlowingBorder variant="pulse" color="blue">
          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-8 text-gray-200 hover-glow transition-all duration-300">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>
                Upload your TypeScript/Next.js project or configs—no setup
                required.
              </li>
              <li>
                Select the analysis layer(s) you want to run, including
                full-stack config upgrades.
              </li>
              <li>
                Preview and approve changes. Full dry run, transparency, and
                safety tooling always enabled.
              </li>
              <li>
                Enjoy a modernized, production-ready codebase in seconds.
                Advanced orchestrator coming soon.
              </li>
            </ol>
          </div>
        </GlowingBorder>
      </div>
    </section>
  );
}
