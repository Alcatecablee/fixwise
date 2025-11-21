import { useEffect } from 'react';
import { X } from 'lucide-react';

interface LayerInfo {
  id: number;
  name: string;
  description: string;
  rules: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface AnalysisProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  layerInfo: LayerInfo[];
  animationStep: number;
  currentLayer?: number;
  processingTime?: number;
}

export function AnalysisProgressModal(props: AnalysisProgressModalProps) {
  const { isOpen, onClose, layerInfo, animationStep, currentLayer, processingTime } = props;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const progressPercentage = Math.round((animationStep / layerInfo.length) * 100);
  const progressWidth = (animationStep / layerInfo.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-2xl bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-modal-title"
        aria-describedby="progress-modal-description"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
            </div>
            <div>
              <h3 id="progress-modal-title" className="text-xl font-bold text-white">7-Layer Engine Analysis</h3>
              <p id="progress-modal-description" className="text-sm text-gray-400">Processing your code through all layers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {layerInfo.map((layer) => (
              <div key={layer.id} className="flex items-center gap-4 p-4 rounded-xl transition-all duration-500 bg-gray-800/50 border border-gray-700">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-400">
                      Layer {layer.id}: {layer.name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{layer.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-medium">Pending</span>
                </div>
              </div>
            ))}
          </div>

          {processingTime && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Processing Time</span>
                <span className="text-sm font-medium text-white">{processingTime}ms</span>
              </div>
            </div>
          )}

          {currentLayer && layerInfo[currentLayer - 1] && (
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Currently Processing: Layer {currentLayer}</h4>
              <p className="text-sm text-gray-300">{layerInfo[currentLayer - 1].description}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">This is a real analysis using the 7-layer engine</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Processing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
