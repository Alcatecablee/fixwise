import React, { useState, useEffect } from "react";
import { Play, Code, CheckCircle, AlertTriangle, Zap, Layers, ArrowRight, Clock, Target, Sparkles, Settings } from "lucide-react";
import { neurolintAPI, AnalysisResult, FixResult, LayerInfo } from "@/lib/neurolint-api";
import { AnalysisProgressModal } from "./AnalysisProgressModal";

interface DemoResult {
  success: boolean;
  analysis: {
    recommendedLayers: number[];
    detectedIssues: Array<{
      type: string;
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      fixedByLayer: number;
      line?: number;
      column?: number;
      ruleId?: string;
    }>;
    confidence: number;
    processingTime: number;
    analysisId: string;
  };
  layers: Array<{
    layerId: number;
    success: boolean;
    improvements: string[];
  }>;
  transformed?: string;
  fixResult?: FixResult;
}

const SAMPLE_CODES = [
  {
    id: "react-component-issues",
    name: "React Component with Issues",
    description: "Missing keys, console.log, var declaration, missing aria-labels",
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
        <div>
          <span>{todo.text}</span>
          <Button onClick={() => {
            console.log('Deleting todo', todo.id);
          }}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}`,
    language: "tsx"
  },
  {
    id: "nextjs-app-router",
    name: "Next.js App Router Component",
    description: "Missing use client directive, localStorage in SSR, unguarded window access",
    code: `import { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = localStorage.getItem('theme');

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
      <span>Theme: {theme}</span>
    </div>
  );
}`,
    language: "tsx"
  },
  {
    id: "hydration-errors",
    name: "Hydration Error Component",
    description: "Direct window/localStorage access causing hydration mismatch",
    code: `export default function ThemeProvider() {
  const [theme, setTheme] = React.useState('light');
  const storedTheme = window.localStorage.getItem('theme') || 'light';

  return (
    <div className={\`theme-\${storedTheme}\`}>
      <h1>Current theme: {storedTheme}</h1>
      <button onClick={() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        window.localStorage.setItem('theme', newTheme);
      }}>
        Toggle Theme
      </button>
    </div>
  );
}`,
    language: "tsx"
  },
  {
    id: "pattern-layer",
    name: "Pattern Layer Issues",
    description: "HTML entities, var declarations, redundant code patterns",
    code: `var userCount = 0;
var activeUsers = [];

function printMessage() {
  var message = "Welcome &nbsp; to &nbsp; NeuroLint";
  console.log(message);
  alert('User count: ' + userCount);
}

function getUser(id) {
  var found = false;
  for (var i = 0; i < activeUsers.length; i++) {
    if (activeUsers[i].id === id) {
      found = true;
      break;
    }
  }
  return found;
}`,
    language: "js"
  },
  {
    id: "accessibility-layer",
    name: "Accessibility Issues",
    description: "Missing aria-labels, alt text, and semantic HTML",
    code: `function Button({ icon, onClick }) {
  return (
    <button onClick={onClick}>
      <svg>{icon}</svg>
    </button>
  );
}

function Gallery({ images }) {
  return (
    <div>
      {images.map((img, idx) => (
        <img key={idx} src={img.url} />
      ))}
    </div>
  );
}

function Navigation() {
  return (
    <div>
      <button onClick={() => alert('Search')}>🔍</button>
      <button onClick={() => alert('Menu')}>☰</button>
    </div>
  );
}`,
    language: "tsx"
  },
  {
    id: "config-layer",
    name: "Configuration Issues",
    description: "Outdated tsconfig.json and package.json settings",
    code: `{
  "compilerOptions": {
    "target": "ES2015",
    "module": "commonjs",
    "lib": ["ES2015"],
    "jsx": "react",
    "strict": false,
    "esModuleInterop": false
  }
}`,
    language: "json"
  },
  {
    id: "data-fetching",
    name: "Data Fetching Issues",
    description: "Missing error handling, no proper loading states, hardcoded URLs",
    code: `export default function ProductList() {
  const [products, setProducts] = React.useState([]);

  React.useEffect(() => {
    const response = await fetch('http://api.example.com/products');
    const data = await response.json();
    setProducts(data);
  });

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}`,
    language: "tsx"
  },
  {
    id: "modern-react",
    name: "Legacy React Patterns",
    description: "Class components, old hook patterns, missing TypeScript",
    code: `class UserCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null };
  }

  componentDidMount() {
    fetch('/api/user/' + this.props.id)
      .then(r => r.json())
      .then(user => this.setState({ user }));
  }

  render() {
    return (
      <div>
        <h2>{this.state.user?.name}</h2>
        <p>{this.state.user?.email}</p>
      </div>
    );
  }
}`,
    language: "tsx"
  }
];

export function ComprehensiveDemoSection() {
  const [selectedSample, setSelectedSample] = useState<string | null>(SAMPLE_CODES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DemoResult | null>(null);
  const [activeTab, setActiveTab] = useState<'before' | 'after' | 'layers'>('before');
  const [animationStep, setAnimationStep] = useState(0);
  const [layerInfo, setLayerInfo] = useState<LayerInfo[]>([]);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const currentCode = selectedSample ? SAMPLE_CODES.find(s => s.id === selectedSample)?.code || '' : '';

  // Load layer information and engine status on component mount
  useEffect(() => {
    const loadEngineInfo = async () => {
      try {
        const [layers, status] = await Promise.all([
          neurolintAPI.getLayerInfo(),
          neurolintAPI.getEngineStatus()
        ]);
        setLayerInfo(layers);
        setEngineStatus(status);
      } catch (error) {
        // Replace console.error with proper error handling
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('logError', {
            detail: {
              action: 'load_engine_info',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(event);
        }
      }
    };

    loadEngineInfo();
  }, []);

  const analyzeCode = async (code: string) => {
    setIsAnalyzing(true);
    setAnimationStep(0);
    setShowProgressModal(true);
    setProcessingTime(0);
    const startTime = Date.now();

    try {
      // Step 1: Analyze the code
      setAnimationStep(1);
      const analysisResult = await neurolintAPI.analyzeCode({
        code,
        layers: [1, 2, 3, 4, 5, 6, 7],
        filePath: 'demo.tsx',
        options: {
          backup: false,
          clientId: 'demo'
        }
      });

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Step 2: Apply fixes if issues were found
      setAnimationStep(2);
      let fixResult: FixResult | undefined;
      let transformedCode = code;

      if (analysisResult.analysis && analysisResult.analysis.detectedIssues.length > 0) {
        fixResult = await neurolintAPI.fixCode({
          code,
          issues: analysisResult.analysis.detectedIssues,
          options: {
            backup: false,
            filePath: 'demo.tsx'
          }
        });

        if (fixResult.success && fixResult.code) {
          transformedCode = fixResult.code;
        }
      }

      // Step 3: Generate layer improvements
      setAnimationStep(3);
      const layerImprovements = analysisResult.analysis?.detectedIssues.reduce((acc, issue) => {
        const layerId = issue.fixedByLayer;
        if (!acc[layerId]) {
          acc[layerId] = [];
        }
        acc[layerId].push(issue.description);
        return acc;
      }, {} as Record<number, string[]>) || {};

      const layers = Array.from({ length: 7 }, (_, i) => i + 1).map(layerId => ({
        layerId,
        success: layerImprovements[layerId] ? layerImprovements[layerId].length > 0 : false,
        improvements: layerImprovements[layerId] || []
      }));

      // Step 4: Complete
      setAnimationStep(4);
      const endTime = Date.now();
      setProcessingTime(endTime - startTime);

      const demoResult: DemoResult = {
        success: true,
        analysis: analysisResult.analysis!,
        layers,
        transformed: transformedCode,
        fixResult
      };

      setResults(demoResult);

    } catch (error) {
      // Replace console.error with proper error handling
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('logError', {
          detail: {
            action: 'analysis_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }
      const endTime = Date.now();
      setProcessingTime(endTime - startTime);
      
      setResults({
        success: false,
        analysis: {
          recommendedLayers: [],
          detectedIssues: [],
          confidence: 0,
          processingTime: 0,
          analysisId: ''
        },
        layers: []
      });
    } finally {
      setIsAnalyzing(false);
      setAnimationStep(0);
      // Keep modal open for a moment to show completion
      const modalTimer = window.setTimeout(() => {
        setShowProgressModal(false);
      }, 2000);
      
      // Cleanup timer on component unmount
      return () => {
        if (modalTimer) {
          clearTimeout(modalTimer);
        }
      };
    }
  };

  const handleAnalyze = () => {
    if (currentCode) {
      analyzeCode(currentCode);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getLayerIcon = (layerId: number) => {
    const icons = [Settings, Code, Sparkles, Target, Zap, CheckCircle, Layers];
    return icons[layerId - 1] || Settings;
  };

  const getLayerColor = (layerId: number) => {
    const colors = [
      'text-blue-400',
      'text-green-400', 
      'text-purple-400',
      'text-orange-400',
      'text-pink-400',
      'text-cyan-400',
      'text-indigo-400'
    ];
    return colors[layerId - 1] || 'text-gray-400';
  };

  return (
    <section
      id="comprehensive-demo"
      className="py-24 px-4"
      role="region"
      aria-labelledby="comprehensive-demo-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2
            id="comprehensive-demo-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            Experience the 7-Layer Engine
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Watch how our comprehensive rule-based system transforms legacy code into modern, 
            production-ready solutions across all 7 analysis layers.
          </p>
          {engineStatus && (
            <div className="mt-4 text-sm text-gray-400">
              Engine v{engineStatus.version} • {engineStatus.totalRules} rules • {engineStatus.stats.analyses} analyses completed
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Input Section - Primary */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-900/90 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-300 ml-4 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Your Code
                </div>
              </div>

              {/* Tab Controls */}
              <div className="bg-gray-800/50 border-b border-gray-700">
                <div className="flex">
                  <span className="px-6 py-3 text-sm font-medium text-white border-b-2 border-zinc-600 bg-zinc-800">
                    Sample Code
                  </span>
                </div>
              </div>

              {/* Code Input */}
              <div className="p-6">
                <div className="mb-4">
                  <select
                    value={selectedSample || SAMPLE_CODES[0].id}
                    onChange={(e) => setSelectedSample(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                  >
                    {SAMPLE_CODES.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.name} - {sample.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/50 rounded p-4 text-sm text-gray-300 font-mono overflow-x-auto max-h-96">
                  <pre className="whitespace-pre-wrap">{currentCode}</pre>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="p-6 border-t border-gray-700">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !currentCode}
                  className="w-full bg-zinc-900 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing with Real 7-Layer Engine...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Analyze with Real 7-Layer Engine
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Modal Trigger Info */}
            {isAnalyzing && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div>
                      <p className="text-blue-400 font-medium">Analysis in Progress</p>
                      <p className="text-sm text-gray-400">View detailed progress in the modal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProgressModal(true)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="order-1 lg:order-2 space-y-6">
            {results ? (
              <>
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab('before')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'before'
                        ? "bg-zinc-800 text-white border border-zinc-600"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Before
                  </button>
                  <button
                    onClick={() => setActiveTab('after')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'after'
                        ? "bg-zinc-800 text-white border border-zinc-600"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    After
                  </button>
                  <button
                    onClick={() => setActiveTab('layers')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'layers'
                        ? "bg-zinc-800 text-white border border-zinc-600"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Layer Details
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'before' && (
                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Original Code</h4>
                    <div className="bg-black/50 rounded p-4 text-sm text-gray-300 font-mono overflow-x-auto max-h-96">
                      <pre className="whitespace-pre-wrap">{currentCode}</pre>
                    </div>
                  </div>
                )}

                {activeTab === 'after' && (
                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Transformed Code</h4>
                    <div className="bg-black/50 rounded p-4 text-sm text-green-300 font-mono overflow-x-auto max-h-96">
                      <pre className="whitespace-pre-wrap">{results.transformed}</pre>
                    </div>
                    {results.fixResult && results.fixResult.appliedFixes && (
                      <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 font-medium mb-2">
                          ✓ {results.fixResult.appliedFixes.length} fixes applied successfully
                        </p>
                        <p className="text-sm text-gray-400">
                          Processing time: {results.analysis.processingTime}ms
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'layers' && (
                  <div className="space-y-6">
                    {/* Issues Summary */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Real Engine Detected Issues</h4>
                      <div className="space-y-3">
                        {results.analysis.detectedIssues.map((issue, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                          >
                            <div className={`mt-1 ${getSeverityColor(issue.severity)}`}>
                              {getSeverityIcon(issue.severity)}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{issue.description}</p>
                              <p className="text-sm text-gray-400">
                                Fixed by Layer {issue.fixedByLayer} • {issue.severity} severity
                                {issue.ruleId && ` • Rule: ${issue.ruleId}`}
                              </p>
                            </div>
                          </div>
                        ))}
                        {results.analysis.detectedIssues.length === 0 && (
                          <div className="text-center text-gray-400 py-4">
                            No issues detected - code is already optimized!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Layer Improvements */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Real Engine Layer Results</h4>
                      <div className="space-y-4">
                        {results.layers.map((layer) => {
                          const layerData = layerInfo.find(l => l.id === layer.layerId);
                          const IconComponent = getLayerIcon(layer.layerId);
                          const color = getLayerColor(layer.layerId);
                          
                          return (
                            <div
                              key={layer.layerId}
                              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                  <IconComponent className={`w-4 h-4 ${color}`} />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">
                                    Layer {layer.layerId}: {layerData?.name || `Layer ${layer.layerId}`}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {layerData?.description || 'Layer processing'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {layer.improvements.length > 0 ? (
                                  layer.improvements.map((improvement, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-green-400">
                                      <CheckCircle className="w-4 h-4" />
                                      {improvement}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    No improvements needed for this layer
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 h-96 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Enter your code and analyze with the real engine</p>
                  <p className="text-sm">The 7-layer engine will transform your code automatically</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-zinc-800 to-black backdrop-blur-xl border-2 border-black rounded-3xl p-16 md:p-24">
            <h3 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white">
              Ready to Transform Your Codebase?
            </h3>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto font-medium">
              Join developers transforming their codebases with automated fixes. Try NeuroLint today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="https://app.neurolint.dev/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all duration-300 text-lg shadow-2xl hover:scale-105"
              >
                Start Free Scan
              </a>
              <a
                href="https://app.neurolint.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-black/60 text-white font-black rounded-2xl border-2 border-black hover:bg-black/80 transition-all duration-300 text-lg backdrop-blur-xl hover:scale-105 shadow-lg"
              >
                View Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <AnalysisProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        layerInfo={layerInfo}
        animationStep={animationStep}
        currentLayer={animationStep}
        processingTime={processingTime}
      />
    </section>
  );
}
