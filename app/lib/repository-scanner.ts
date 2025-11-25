import { createClient } from '@supabase/supabase-js';
import githubApiClient from './github-api-client';

interface ScanProgress {
  current: number;
  total: number;
  percentage: number;
  currentFile?: string;
  estimatedTimeRemaining?: number;
}

interface ScanResult {
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: ScanProgress;
  results: any[];
  summary: any;
  error?: string;
}

interface FileInfo {
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
  sha: string;
  language?: string;
  lastModified?: string;
}

class RepositoryScanner {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private readonly CODE_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
    '.mjs', '.cjs', '.mts', '.cts'
  ];

  private readonly SKIP_DIRECTORIES = [
    'node_modules', '.git', '.next', 'dist', 'build',
    'coverage', '.nyc_output', 'public', 'static',
    'assets', '.cache', '.parcel-cache', '.eslintcache'
  ];

  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private readonly MAX_DEPTH = 10;

  /**
   * Discover all code files in a repository
   */
  async discoverCodeFiles(
    owner: string,
    repo: string,
    token: string,
    branch: string = 'main',
    path: string = '',
    depth: number = 0
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const response = await githubApiClient.getRepositoryContents(
        owner, repo, token, path, branch
      );

      for (const item of response.data) {
        if (item.type === 'file') {
          if (this.isCodeFile(item.name) && item.size <= this.MAX_FILE_SIZE) {
            files.push({
              name: item.name,
              path: item.path,
              downloadUrl: item.download_url,
              size: item.size,
              sha: item.sha,
              language: this.detectLanguage(item.name),
              lastModified: item.updated_at
            });
          }
        } else if (item.type === 'dir' && depth < this.MAX_DEPTH) {
          if (!this.shouldSkipDirectory(item.name)) {
            const subFiles = await this.discoverCodeFiles(
              owner, repo, token, branch, item.path, depth + 1
            );
            files.push(...subFiles);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to discover files in ${path}:`, error);
    }

    return files;
  }

  /**
   * Start a comprehensive repository scan
   */
  async startScan(
    userId: string,
    repositoryId: number,
    repositoryName: string,
    branch: string,
    files: FileInfo[],
    userPlan: string
  ): Promise<string> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create scan record
    const { error } = await this.supabase
      .from('repository_scans')
      .insert({
        id: scanId,
        user_id: userId,
        repository_id: repositoryId,
        repository_name: repositoryName,
        repository_full_name: repositoryName,
        branch,
        status: 'pending',
        progress: {
          current: 0,
          total: files.length,
          percentage: 0
        },
        scan_data: {
          files: files.map(f => ({
            path: f.path,
            size: f.size,
            language: f.language
          })),
          plan: userPlan,
          started_at: new Date().toISOString()
        }
      });

    if (error) {
      throw new Error(`Failed to create scan record: ${error.message}`);
    }

    return scanId;
  }

  /**
   * Process repository scan asynchronously
   */
  async processScan(
    scanId: string,
    files: FileInfo[],
    token: string,
    userPlan: string
  ): Promise<void> {
    try {
      // Update status to running
      await this.updateScanStatus(scanId, 'running');

      const results: any[] = [];
      const startTime = Date.now();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileStartTime = Date.now();

        try {
          // Update progress
          const progress: ScanProgress = {
            current: i + 1,
            total: files.length,
            percentage: Math.round(((i + 1) / files.length) * 100),
            currentFile: file.path,
            estimatedTimeRemaining: this.calculateEstimatedTime(i + 1, files.length, startTime)
          };

          await this.updateScanProgress(scanId, progress);

          // Fetch file content
          const [owner, repo] = file.path.split('/')[0].split('/');
          const fileContent = await this.fetchFileContent(file.downloadUrl, token);

          // Analyze file with NeuroLint
          const analysisResult = await this.analyzeFile(fileContent, file.path, userPlan);

          results.push({
            ...analysisResult,
            file: file.path,
            size: file.size,
            language: file.language,
            executionTime: Date.now() - fileStartTime
          });

          // Store individual result
          await this.storeFileResult(scanId, file.path, analysisResult);

        } catch (error) {
          console.error(`Failed to analyze ${file.path}:`, error);
          results.push({
            file: file.path,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: Date.now() - fileStartTime
          });
        }
      }

      // Generate summary
      const summary = this.generateScanSummary(results);
      await this.storeScanSummary(scanId, summary);

      // Update final status
      await this.updateScanStatus(scanId, 'completed', {
        results,
        summary,
        completed_at: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error);
      await this.updateScanStatus(scanId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get scan progress
   */
  async getScanProgress(scanId: string): Promise<ScanResult | null> {
    const { data, error } = await this.supabase
      .from('repository_scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      scanId: data.id,
      status: data.status,
      progress: data.progress,
      results: data.scan_data?.results || [],
      summary: data.scan_data?.summary,
      error: data.error_message
    };
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.CODE_EXTENSIONS.includes(extension);
  }

  /**
   * Detect programming language from filename
   */
  private detectLanguage(filename: string): string {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const languageMap: { [key: string]: string } = {
      '.js': 'JavaScript',
      '.jsx': 'React JSX',
      '.ts': 'TypeScript',
      '.tsx': 'React TypeScript',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
      '.mjs': 'ES Modules',
      '.cjs': 'CommonJS',
      '.mts': 'TypeScript ES Modules',
      '.cts': 'TypeScript CommonJS'
    };
    return languageMap[extension] || 'Unknown';
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(name: string): boolean {
    return this.SKIP_DIRECTORIES.includes(name) || name.startsWith('.');
  }

  /**
   * Fetch file content from GitHub
   */
  private async fetchFileContent(downloadUrl: string, token: string): Promise<string> {
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'NeuroLint-Pro/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Analyze file with NeuroLint (placeholder for actual implementation)
   */
  private async analyzeFile(content: string, filePath: string, userPlan: string): Promise<any> {
    // This would integrate with the actual NeuroLint analysis engine
    // For now, return a placeholder result
    return {
      success: true,
      layers: [1, 2, 3],
      analysis: {
        detectedIssues: [],
        technicalDebt: {
          score: 85,
          category: 'good'
        },
        confidence: 0.9
      }
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(current: number, total: number, startTime: number): number {
    if (current === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerFile = elapsed / current;
    const remainingFiles = total - current;
    
    return Math.round(avgTimePerFile * remainingFiles / 1000); // Return seconds
  }

  /**
   * Update scan status
   */
  private async updateScanStatus(scanId: string, status: string, data?: any): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (data) {
      updateData.scan_data = data;
    }

    const { error } = await this.supabase
      .from('repository_scans')
      .update(updateData)
      .eq('id', scanId);

    if (error) {
      console.error(`Failed to update scan status: ${error.message}`);
    }
  }

  /**
   * Update scan progress
   */
  private async updateScanProgress(scanId: string, progress: ScanProgress): Promise<void> {
    const { error } = await this.supabase
      .from('repository_scans')
      .update({
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', scanId);

    if (error) {
      console.error(`Failed to update scan progress: ${error.message}`);
    }
  }

  /**
   * Store individual file result
   */
  private async storeFileResult(scanId: string, filePath: string, result: any): Promise<void> {
    const { error } = await this.supabase
      .from('repository_scan_results')
      .insert({
        scan_id: scanId,
        file_path: filePath,
        analysis_success: result.success,
        detected_issues: result.analysis?.detectedIssues || [],
        technical_debt_score: result.analysis?.technicalDebt?.score || 100,
        technical_debt_category: result.analysis?.technicalDebt?.category || 'excellent',
        confidence_score: result.analysis?.confidence || 0,
        error_message: result.error
      });

    if (error) {
      console.error(`Failed to store file result: ${error.message}`);
    }
  }

  /**
   * Store scan summary
   */
  private async storeScanSummary(scanId: string, summary: any): Promise<void> {
    const { error } = await this.supabase
      .from('repository_analysis_summary')
      .insert({
        scan_id: scanId,
        total_files: summary.totalFiles,
        analyzed_files: summary.analyzedFiles,
        issues_found: summary.issuesFound,
        critical_issues: summary.criticalIssues,
        high_issues: summary.highIssues,
        medium_issues: summary.mediumIssues,
        low_issues: summary.lowIssues,
        average_technical_debt: summary.averageTechnicalDebt,
        estimated_fix_time: summary.estimatedFixTime,
        modernization_priority: summary.modernizationPriority,
        recommendations: summary.recommendations
      });

    if (error) {
      console.error(`Failed to store scan summary: ${error.message}`);
    }
  }

  /**
   * Generate scan summary from results
   */
  private generateScanSummary(results: any[]): any {
    const successfulResults = results.filter(r => r.success);
    const totalIssues = successfulResults.reduce((sum, r) => 
      sum + (r.analysis?.detectedIssues?.length || 0), 0
    );

    return {
      totalFiles: results.length,
      analyzedFiles: successfulResults.length,
      issuesFound: totalIssues,
      criticalIssues: 0, // Would be calculated from actual issues
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      averageTechnicalDebt: 85, // Would be calculated from actual results
      estimatedFixTime: '2h', // Would be calculated based on issues
      modernizationPriority: [],
      recommendations: []
    };
  }
}

export const repositoryScanner = new RepositoryScanner();
export default repositoryScanner; 