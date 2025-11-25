import React from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  stats?: {
    totalIssues: number;
    qualityScore: number;
    totalFixes: number;
    lastAnalyzed?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectAnalyticsProps {
  projects: Project[];
  userTier: string;
}

export default function ProjectAnalytics({ projects, userTier }: ProjectAnalyticsProps) {
  const totalIssues = projects.reduce((sum, p) => sum + (p.stats?.totalIssues || 0), 0);
  const avgQualityScore = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (p.stats?.qualityScore || 0), 0) / projects.length 
    : 0;
  const totalFixes = projects.reduce((sum, p) => sum + (p.stats?.totalFixes || 0), 0);

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-900">{projects.length}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">Total Issues</h3>
          <p className="text-2xl font-bold text-green-900">{totalIssues}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800">Avg Quality Score</h3>
          <p className="text-2xl font-bold text-purple-900">
            {Math.round(avgQualityScore)}%
          </p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-800">Total Fixes</h3>
          <p className="text-2xl font-bold text-orange-900">{totalFixes}</p>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Projects
        </h3>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first project to start analyzing code
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                      {project.stats?.lastAnalyzed && (
                        <span>Last analyzed: {new Date(project.stats.lastAnalyzed).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {project.stats?.totalIssues || 0} issues
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.stats?.qualityScore || 0}% quality
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Analyze
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length > 5 && (
              <div className="text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all {projects.length} projects
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quality Score Chart */}
      {projects.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Trends
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Quality Score</span>
              <span className="text-sm text-gray-500">{Math.round(avgQualityScore)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(avgQualityScore, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 