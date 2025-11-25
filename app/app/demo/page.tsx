"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DemoResult {
  success?: boolean;
  analysis?: {
    recommendedLayers: number[];
    detectedIssues: Array<{
      type: string;
      severity: string;
      description: string;
      fixedByLayer: number;
    }>;
    confidence: number;
  };
  transformed?: string;
  originalCode?: string;
  layers?: Array<{
    layerId: number;
    success: boolean;
    improvements?: string[];
  }>;
  error?: string;
}

const SAMPLE_CODES = [
  {
    name: "React Component with Issues",
    code: `import React from 'react';

function Button({ children, onClick }) {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
}

function TodoList({ todos }) {
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <span>{todo.text}</span>
                          <Button onClick={() => {
                  // TODO: Implement delete functionality
                  // For now, this is a placeholder
                }}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}`,
    description: "Missing TypeScript types, console.log, missing key props"
  },
  {
    name: "Next.js App Router Component",
    code: `'use client';

import { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={() => localStorage.setItem('theme', 'dark')}>
        Set Dark Theme
      </button>
    </div>
  );
}`,
    description: "SSR issues, localStorage access, missing error handling"
  },
  {
    name: "TypeScript Configuration Issues",
    code: `// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
    description: "Outdated TypeScript target, missing modern settings"
  }
];

export default function DemoPage() {
  const [selectedCode, setSelectedCode] = useState(SAMPLE_CODES[0]);
  const [customCode, setCustomCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [activeTab, setActiveTab] = useState<"sample" | "custom">("sample");

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const codeToAnalyze = activeTab === "sample" ? selectedCode.code : customCode;
      
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeToAnalyze,
          filename: "demo.tsx",
          layers: "auto",
          applyFixes: true,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Analysis failed. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-400">
                NeuroLint
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">Live Demo</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/pricing"
                className="text-gray-300 hover:text-white"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Try NeuroLint Pro Live
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience automated React/Next.js code modernization in real-time. 
            No signup required - analyze your code instantly with our 6-layer transformation system.
          </p>
        </div>

        {/* Demo Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Input Code</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveTab("sample")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "sample"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sample Code
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "custom"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Custom Code
              </button>
            </div>

            {activeTab === "sample" ? (
              <div>
                <select
                  value={SAMPLE_CODES.indexOf(selectedCode)}
                  onChange={(e) => setSelectedCode(SAMPLE_CODES[parseInt(e.target.value)])}
                  className="w-full mb-4 p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
                >
                  {SAMPLE_CODES.map((code, index) => (
                    <option key={index} value={index}>
                      {code.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mb-4">
                  {selectedCode.description}
                </p>
                <textarea
                  value={selectedCode.code}
                  onChange={(e) => setSelectedCode({ ...selectedCode, code: e.target.value })}
                  className="w-full h-64 p-4 border border-gray-700 rounded-md font-mono text-sm bg-gray-800 text-white"
                  placeholder="Enter your code here..."
                />
              </div>
            ) : (
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full h-64 p-4 border border-gray-700 rounded-md font-mono text-sm bg-gray-800 text-white"
                placeholder="Paste your React/Next.js code here to analyze..."
              />
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!customCode && activeTab === "custom")}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze & Fix Code"}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Analysis Results</h2>
            
            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <p className="mt-2 text-gray-400">Analyzing your code...</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="space-y-4">
                {result.error ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-md p-4">
                    <p className="text-red-300">{result.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Analysis Summary */}
                    {result.analysis && (
                      <div className="bg-blue-900/20 border border-blue-700 rounded-md p-4">
                        <h3 className="font-semibold text-blue-300 mb-2">Issues Detected</h3>
                        <div className="space-y-2">
                          {result.analysis.detectedIssues.map((issue, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                issue.severity === 'critical' ? 'bg-red-900/50 text-red-300' :
                                issue.severity === 'high' ? 'bg-orange-900/50 text-orange-300' :
                                'bg-yellow-900/50 text-yellow-300'
                              }`}>
                                {issue.severity}
                              </span>
                              <span className="text-sm text-blue-200">{issue.description}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-blue-300 mt-2">
                          Recommended layers: {result.analysis.recommendedLayers.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Layer Results */}
                    {result.layers && result.layers.length > 0 && (
                      <div className="bg-green-900/20 border border-green-700 rounded-md p-4">
                        <h3 className="font-semibold text-green-300 mb-2">Applied Fixes</h3>
                        <div className="space-y-2">
                          {result.layers.map((layer, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${
                                layer.success ? 'bg-green-400' : 'bg-gray-500'
                              }`}></span>
                              <span className="text-sm text-green-200">
                                Layer {layer.layerId}: {layer.success ? 'Applied' : 'Skipped'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transformed Code */}
                    {result.transformed && (
                      <div>
                        <h3 className="font-semibold text-white mb-2">Fixed Code</h3>
                        <pre className="bg-gray-800 p-4 rounded-md text-sm overflow-x-auto border border-gray-700">
                          <code className="text-gray-200">{result.transformed}</code>
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!result && !isAnalyzing && (
              <div className="text-center py-8 text-gray-400">
                <p>Enter code and click "Analyze & Fix Code" to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to modernize your entire codebase?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get unlimited access to all 6 layers, team collaboration, CI/CD integration, 
              and advanced analytics. Start with 50 free fixes, no credit card required.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="border border-gray-600 text-gray-300 px-6 py-3 rounded-md hover:bg-gray-800 font-medium"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 