/**
 * Jenkins Integration for NeuroLint
 * Provides Jenkins CI/CD pipeline integration with NeuroLint analysis
 */

import { NeuroLintCore } from './shared-core-adapter';

export interface JenkinsConfig {
  jenkinsUrl: string;
  username: string;
  apiToken: string;
  jobName: string;
  branch: string;
  credentialsId?: string;
  webhookSecret: string;
  neurolint?: {
    version?: string;
  };
}

export interface JenkinsPipelineConfig {
  stages: {
    checkout: boolean;
    install: boolean;
    analyze: boolean;
    test: boolean;
    deploy: boolean;
  };
  neuroLintConfig: {
    layers: number[];
    failOnIssues: boolean;
    maxIssues: number;
    outputFormat: 'json' | 'html' | 'junit';
    includePatterns: string[];
    excludePatterns: string[];
  };
  notifications: {
    email?: string[];
    slack?: string;
    teams?: string;
  };
}

export class JenkinsIntegration {
  private config: JenkinsConfig;
  private neurolint: NeuroLintCore;

  constructor(config: JenkinsConfig) {
    this.config = config;
    this.neurolint = new NeuroLintCore();
  }

  /**
   * Generate Jenkins pipeline script
   */
  generatePipelineScript(pipelineConfig: JenkinsPipelineConfig): string {
    const { stages, neuroLintConfig, notifications } = pipelineConfig;
    
    return `pipeline {
    agent any
    
    environment {
        NEUROLINT_VERSION = '1.2.1'
        NEUROLINT_API_KEY = credentials('neurolint-api-key')
        NEUROLINT_WEBHOOK_URL = '${this.config.webhookSecret}'
    }
    
    stages {
        ${stages.checkout ? this.generateCheckoutStage() : ''}
        ${stages.install ? this.generateInstallStage() : ''}
        ${this.generateNeuroLintStage(neuroLintConfig)}
        ${stages.test ? this.generateTestStage() : ''}
        ${stages.deploy ? this.generateDeployStage() : ''}
    }
    
    post {
        always {
            ${this.generateNotificationSteps(notifications)}
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}`;
  }

  /**
   * Generate checkout stage
   */
  private generateCheckoutStage(): string {
    return `stage('Checkout') {
    steps {
        checkout([
            $class: 'GitSCM',
            branches: [[name: '${this.config.branch}']],
            userRemoteConfigs: [[
                url: '${this.config.jobName}',
                credentialsId: '${this.config.credentialsId || 'git-credentials'}'
            ]]
        ])
    }
}`;
  }

  /**
   * Generate install stage
   */
  private generateInstallStage(): string {
    return `stage('Install Dependencies') {
    steps {
        script {
            if (fileExists('package.json')) {
                sh 'npm ci'
            }
            if (fileExists('yarn.lock')) {
                sh 'yarn install --frozen-lockfile'
            }
        }
    }
}`;
  }

  /**
   * Generate NeuroLint analysis stage
   */
  private generateNeuroLintStage(config: any): string {
    const { layers, failOnIssues, maxIssues, outputFormat, includePatterns, excludePatterns } = config;
    
    return `stage('NeuroLint Analysis') {
    steps {
        script {
            // Install NeuroLint CLI
            sh 'npm install -g @neurolint/cli@${this.config.neurolint?.version || '1.2.1'}'
            
            // Run analysis
            sh '''
                neurolint analyze . \\
                    --layers=${layers.join(',')} \\
                    --format=${outputFormat} \\
                    --output=neurolint-results.${outputFormat} \\
                    --include="${includePatterns.join(',')}" \\
                    --exclude="${excludePatterns.join(',')}" \\
                    --verbose
            '''
            
            // Process results
            script {
                def results = readJSON file: 'neurolint-results.json'
                def issueCount = results.issues?.size() ?: 0
                
                echo "Found \${issueCount} issues"
                
                // Archive results
                archiveArtifacts artifacts: 'neurolint-results.*', allowEmptyArchive: true
                
                // Send webhook notification
                if (issueCount > 0) {
                    sh '''
                        curl -X POST \${NEUROLINT_WEBHOOK_URL} \\
                            -H "Content-Type: application/json" \\
                            -H "X-Webhook-Secret: \${NEUROLINT_WEBHOOK_SECRET}" \\
                            -d @neurolint-results.json
                    '''
                }
                
                // Fail if configured to do so
                ${failOnIssues ? `if (issueCount > ${maxIssues}) {
                    error "Too many issues found: \${issueCount} > ${maxIssues}"
                }` : ''}
            }
        }
    }
}`;
  }

  /**
   * Generate test stage
   */
  private generateTestStage(): string {
    return `stage('Test') {
    steps {
        script {
            if (fileExists('package.json')) {
                sh 'npm test'
            }
        }
    }
}`;
  }

  /**
   * Generate deploy stage
   */
  private generateDeployStage(): string {
    return `stage('Deploy') {
    steps {
        echo 'Deployment stage - customize as needed'
    }
}`;
  }

  /**
   * Generate notification steps
   */
  private generateNotificationSteps(notifications: any): string {
    const steps = [];
    
    if (notifications.email?.length) {
      steps.push(`emailext (
        subject: "NeuroLint Analysis - \${currentBuild.result}",
        body: "Build \${currentBuild.fullDisplayName} completed with result: \${currentBuild.result}",
        to: "${notifications.email.join(',')}"
    )`);
    }
    
    if (notifications.slack) {
      steps.push(`slackSend(
        channel: '${notifications.slack}',
        message: "NeuroLint Analysis: \${currentBuild.fullDisplayName} - \${currentBuild.result}"
    )`);
    }
    
    if (notifications.teams) {
      steps.push(`// Teams notification would be implemented here
    echo 'Teams notification to: ${notifications.teams}'`);
    }
    
    return steps.join('\n            ');
  }

  /**
   * Create Jenkins job
   */
  async createJob(jobName: string, pipelineScript: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.jenkinsUrl}/createItem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`
        },
        body: this.generateJobXML(jobName, pipelineScript)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to create Jenkins job:', error);
      return false;
    }
  }

  /**
   * Generate Jenkins job XML
   */
  private generateJobXML(jobName: string, pipelineScript: string): string {
    return `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>NeuroLint Analysis Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${pipelineScript.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
  }

  /**
   * Trigger Jenkins build
   */
  async triggerBuild(jobName: string, parameters: Record<string, string> = {}): Promise<boolean> {
    try {
      const url = parameters && Object.keys(parameters).length > 0
        ? `${this.config.jenkinsUrl}/job/${jobName}/buildWithParameters`
        : `${this.config.jenkinsUrl}/job/${jobName}/build`;

      const body = parameters && Object.keys(parameters).length > 0
        ? new URLSearchParams(parameters)
        : null;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`
        },
        body
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to trigger Jenkins build:', error);
      return false;
    }
  }

  /**
   * Get build status
   */
  async getBuildStatus(jobName: string, buildNumber: number): Promise<any> {
    try {
      const response = await fetch(`${this.config.jenkinsUrl}/job/${jobName}/${buildNumber}/api/json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get Jenkins build status:', error);
      return null;
    }
  }

  /**
   * Get build logs
   */
  async getBuildLogs(jobName: string, buildNumber: number): Promise<string> {
    try {
      const response = await fetch(`${this.config.jenkinsUrl}/job/${jobName}/${buildNumber}/consoleText`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`
        }
      });

      if (response.ok) {
        return await response.text();
      }
      return '';
    } catch (error) {
      console.error('Failed to get Jenkins build logs:', error);
      return '';
    }
  }

  /**
   * Validate Jenkins connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.jenkinsUrl}/api/json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to validate Jenkins connection:', error);
      return false;
    }
  }
}

export default JenkinsIntegration; 