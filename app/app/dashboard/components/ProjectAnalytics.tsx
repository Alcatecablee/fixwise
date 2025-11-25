'use client';

import React, { useMemo, useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  files: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAnalyzed?: Date;
  userId: string;
  stats?: {
    totalIssues: number;
    qualityScore: number;
    totalFixes: number;
  };
}

interface ProjectAnalyticsProps {
  projects: Project[];
  userTier: string;
}

export default function ProjectAnalytics({ projects, userTier }: ProjectAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const analytics = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    switch (selectedTimeRange) {
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredProjects = projects.filter(
      project => new Date(project.updatedAt) >= filterDate
    );

    const totalProjects = filteredProjects.length;
    const totalIssues = filteredProjects.reduce((sum, p) => sum + (p.stats?.totalIssues || 0), 0);
    const totalFixes = filteredProjects.reduce((sum, p) => sum + (p.stats?.totalFixes || 0), 0);
    const avgQualityScore = totalProjects > 0 
      ? filteredProjects.reduce((sum, p) => sum + (p.stats?.qualityScore || 0), 0) / totalProjects 
      : 0;

    const recentlyAnalyzed = filteredProjects.filter(
      p => p.lastAnalyzed && new Date(p.lastAnalyzed) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const modernizationProgress = totalIssues > 0 
      ? Math.round((totalFixes / totalIssues) * 100)
      : 0;

    return {
      totalProjects,
      totalIssues,
      totalFixes,
      avgQualityScore,
      recentlyAnalyzed,
      modernizationProgress,
      filteredProjects
    };
  }, [projects, selectedTimeRange]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Project Analytics</h3>
                      <p className="text-sm text-gray-300">Track your code modernization progress</p>
        </div>
        <div className="flex space-x-2">
          {["week", "month", "quarter", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-800">
          <div className="flex items-center">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Projects</p>
              <p className="text-2xl font-bold text-white">{analytics.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-800">
          <div className="flex items-center">
            <div className="p-2 bg-red-900/50 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Issues</p>
              <p className="text-2xl font-bold text-white">{analytics.totalIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-800">
          <div className="flex items-center">
            <div className="p-2 bg-green-900/50 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Fixes Applied</p>
              <p className="text-2xl font-bold text-white">{analytics.totalFixes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-800">
          <div className="flex items-center">
            <div className="p-2 bg-purple-900/50 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Avg Quality</p>
              <p className={`text-2xl font-bold text-white`}>
                {Math.round(analytics.avgQualityScore)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modernization Progress */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
        <h4 className="text-lg font-semibold text-white mb-4">Modernization Progress</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Overall Progress</span>
            <span className="text-sm font-semibold text-white">{analytics.modernizationProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(analytics.modernizationProgress)}`}
              style={{ width: `${analytics.modernizationProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Started</span>
            <span>In Progress</span>
            <span>Modernized</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
        <h4 className="text-lg font-semibold text-white mb-4">Recent Activity</h4>
        <div className="space-y-3">
          {analytics.filteredProjects.slice(0, 5).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex-1">
                <h5 className="font-medium text-white">{project.name}</h5>
                <p className="text-sm text-gray-300">{project.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span>Issues: {project.stats?.totalIssues || 0}</span>
                  <span>Fixes: {project.stats?.totalFixes || 0}</span>
                  <span>Quality: {project.stats?.qualityScore || 0}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {project.lastAnalyzed ? formatDate(project.lastAnalyzed) : 'Never analyzed'}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(project.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier-specific Features */}
              {userTier === 'enterprise' && (
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 rounded-lg border border-purple-700">
            <h4 className="text-lg font-semibold text-white mb-2">Enterprise Features</h4>
            <p className="text-sm text-gray-300 mb-4">Advanced analytics and team collaboration available</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Team Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Advanced Reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Custom Rules</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Priority Support</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 