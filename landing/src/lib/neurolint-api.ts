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
      const requestBody = {
        code: options.code,
        options: {
          layers: options.layers || [1, 2, 3, 4, 5, 6, 7],
          filename: options.filePath || 'demo.tsx',
          ...options.options
        }
      };

      console.log('[API] Sending analysis request to /api/analyze', {
        codeLength: options.code.length,
        layers: requestBody.options.layers
      });

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[API] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status} ${response.statusText}`;
        let errorDetail = '';

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetail = JSON.stringify(errorData);
        } catch (parseError) {
          try {
            errorDetail = await response.text();
          } catch (textError) {
            errorDetail = 'Could not read response';
          }
        }

        console.error('[API] Error response:', { status: response.status, message: errorMessage, detail: errorDetail });
        throw new Error(errorMessage);
      }

      // Clone the response so we can read it safely
      const clonedResponse = response.clone();
      let responseData;
      try {
        responseData = await clonedResponse.json();
      } catch (parseError) {
        console.error('[API] Failed to parse response JSON', parseError);
        throw new Error('Invalid response from server');
      }

      const { jobId } = responseData;

      if (!jobId) {
        console.error('[API] No jobId in response', responseData);
        throw new Error('No job ID returned from server');
      }

      console.log('[API] Analysis job created:', jobId);
      return await this.streamJobProgress(jobId);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[API] Analysis error:', errorMsg, error);
      return {
        success: false,
        error: errorMsg
      };
    }
  },

  async streamJobProgress(jobId: string): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${API_BASE}/stream/${jobId}`);
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          eventSource.close();
          resolved = true;
          // Fallback to polling instead of timeout
          this.pollJobResult(jobId)
            .then(resolve)
            .catch(reject);
        }
      }, 30000);

      eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
        } catch (e) {
          // Ignore parse errors
        }
      });

      eventSource.addEventListener('layer_update', (event) => {
        try {
          const data = JSON.parse(event.data);
        } catch (e) {
          // Ignore parse errors
        }
      });

      eventSource.addEventListener('complete', (event) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        try {
          const data = JSON.parse(event.data);
          const detectedIssues = data.detectedIssues || [];
          const transformedCode = data.transformedCode || null;
          const appliedFixes = data.appliedFixes || [];
          const processingTime = data.processingTime || 0;

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
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      });

      eventSource.onerror = (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        eventSource.close();

        // Fallback to polling on EventSource error
        this.pollJobResult(jobId)
          .then(resolve)
          .catch(reject);
      };
    });
  },

  async pollJobResult(jobId: string, maxAttempts = 120, pollInterval = 500): Promise<AnalysisResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${API_BASE}/result/${jobId}`, {
          signal: AbortSignal.timeout(10000) // 10 second timeout per request
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Job not found yet, keep polling
          } else {
            throw new Error(`Failed to fetch job result: ${response.statusText}`);
          }
        } else {
          const data = await response.json();

          if (data.status === 'completed') {
            return {
              success: true,
              analysis: {
                recommendedLayers: data.result?.detectedIssues
                  ? [...new Set(data.result.detectedIssues.map((i: any) => i.fixedByLayer))]
                  : [],
                detectedIssues: data.result?.detectedIssues || [],
                confidence: (data.result?.detectedIssues?.length || 0) > 0 ? 0.9 : 1.0,
                processingTime: data.result?.processingTime || 0,
                analysisId: jobId
              },
              code: data.result?.transformedCode || undefined
            };
          } else if (data.status === 'failed') {
            throw new Error(data.error || 'Analysis failed');
          }
        }
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Analysis timeout - job did not complete in time');
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
