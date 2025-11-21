import React, { useState } from "react";
import { Code, Zap, Shield, Globe, Copy, Check } from "lucide-react";

export function APISection() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
  };

  const codeExamples = {
    analyze: `curl -X POST https://api.neurolint.com/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "function Component() { return <div>Hello</div>; }",
    "filePath": "src/Component.tsx",
    "layers": [1, 2, 3, 4]
  }'`,
    transform: `curl -X POST https://api.neurolint.com/transform \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "const items = data.map(item => <li>{item.name}</li>)",
    "layers": [3, 4]
  }'`,
    response: `{
  "layers": [
    {
      "id": 3,
      "name": "Component Best Practices",
      "status": "success",
      "changes": 1,
      "insights": [
        {
          "message": "Missing key prop in list items",
          "severity": "warning",
          "line": 1,
          "fix": "Add key={item.id} prop"
        }
      ]
    }
  ],
  "transformed": "const items = data.map(item => <li key={item.id}>{item.name}</li>)",
  "performance": {
    "totalTime": 150,
    "layerTimes": { "3": 150 }
  }
}`,
  };

  return (
    <section
      id="api"
      className="py-24 px-4"
      role="region"
      aria-labelledby="api-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            id="api-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            REST API Integration
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Integrate NeuroLint's powerful analysis engine directly into your
            applications, CI/CD pipelines, and custom tools with our
            comprehensive REST API.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* API Demo */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-900/90 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Tabs */}
              <div className="bg-gray-800 border-b border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "analyze"
                        ? "text-white border-b-2 border-zinc-600 bg-zinc-800"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Analyze
                  </button>
                  <button
                    onClick={() => setActiveTab("transform")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "transform"
                        ? "text-white border-b-2 border-zinc-600 bg-zinc-800"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Transform
                  </button>
                  <button
                    onClick={() => setActiveTab("response")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "response"
                        ? "text-white border-b-2 border-zinc-600 bg-zinc-800"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Response
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-6 relative">
                <button
                  onClick={() => copyToClipboard(codeExamples[activeTab])}
                  className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                  <code>{codeExamples[activeTab]}</code>
                </pre>
              </div>
            </div>

            {/* API Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  &lt;100ms
                </div>
                <div className="text-sm text-gray-400">Avg Response</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-600/20 border border-zinc-500/30 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  High Performance
                </h3>
                <p className="text-gray-400">
                  Lightning-fast analysis with global CDN distribution and
                  advanced caching for optimal response times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-600/20 border border-zinc-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Enterprise Security
                </h3>
                <p className="text-gray-400">
                  API key authentication, rate limiting, HTTPS encryption, and
                  SOC 2 compliance for enterprise use.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-600/20 border border-zinc-500/30 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Global Availability
                </h3>
                <p className="text-gray-400">
                  Multi-region deployment with automatic failover and 99.9%
                  uptime SLA guarantee.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-600/20 border border-zinc-500/30 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  RESTful Design
                </h3>
                <p className="text-gray-400">
                  Clean, intuitive API design with comprehensive documentation
                  and SDKs for popular languages.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints Overview */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold mb-8 text-center text-white">
            Available Endpoints
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                POST
              </div>
              <h4 className="font-semibold mb-2 text-white">/api/analyze</h4>
              <p className="text-sm text-gray-400">
                Analyze code for issues and improvements
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="bg-zinc-600/20 text-zinc-400 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                POST
              </div>
              <h4 className="font-semibold mb-2 text-white">/api/transform</h4>
              <p className="text-sm text-gray-400">
                Transform and fix code automatically
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="bg-zinc-600/20 text-zinc-400 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                GET
              </div>
              <h4 className="font-semibold mb-2 text-white">/api/layers</h4>
              <p className="text-sm text-gray-400">
                Get available analysis layers
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="bg-zinc-600/20 text-zinc-400 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                GET
              </div>
              <h4 className="font-semibold mb-2 text-white">/health</h4>
              <p className="text-sm text-gray-400">
                Check API health and status
              </p>
            </div>
          </div>
        </div>

        {/* Get Started */}
        <div className="mt-16 text-center">
          <div className="bg-zinc-900">
            <h3 className="text-2xl font-semibold mb-4 text-white">
              Start Building with NeuroLint API
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get your API key and start integrating powerful code analysis into
              your applications today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-medium transition-colors">
                Get API Key
              </button>
              <button className="border border-gray-600 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
