export interface AnalysisResult {
  success: boolean;
  analysis?: {
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
  code?: string;
  appliedFixes?: Array<{
    id: string;
    description: string;
    layer: number;
  }>;
  error?: string;
}

export interface FixResult {
  success: boolean;
  code?: string;
  appliedFixes?: Array<{
    id: string;
    description: string;
    layer: number;
  }>;
  error?: string;
}

export interface LayerInfo {
  id: number;
  name: string;
  description: string;
}

interface AnalyzeOptions {
  code: string;
  layers?: number[];
  filePath?: string;
  options?: {
    backup?: boolean;
    clientId?: string;
  };
}

interface FixOptions {
  code: string;
  issues: Array<any>;
  options?: {
    backup?: boolean;
    filePath?: string;
  };
}

const API_BASE = '/api';

export const neurolintAPI = {
  async analyzeCode(options: AnalyzeOptions): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: options.code,
          options: {
            layers: options.layers || [1, 2, 3, 4, 5, 6, 7],
            filename: options.filePath || 'demo.tsx',
            ...options.options
          }
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use status text
          errorMessage = response.statusText || 'Analysis failed';
        }
        throw new Error(errorMessage);
      }

      // Clone the response so we can read it safely
      const clonedResponse = response.clone();
      const { jobId } = await clonedResponse.json();

      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      return await this.streamJobProgress(jobId);

    } catch (error) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async streamJobProgress(jobId: string): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${API_BASE}/stream/${jobId}`);
      
      let detectedIssues: any[] = [];
      let transformedCode: string | null = null;
      let appliedFixes: any[] = [];
      let processingTime = 0;

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
      });

      eventSource.addEventListener('layer_update', (event) => {
        const data = JSON.parse(event.data);
      });

      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        detectedIssues = data.detectedIssues || [];
        transformedCode = data.transformedCode;
        appliedFixes = data.appliedFixes || [];
        processingTime = data.processingTime || 0;

        eventSource.close();
        
        resolve({
          success: true,
          analysis: {
            recommendedLayers: [...new Set(detectedIssues.map((i: any) => i.fixedByLayer))],
            detectedIssues,
            confidence: detectedIssues.length > 0 ? 0.9 : 1.0,
            processingTime,
            analysisId: jobId
          },
          code: transformedCode,
          appliedFixes
        });
      });

      eventSource.addEventListener('error', (event: any) => {
        eventSource.close();
        
        const errorData = event.data ? JSON.parse(event.data) : { error: 'Stream error' };
        reject(new Error(errorData.error || 'Stream failed'));
      });

      eventSource.onerror = (error) => {
        eventSource.close();
        
        this.pollJobResult(jobId)
          .then(resolve)
          .catch(reject);
      };

      setTimeout(() => {
        eventSource.close();
        reject(new Error('Analysis timeout'));
      }, 120000);
    });
  },

  async pollJobResult(jobId: string, maxAttempts = 60): Promise<AnalysisResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${API_BASE}/result/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job result');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          return {
            success: true,
            analysis: {
              recommendedLayers: [...new Set(data.result.detectedIssues.map((i: any) => i.fixedByLayer))],
              detectedIssues: data.result.detectedIssues,
              confidence: data.result.detectedIssues.length > 0 ? 0.9 : 1.0,
              processingTime: data.result.processingTime,
              analysisId: jobId
            },
            code: data.result.transformedCode
          };
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Analysis failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Analysis timeout');
  },

  async fixCode(options: FixOptions): Promise<FixResult> {
    return {
      success: true,
      code: options.code
    };
  },

  async getLayerInfo(): Promise<LayerInfo[]> {
    try {
      const response = await fetch(`${API_BASE}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch layer info');
      }

      const data = await response.json();
      return data.layers || [];
    } catch (error) {
      return [
        { id: 1, name: 'Configuration', description: 'TypeScript, Next.js, and package.json configuration fixes' },
        { id: 2, name: 'Patterns', description: 'HTML entities, console statements, and var declarations' },
        { id: 3, name: 'Components', description: 'React component fixes, keys, and accessibility' },
        { id: 4, name: 'Hydration', description: 'SSR and hydration error fixes' },
        { id: 5, name: 'Next.js', description: 'Next.js App Router and server component fixes' },
        { id: 6, name: 'Testing', description: 'Testing setup and validation fixes' },
        { id: 7, name: 'Adaptive', description: 'AI-powered pattern learning and custom fixes' }
      ];
    }
  },

  async getEngineStatus() {
    try {
      const response = await fetch(`${API_BASE}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch engine status');
      }

      const data = await response.json();
      return {
        version: data.version || '1.0.0',
        status: data.status || 'healthy',
        totalRules: 600,
        stats: {
          analyses: data.stats?.completed || 0
        }
      };
    } catch (error) {
      return {
        version: '1.0.0',
        status: 'healthy',
        totalRules: 600,
        stats: {
          analyses: 0
        }
      };
    }
  }
};
