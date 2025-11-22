import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { demoScenarios, type DemoScenario } from '../data/staticDemoData';

export function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());

  const handleOpenDemo = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setHasAnalyzed(false);
    setExpandedLayers(new Set());
    setIsOpen(true);
  };

  const handleAnalyze = () => {
    setHasAnalyzed(true);
  };

  const toggleLayer = (layerId: number) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          See NeuroLint in Action
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Choose a scenario below to see how NeuroLint detects and fixes common React issues
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {demoScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
            onClick={() => handleOpenDemo(scenario)}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {scenario.title}
            </h3>
            <p className="text-gray-400 mb-4">
              {scenario.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {scenario.issues.length} issues detected
              </span>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                Try Demo
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && selectedScenario && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedScenario.title}
                </h3>
                <p className="text-gray-400 mt-1">
                  {selectedScenario.description}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!hasAnalyzed ? (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Sample Code</h4>
                    <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-gray-300">
                        {selectedScenario.beforeCode}
                      </code>
                    </pre>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleAnalyze}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg flex items-center gap-2 transition-all transform hover:scale-105"
                    >
                      <Play className="w-5 h-5" />
                      Analyze Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-green-400 font-semibold mb-1">Analysis Complete</h4>
                      <p className="text-gray-300">
                        Found {selectedScenario.issues.length} issues across{' '}
                        {selectedScenario.layerBreakdown.length} layer(s)
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        Before (Issues Detected)
                      </h4>
                      <div className="bg-gray-800 rounded-lg p-4 h-[400px] overflow-y-auto">
                        <pre className="text-sm text-gray-300">
                          <code>{selectedScenario.beforeCode}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        After (Fixed)
                      </h4>
                      <div className="bg-gray-800 rounded-lg p-4 h-[400px] overflow-y-auto">
                        <pre className="text-sm text-green-300">
                          <code>{selectedScenario.afterCode}</code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Issues Detected</h4>
                    <div className="space-y-3">
                      {selectedScenario.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-start gap-3"
                        >
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getSeverityColor(issue.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${getSeverityColor(issue.severity)}`}>
                                {issue.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{issue.type}</span>
                            </div>
                            <p className="text-gray-300">{issue.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Fixed by Layer {issue.fixedByLayer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Layer Breakdown</h4>
                    <div className="space-y-3">
                      {selectedScenario.layerBreakdown.map((layer) => (
                        <div key={layer.layerId} className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleLayer(layer.layerId)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {layer.layerId}
                              </div>
                              <div className="text-left">
                                <h5 className="text-white font-medium">{layer.name}</h5>
                                <p className="text-sm text-gray-400">
                                  {layer.issuesFound} issue{layer.issuesFound !== 1 ? 's' : ''} fixed
                                </p>
                              </div>
                            </div>
                            {expandedLayers.has(layer.layerId) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          {expandedLayers.has(layer.layerId) && (
                            <div className="p-4 border-t border-gray-700 bg-gray-950">
                              <h6 className="text-sm font-medium text-gray-300 mb-2">Applied Fixes:</h6>
                              <ul className="space-y-2">
                                {layer.fixes.map((fix, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                    {fix}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
