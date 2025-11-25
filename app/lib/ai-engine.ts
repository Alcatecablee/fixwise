/**
 * AI Engine for NeuroLint
 * Provides intelligent code analysis and suggestions using LLM integration
 */

import { logger } from './logger';

export interface AIAnalysisRequest {
  code: string;
  filePath: string;
  context?: {
    projectType: string;
    framework: string;
    dependencies: string[];
  };
  options?: {
    explainFixes: boolean;
    suggestRules: boolean;
    qualityAssessment: boolean;
    modernizationPath: boolean;
  };
}

export interface AIAnalysisResult {
  explanation?: string;
  suggestedRules: Array<{
    name: string;
    description: string;
    pattern: string;
    replacement: string;
    layer: number;
    confidence: number;
    reasoning: string;
  }>;
  qualityAssessment?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  modernizationPath?: {
    currentStage: string;
    nextSteps: string[];
    estimatedEffort: string;
    benefits: string[];
  };
  codeExplanation?: {
    summary: string;
    complexity: string;
    maintainability: string;
    suggestions: string[];
  };
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class AIEngine {
  private config: LLMConfig;
  private cache: Map<string, AIAnalysisResult>;

  constructor(config: LLMConfig) {
    this.config = config;
    this.cache = new Map();
  }

  /**
   * Analyze code with AI
   */
  async analyzeCode(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await this.performAIAnalysis(request);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error(`AI analysis failed: ${error instanceof Error ? error.message : String(error)} - File: ${request.filePath}, Code Length: ${request.code.length}`);
      return this.getFallbackResult(request);
    }
  }

  /**
   * Explain a specific fix
   */
  async explainFix(code: string, fix: any, context?: string): Promise<string> {
    try {
      const prompt = this.buildExplainFixPrompt(code, fix, context);
      const response = await this.callLLM(prompt);
      return this.parseExplainFixResponse(response);
    } catch (error) {
      logger.error(`Failed to explain fix: ${error instanceof Error ? error.message : String(error)} - Fix Type: ${fix?.type}, Context: ${context ? 'provided' : 'none'}`);
      return this.getFallbackExplanation(fix);
    }
  }

  /**
   * Suggest rules based on codebase patterns
   */
  async suggestRules(codebase: string[], context?: any): Promise<Array<{
    name: string;
    description: string;
    pattern: string;
    replacement: string;
    layer: number;
    confidence: number;
    reasoning: string;
  }>> {
    try {
      const prompt = this.buildSuggestRulesPrompt(codebase, context);
      const response = await this.callLLM(prompt);
      return this.parseSuggestRulesResponse(response);
    } catch (error) {
      logger.error(`Failed to suggest rules: ${error instanceof Error ? error.message : String(error)} - Codebase Size: ${codebase.length}, Context: ${context ? 'provided' : 'none'}`);
      return this.getFallbackRules();
    }
  }

  /**
   * Assess code quality
   */
  async assessQuality(code: string, filePath: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = this.buildQualityAssessmentPrompt(code, filePath);
      const response = await this.callLLM(prompt);
      return this.parseQualityAssessmentResponse(response);
    } catch (error) {
      logger.error(`Failed to assess quality: ${error instanceof Error ? error.message : String(error)} - File: ${filePath}, Code Length: ${code.length}`);
      return this.getFallbackQualityAssessment();
    }
  }

  /**
   * Generate modernization path
   */
  async generateModernizationPath(codebase: string[], currentFramework: string): Promise<{
    currentStage: string;
    nextSteps: string[];
    estimatedEffort: string;
    benefits: string[];
  }> {
    try {
      const prompt = this.buildModernizationPathPrompt(codebase, currentFramework);
      const response = await this.callLLM(prompt);
      return this.parseModernizationPathResponse(response);
    } catch (error) {
      logger.error(`Failed to generate modernization path: ${error instanceof Error ? error.message : String(error)} - Codebase Size: ${codebase.length}, Framework: ${currentFramework}`);
      return this.getFallbackModernizationPath();
    }
  }

  /**
   * Explain code complexity and maintainability
   */
  async explainCode(code: string, filePath: string): Promise<{
    summary: string;
    complexity: string;
    maintainability: string;
    suggestions: string[];
  }> {
    try {
      const prompt = this.buildCodeExplanationPrompt(code, filePath);
      const response = await this.callLLM(prompt);
      return this.parseCodeExplanationResponse(response);
    } catch (error) {
      logger.error(`Failed to explain code: ${error instanceof Error ? error.message : String(error)} - File: ${filePath}, Code Length: ${code.length}`);
      return this.getFallbackCodeExplanation();
    }
  }

  /**
   * Perform AI analysis
   */
  private async performAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(request);
    const response = await this.callLLM(prompt);
    return this.parseAnalysisResponse(response);
  }

  /**
   * Call LLM API with proper error handling and retries
   */
  private async callLLM(prompt: string): Promise<string> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use environment-based LLM provider
        const provider = process.env.LLM_PROVIDER || 'openai';
        const apiKey = process.env.LLM_API_KEY || this.config.apiKey;
        
        if (!apiKey) {
          throw new Error('LLM API key not configured');
        }

        let response: Response;
        
        switch (provider) {
          case 'openai':
            response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: this.config.model || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
              })
            });
            break;
            
          case 'anthropic':
            response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: this.config.model || 'claude-3-sonnet-20240229',
                max_tokens: this.config.maxTokens,
                messages: [{ role: 'user', content: prompt }]
              })
            });
            break;
            
          default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`LLM API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Extract response based on provider
        let content: string;
        if (provider === 'openai') {
          content = data.choices?.[0]?.message?.content;
        } else if (provider === 'anthropic') {
          content = data.content?.[0]?.text;
        } else {
          throw new Error(`Unknown provider response format: ${provider}`);
        }

        if (!content) {
          throw new Error('Empty response from LLM API');
        }

        return content;

      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Log error with structured logging
        if (process.env.NODE_ENV === 'production') {
          process.stdout.write(JSON.stringify({
            level: 'error',
            timestamp: new Date().toISOString(),
            message: `LLM API call failed (attempt ${attempt}/${maxRetries})`,
            error: error instanceof Error ? error.message : String(error),
            provider: process.env.LLM_PROVIDER || 'openai',
            attempt,
            maxRetries
          }) + '\n');
        }

        if (isLastAttempt) {
          throw new Error(`LLM API failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in LLM API call');
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { code, filePath, context, options } = request;
    
    return `Analyze the following code and provide insights:

File: ${filePath}
Context: ${context ? JSON.stringify(context) : 'React/Next.js project'}
Options: ${options ? JSON.stringify(options) : 'All analysis enabled'}

Code:
${code}

Please provide:
1. Code explanation and complexity assessment
2. Quality issues and recommendations
3. Suggested modernization rules
4. Modernization path and next steps
5. Fix explanations if requested

Format the response as JSON with the following structure:
{
  "explanation": "Brief code summary",
  "suggestedRules": [...],
  "qualityAssessment": {...},
  "modernizationPath": {...},
  "codeExplanation": {...}
}`;
  }

  /**
   * Build explain fix prompt
   */
  private buildExplainFixPrompt(code: string, fix: any, context?: string): string {
    return `Explain why this fix is needed and what it improves:

Code:
${code}

Fix:
${JSON.stringify(fix)}

Context: ${context || 'React/Next.js modernization'}

Please explain:
1. What problem this fix addresses
2. How the fix improves the code
3. Why this change is beneficial
4. Any potential side effects to consider

Provide a clear, concise explanation suitable for developers.`;
  }

  /**
   * Build suggest rules prompt
   */
  private buildSuggestRulesPrompt(codebase: string[], context?: any): string {
    return `Analyze this codebase and suggest modernization rules:

Codebase samples:
${codebase.slice(0, 5).join('\n\n')}

Context: ${context ? JSON.stringify(context) : 'React/Next.js project'}

Please suggest rules that would:
1. Improve code quality
2. Modernize patterns
3. Enhance maintainability
4. Follow best practices

Format as JSON array of rules with:
- name: Rule name
- description: What it does
- pattern: Regex pattern to match
- replacement: Replacement code
- layer: NeuroLint layer (1-7)
- confidence: 0-1 confidence score
- reasoning: Why this rule is valuable`;
  }

  /**
   * Build quality assessment prompt
   */
  private buildQualityAssessmentPrompt(code: string, filePath: string): string {
    return `Assess the quality of this code:

File: ${filePath}
Code:
${code}

Please assess:
1. Code quality score (0-100)
2. Specific issues found
3. Recommendations for improvement

Consider:
- Readability and maintainability
- Performance implications
- Security concerns
- Best practices adherence
- Modern patterns usage

Format as JSON:
{
  "score": 85,
  "issues": ["Issue 1", "Issue 2"],
  "recommendations": ["Rec 1", "Rec 2"]
}`;
  }

  /**
   * Build modernization path prompt
   */
  private buildModernizationPathPrompt(codebase: string[], currentFramework: string): string {
    return `Generate a modernization path for this codebase:

Current Framework: ${currentFramework}
Codebase samples:
${codebase.slice(0, 3).join('\n\n')}

Please provide:
1. Current modernization stage
2. Next steps to take
3. Estimated effort required
4. Benefits of modernization

Format as JSON:
{
  "currentStage": "Early modernization",
  "nextSteps": ["Step 1", "Step 2"],
  "estimatedEffort": "2-3 weeks",
  "benefits": ["Benefit 1", "Benefit 2"]
}`;
  }

  /**
   * Build code explanation prompt
   */
  private buildCodeExplanationPrompt(code: string, filePath: string): string {
    return `Explain this code:

File: ${filePath}
Code:
${code}

Please provide:
1. Brief summary of what the code does
2. Complexity assessment
3. Maintainability assessment
4. Suggestions for improvement

Format as JSON:
{
  "summary": "Brief description",
  "complexity": "Low/Medium/High",
  "maintainability": "Good/Fair/Poor",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;
  }

  /**
   * Parse analysis response
   */
  private parseAnalysisResponse(response: string): AIAnalysisResult {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackResult({ code: '', filePath: '' });
    }
  }

  /**
   * Parse explain fix response
   */
  private parseExplainFixResponse(response: string): string {
    // Extract explanation from response
    return response.trim();
  }

  /**
   * Parse suggest rules response
   */
  private parseSuggestRulesResponse(response: string): Array<any> {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return this.getFallbackRules();
    }
  }

  /**
   * Parse quality assessment response
   */
  private parseQualityAssessmentResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackQualityAssessment();
    }
  }

  /**
   * Parse modernization path response
   */
  private parseModernizationPathResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackModernizationPath();
    }
  }

  /**
   * Parse code explanation response
   */
  private parseCodeExplanationResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackCodeExplanation();
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: AIAnalysisRequest): string {
    return `${request.filePath}-${request.code.length}-${JSON.stringify(request.options)}`;
  }

  /**
   * Get fallback result when LLM is unavailable
   */
  private getFallbackResult(request: AIAnalysisRequest): AIAnalysisResult {
    // Log fallback usage
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message: 'Using fallback AI analysis result',
        filePath: request.filePath,
        codeLength: request.code.length
      }) + '\n');
    }

    return {
      explanation: 'AI analysis temporarily unavailable due to service issues. Please try again later or contact support.',
      suggestedRules: this.getFallbackRules(),
      qualityAssessment: this.getFallbackQualityAssessment(),
      modernizationPath: this.getFallbackModernizationPath(),
      codeExplanation: this.getFallbackCodeExplanation()
    };
  }

  /**
   * Get fallback explanation
   */
  private getFallbackExplanation(fix: any): string {
    return `This fix addresses a code quality issue. The specific details are temporarily unavailable. Please review the changes manually.`;
  }

  /**
   * Get fallback rules
   */
  private getFallbackRules(): Array<any> {
    return [
      {
        name: 'Remove Console Logs',
        description: 'Remove console.log statements from production code',
        pattern: 'console\\.log\\([^)]*\\);?',
        replacement: '',
        layer: 2,
        confidence: 0.8,
        reasoning: 'Console statements should not be in production code'
      }
    ];
  }

  /**
   * Get fallback quality assessment
   */
  private getFallbackQualityAssessment(): any {
    return {
      score: 70,
      issues: ['Quality assessment unavailable'],
      recommendations: ['Manual review recommended']
    };
  }

  /**
   * Get fallback modernization path
   */
  private getFallbackModernizationPath(): any {
    return {
      currentStage: 'Unknown',
      nextSteps: ['Manual assessment needed'],
      estimatedEffort: 'Unknown',
      benefits: []
    };
  }

  /**
   * Get fallback code explanation
   */
  private getFallbackCodeExplanation(): any {
    return {
      summary: 'Code explanation unavailable',
      complexity: 'Unknown',
      maintainability: 'Unknown',
      suggestions: ['Manual review recommended']
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export default AIEngine; 