import React from "react";
import { GitBranch, Cpu, Database, Cloud, Workflow, Code2 } from "lucide-react";

export function IntegrationsSection() {
  const integrations = [
    {
      name: "GitHub Actions",
      icon: GitBranch,
      description: "Automated code analysis in your CI/CD pipeline",
      category: "CI/CD",
      color: "from-gray-600 to-gray-800",
    },
    {
      name: "Jenkins",
      icon: Cpu,
      description: "Enterprise-grade continuous integration",
      category: "CI/CD",
      color: "from-blue-600 to-blue-800",
    },
    {
      name: "GitLab CI",
      icon: Database,
      description: "DevOps platform integration",
      category: "CI/CD",
      color: "from-zinc-600 to-zinc-800",
    },
    {
      name: "Azure DevOps",
      icon: Cloud,
      description: "Microsoft cloud development tools",
      category: "Cloud",
      color: "from-zinc-600 to-zinc-800",
    },
    {
      name: "CircleCI",
      icon: Workflow,
      description: "Continuous integration and delivery",
      category: "CI/CD",
      color: "from-green-600 to-green-800",
    },
    {
      name: "Bitbucket",
      icon: Code2,
      description: "Atlassian development platform",
      category: "Version Control",
      color: "from-indigo-600 to-indigo-800",
    },
  ];

  const workflows = [
    {
      title: "Pull Request Analysis",
      description: "Automatically analyze code changes in pull requests",
      steps: [
        "Code pushed",
        "NeuroLint analysis",
        "Report generated",
        "Review comments",
      ],
    },
    {
      title: "Pre-commit Hooks",
      description: "Validate code quality before committing changes",
      steps: [
        "Developer commits",
        "Pre-commit hook",
        "NeuroLint check",
        "Commit allowed/blocked",
      ],
    },
    {
      title: "Deployment Pipeline",
      description: "Ensure code quality in production deployments",
      steps: [
        "Build triggered",
        "Quality gate",
        "NeuroLint validation",
        "Deploy to production",
      ],
    },
  ];

  return (
    <section
      id="integrations"
      className="py-24 px-4"
      role="region"
      aria-labelledby="integrations-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            id="integrations-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            Seamless Integrations
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Connect NeuroLint with your existing development tools and
            workflows. From CI/CD pipelines to version control systems, we've
            got you covered.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {integrations.map((integration, index) => {
            const IconComponent = integration.icon;
            return (
              <div
                key={index}
                className="group bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-zinc-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {integration.name}
                  </h3>
                  <span className="text-xs bg-zinc-800 text-white px-2 py-1 rounded-full">
                    {integration.category}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {integration.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Workflow Examples */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            Popular Workflows
          </h3>
          <div className="grid lg:grid-cols-3 gap-8">
            {workflows.map((workflow, index) => (
              <div
                key={index}
                className="bg-gray-800/30 border border-gray-700 rounded-xl p-6"
              >
                <h4 className="text-xl font-semibold mb-3 text-white">
                  {workflow.title}
                </h4>
                <p className="text-gray-400 mb-6 text-sm">
                  {workflow.description}
                </p>
                <div className="space-y-3">
                  {workflow.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-zinc-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {stepIndex + 1}
                      </div>
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Example */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-white">
              GitHub Actions Example
            </h3>
            <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-6">
              <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                <code>{`name: NeuroLint Analysis

on:
  pull_request:
    branches: [ main ]

jobs:
  neurolint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install NeuroLint
      run: npm install -g @neurolint/cli

    - name: Run Analysis
      run: neurolint analyze src/ --output=json
      env:
        NEUROLINT_API_KEY: \${{ secrets.NEUROLINT_API_KEY }}

    - name: Upload Results
      uses: actions/upload-artifact@v3
      with:
        name: neurolint-report
        path: neurolint-report.json`}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">
                Why Integrate NeuroLint?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      Quality Gates
                    </h4>
                    <p className="text-sm text-gray-400">
                      Set quality thresholds for your codebase
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full mt-2"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Automated Quality Gates
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Enforce code quality standards automatically in your CI/CD
                      pipeline.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Team Consistency
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Ensure all team members follow the same coding standards
                      and best practices.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      Reduced Technical Debt
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Continuously improve code quality and reduce maintenance
                      overhead.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900">
              <h4 className="font-semibold mb-3 text-white">
                Need Custom Integration?
              </h4>
              <p className="text-gray-300 text-sm mb-4">
                Our team can help you integrate NeuroLint with your specific
                tools and workflows.
              </p>
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
