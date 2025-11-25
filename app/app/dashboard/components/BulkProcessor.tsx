'use client';

import React, { useState, useCallback, useRef } from "react";
import { useToast } from "../../../components/ui/Toast";
import logger from "../../../lib/client-logger";
import { delay } from "../../../lib/async-utils";

interface BulkResult {
  filename: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: any;
  error?: string;
  progress: number;
  processingTime?: number;
  expanded?: boolean;
}

interface BulkProcessingState {
  files: File[];
  processing: boolean;
  results: BulkResult[];
  overallProgress: number;
  showSummary: boolean;
  completedAt?: Date;
}

interface BulkProcessorProps {
  onAnalysisComplete: (results: any[]) => void;
  selectedLayers: number[];
  applyFixes: boolean;
}

const formatProcessingTime = (ms: number) => {
  if (!ms || isNaN(ms) || ms < 0) return '0ms';
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 100) return `${ms.toFixed(0)}ms`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export default function BulkProcessor({
  onAnalysisComplete,
  selectedLayers,
  applyFixes,
}: BulkProcessorProps) {
  const [bulkState, setBulkState] = useState<BulkProcessingState>({
    files: [],
    processing: false,
    results: [],
    overallProgress: 0,
    showSummary: false,
  });

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFolderUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter(
        (file) => file.name.match(/\.(ts|tsx|js|jsx)$/) && file.size <= 200000,
      );

      if (validFiles.length === 0) {
        showToast({
          type: 'error',
          title: 'No Valid Files Found',
          message: 'Please select a folder containing .ts, .tsx, .js, or .jsx files.',
        });
        logger.ui('User attempted to upload folder with no valid files', { 
          component: 'BulkProcessor',
          totalFiles: files.length 
        });
        return;
      }

      setBulkState((prev) => ({
        ...prev,
        files: validFiles,
        results: validFiles.map((file) => ({
          filename: file.name,
          status: "pending",
          progress: 0,
          expanded: false,
        })),
        showSummary: false,
      }));
    },
    [],
  );

  const handleMultipleFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter(
        (file) => file.name.match(/\.(ts|tsx|js|jsx)$/) && file.size <= 200000,
      );

      setBulkState((prev) => ({
        ...prev,
        files: validFiles,
        results: validFiles.map((file) => ({
          filename: file.name,
          status: "pending",
          progress: 0,
          expanded: false,
        })),
        showSummary: false,
      }));
    },
    [],
  );

  const processBulkFiles = async () => {
    if (bulkState.files.length === 0) return;

    setBulkState((prev) => ({ ...prev, processing: true, overallProgress: 0 }));

    const results = [];
    const totalFiles = bulkState.files.length;

    for (let i = 0; i < bulkState.files.length; i++) {
      const file = bulkState.files[i];
      const startTime = Date.now();

      // Update current file status
      setBulkState((prev) => ({
        ...prev,
        results: prev.results.map((result, idx) =>
          idx === i ? { ...result, status: "processing", progress: 0 } : result,
        ),
      }));

      try {
        const code = await file.text();

        // Use the correct API endpoint for bulk processing
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            filename: file.name,
            layers: selectedLayers.length > 0 ? selectedLayers : "auto",
            applyFixes,
          }),
        });

        const result = await response.json();
        const processingTime = Date.now() - startTime;

        if (response.ok) {
          results.push(result);
          setBulkState((prev) => ({
            ...prev,
            results: prev.results.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: "completed",
                    progress: 100,
                    result,
                    processingTime,
                  }
                : r,
            ),
            overallProgress: ((i + 1) / totalFiles) * 100,
          }));
        } else {
          setBulkState((prev) => ({
            ...prev,
            results: prev.results.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: "error",
                    progress: 0,
                    error: result.error,
                    processingTime,
                  }
                : r,
            ),
            overallProgress: ((i + 1) / totalFiles) * 100,
          }));
        }
      } catch (error) {
        const processingTime = Date.now() - startTime;
        setBulkState((prev) => ({
          ...prev,
          results: prev.results.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "error",
                  progress: 0,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                  processingTime,
                }
              : r,
          ),
          overallProgress: ((i + 1) / totalFiles) * 100,
        }));
      }

      // Add delay to prevent rate limiting
      if (i < bulkState.files.length - 1) {
        await delay(1000);
      }
    }

    setBulkState((prev) => ({
      ...prev,
      processing: false,
      showSummary: true,
      completedAt: new Date(),
    }));
    onAnalysisComplete(results);
  };

  const clearFiles = () => {
    setBulkState({
      files: [],
      processing: false,
      results: [],
      overallProgress: 0,
      showSummary: false,
    });
  };

  const toggleResultExpansion = (index: number) => {
    setBulkState((prev) => ({
      ...prev,
      results: prev.results.map((result, idx) =>
        idx === index ? { ...result, expanded: !result.expanded } : result,
      ),
    }));
  };

  const exportResults = () => {
    const completedResults = bulkState.results.filter(
      (r) => r.status === "completed",
    );
    const summary = {
      timestamp: new Date().toISOString(),
      totalFiles: bulkState.results.length,
      successfulFiles: completedResults.length,
      failedFiles: bulkState.results.filter((r) => r.status === "error").length,
      totalIssuesFound: completedResults.reduce(
        (sum, r) => sum + (r.result?.analysis?.detectedIssues?.length || 0),
        0,
      ),
      averageConfidence:
        completedResults.reduce(
          (sum, r) => sum + (r.result?.analysis?.confidence || 0),
          0,
        ) / (completedResults.length || 1),
      totalProcessingTime: bulkState.results.reduce(
        (sum, r) => sum + (r.processingTime || 0),
        0,
      ),
      results: bulkState.results,
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurolint-bulk-analysis-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummaryStats = () => {
    const completed = bulkState.results.filter((r) => r.status === "completed");
    const failed = bulkState.results.filter((r) => r.status === "error");
    const totalIssues = completed.reduce(
      (sum, r) => sum + (r.result?.analysis?.detectedIssues?.length || 0),
      0,
    );
    const avgConfidence =
      completed.length > 0
        ? completed.reduce(
            (sum, r) => sum + (r.result?.analysis?.confidence || 0),
            0,
          ) / completed.length
        : 0;
    const totalTime = bulkState.results.reduce(
      (sum, r) => sum + (r.processingTime || 0),
      0,
    );

    return {
      completed: completed.length,
      failed: failed.length,
      totalIssues,
      avgConfidence,
      totalTime,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "○";
      case "processing":
        return "◐";
      case "completed":
        return "●";
      case "error":
        return "×";
      default:
        return "○";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "rgba(255, 255, 255, 0.5)";
      case "processing":
        return "rgba(33, 150, 243, 0.9)";
      case "completed":
        return "rgba(76, 175, 80, 0.9)";
      case "error":
        return "rgba(229, 62, 62, 0.9)";
      default:
        return "rgba(255, 255, 255, 0.5)";
    }
  };

  return (
    <div className="bulk-processor">
      <div className="bulk-header">
        <h3>Bulk File Processing</h3>
        <p className="bulk-description">
          Process multiple React/Next.js files at once. Upload entire folders or
          select multiple files.
        </p>
      </div>

      <div className="bulk-upload-section">
        <div className="upload-options">
          <button
            className="upload-option-btn"
            onClick={() => folderInputRef.current?.click()}
            disabled={bulkState.processing}
          >
            <div className="upload-option-icon folder-icon">FOLDER</div>
            <div className="upload-option-text">
              <strong>Upload Folder</strong>
              <span>Select entire folder with React files</span>
            </div>
          </button>

          <button
            className="upload-option-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkState.processing}
          >
            <div className="upload-option-icon file-icon">FILES</div>
            <div className="upload-option-text">
              <strong>Select Multiple Files</strong>
              <span>Choose individual files to process</span>
            </div>
          </button>
        </div>

        <input
          ref={folderInputRef}
          type="file"
          style={{ display: "none" }}
          {...({ webkitdirectory: "" } as any)}
          multiple
          accept=".ts,.tsx,.js,.jsx"
          onChange={handleFolderUpload}
        />

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          multiple
          accept=".ts,.tsx,.js,.jsx"
          onChange={handleMultipleFiles}
        />
      </div>

      {bulkState.files.length > 0 && (
        <div className="bulk-summary">
          <div className="bulk-summary-header">
            <h4>Files Ready for Processing ({bulkState.files.length})</h4>
            <div className="bulk-actions">
              <button
                className="btn btn-primary"
                onClick={processBulkFiles}
                disabled={bulkState.processing}
              >
                {bulkState.processing ? "Processing..." : "Start Bulk Analysis"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={clearFiles}
                disabled={bulkState.processing}
              >
                Clear Files
              </button>
            </div>
          </div>

          {bulkState.processing && (
            <div className="bulk-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${bulkState.overallProgress}%` }}
                />
              </div>
              <div className="progress-text">
                Overall Progress: {Math.round(bulkState.overallProgress)}%
              </div>
            </div>
          )}

          <div className="bulk-file-list">
            {bulkState.results.map((result, index) => (
              <div key={index} className="bulk-file-item">
                <div
                  className="file-status"
                  style={{ color: getStatusColor(result.status) }}
                >
                  {getStatusIcon(result.status)}
                </div>
                <div className="file-info">
                  <div className="file-name">{result.filename}</div>
                  <div className="file-path">
                    {bulkState.files[index]?.webkitRelativePath ||
                      "Selected file"}
                  </div>
                </div>
                <div className="file-progress">
                  {result.status === "processing" && (
                    <div className="mini-progress">
                      <div className="mini-progress-fill" />
                    </div>
                  )}
                  {result.status === "completed" && result.result?.analysis && (
                    <div className="file-metrics">
                      <span className="metric">
                        {result.result.analysis.detectedIssues?.length || 0}{" "}
                        issues
                      </span>
                      <span className="metric">
                        {Math.round(
                          (result.result.analysis.confidence || 0) * 100,
                        )}
                        % confidence
                      </span>
                      {result.processingTime && (
                        <span className="metric">
                          {formatProcessingTime(result.processingTime)}
                        </span>
                      )}
                    </div>
                  )}
                  {result.status === "error" && (
                    <div className="file-error">{result.error}</div>
                  )}
                </div>
                {(result.status === "completed" ||
                  result.status === "error") && (
                  <button
                    className="expand-btn"
                    onClick={() => toggleResultExpansion(index)}
                  >
                    {result.expanded ? "▲" : "▼"}
                  </button>
                )}
                {result.expanded && (
                  <div className="expanded-results">
                    {result.status === "completed" && result.result && (
                      <div className="detailed-results">
                        {result.result.analysis?.detectedIssues?.length > 0 && (
                          <div className="issues-section">
                            <h4>Detected Issues</h4>
                            <div className="issues-list">
                              {result.result.analysis.detectedIssues.map(
                                (issue: any, idx: number) => (
                                  <div key={idx} className="issue-item">
                                    <span
                                      className={`issue-severity ${issue.severity}`}
                                    >
                                      {issue.severity}
                                    </span>
                                    <span className="issue-type">
                                      {issue.type}
                                    </span>
                                    <span className="issue-description">
                                      {issue.description}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        {result.result.layers && (
                          <div className="layers-section">
                            <h4>Layer Execution</h4>
                            <div className="layers-list">
                              {result.result.layers.map(
                                (layer: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`layer-item ${layer.success ? "success" : "failed"}`}
                                  >
                                    <span className="layer-name">
                                      Layer {layer.layerId}
                                    </span>
                                    <span className="layer-time">
                                      {formatProcessingTime(
                                        layer.executionTime,
                                      )}
                                    </span>
                                    <span
                                      className={`layer-status ${layer.success ? "success" : "failed"}`}
                                    >
                                      {layer.success ? "SUCCESS" : "FAILED"}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {result.status === "error" && (
                      <div className="error-details">
                        <h4>Error Details</h4>
                        <p>{result.error}</p>
                        {result.processingTime && (
                          <p>
                            Processing time:{" "}
                            {formatProcessingTime(result.processingTime)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {bulkState.showSummary && (
        <div className="bulk-summary-stats">
          <div className="summary-header">
            <h3>Bulk Analysis Summary</h3>
            <div className="summary-actions">
              <button className="btn btn-secondary" onClick={exportResults}>
                Export Results
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value">{getSummaryStats().completed}</div>
              <div className="summary-label">Files Processed</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{getSummaryStats().failed}</div>
              <div className="summary-label">Failed Files</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {getSummaryStats().totalIssues}
              </div>
              <div className="summary-label">Total Issues Found</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {Math.round(getSummaryStats().avgConfidence * 100)}%
              </div>
              <div className="summary-label">Avg Confidence</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {formatProcessingTime(getSummaryStats().totalTime)}
              </div>
              <div className="summary-label">Total Processing Time</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {bulkState.completedAt
                  ? bulkState.completedAt.toLocaleTimeString()
                  : "N/A"}
              </div>
              <div className="summary-label">Completed At</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .bulk-processor {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .bulk-header h3 {
          color: #ffffff;
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .bulk-description {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 24px 0;
          font-size: 0.9rem;
        }

        .upload-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .upload-option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed #000000;
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-option-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: #000000;
        }

        .upload-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-option-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid #000000;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #2196f3;
          text-align: center;
        }

        .upload-option-icon.folder-icon {
          background: rgba(255, 152, 0, 0.1);
          border-color: #000000;
          color: #ff9800;
        }

        .upload-option-icon.file-icon {
          background: rgba(76, 175, 80, 0.1);
          border-color: #000000;
          color: #4caf50;
        }

        .upload-option-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
        }

        .upload-option-text strong {
          font-weight: 600;
          font-size: 1rem;
        }

        .upload-option-text span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .bulk-summary {
          border-top: 1px solid #000000;
          padding-top: 24px;
        }

        .bulk-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .bulk-summary-header h4 {
          color: #ffffff;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .bulk-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 1px solid #000000;
          border-radius: 8px;
          backdrop-filter: blur(20px) saturate(1.2);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 12px rgba(33, 150, 243, 0.2);
          color: #ffffff;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.3) 0%,
            rgba(33, 150, 243, 0.22) 50%,
            rgba(255, 255, 255, 0.12) 100%
          );
          border-color: #000000;
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 16px rgba(33, 150, 243, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid #000000;
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: #000000;
          transform: translateY(-2px);
        }

        .bulk-progress {
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(33, 150, 243, 0.6),
            rgba(76, 175, 80, 0.6)
          );
          transition: width 0.3s ease;
        }

        .progress-text {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          text-align: center;
        }

        .bulk-file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .bulk-file-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border: 1px solid #000000;
        }

        .file-status {
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          color: #ffffff;
          font-weight: 500;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-path {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-progress {
          min-width: 100px;
          text-align: right;
        }

        .mini-progress {
          width: 60px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-left: auto;
        }

        .mini-progress-fill {
          width: 100%;
          height: 100%;
          background: rgba(33, 150, 243, 0.9);
          animation: indeterminate 2s infinite linear;
        }

        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .file-metrics {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .metric {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .file-error {
          font-size: 0.8rem;
          color: rgba(229, 62, 62, 0.9);
          max-width: 150px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .expand-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          margin-left: 8px;
        }

        .expand-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .expanded-results {
          grid-column: 1 / -1;
          margin-top: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid #000000;
        }

        .detailed-results {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .issues-section h4,
        .layers-section h4 {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .issue-item {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .issue-severity {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .issue-severity.critical {
          background: rgba(220, 38, 38, 0.2);
          color: #fca5a5;
        }

        .issue-severity.high {
          background: rgba(234, 88, 12, 0.2);
          color: #fdba74;
        }

        .issue-severity.medium {
          background: rgba(217, 119, 6, 0.2);
          color: #fed7aa;
        }

        .issue-severity.low {
          background: rgba(101, 163, 13, 0.2);
          color: #bef264;
        }

        .issue-type {
          color: rgba(33, 150, 243, 0.9);
          font-weight: 500;
          min-width: 80px;
        }

        .issue-description {
          color: rgba(255, 255, 255, 0.8);
          flex: 1;
        }

        .layers-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .layers-list .layer-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .layers-list .layer-item.success {
          border-left: 3px solid #22c55e;
        }

        .layers-list .layer-item.failed {
          border-left: 3px solid #ef4444;
        }

        .layer-name {
          color: #ffffff;
          font-weight: 500;
        }

        .layer-time {
          color: rgba(255, 255, 255, 0.7);
          font-family: "JetBrains Mono", "Fira Code", consolas, monospace;
        }

        .layers-list .layer-status {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .layers-list .layer-status.success {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .layers-list .layer-status.failed {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .error-details {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #000000;
          border-radius: 6px;
        }

        .error-details h4 {
          color: #fca5a5;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .error-details p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          margin: 0;
        }

        .bulk-summary-stats {
          margin-top: 32px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 12px;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .summary-header h3 {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .summary-actions {
          display: flex;
          gap: 12px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #000000;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .summary-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .summary-value {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          font-family: "JetBrains Mono", "Fira Code", consolas, monospace;
          margin-bottom: 8px;
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .upload-options {
            grid-template-columns: 1fr;
          }

          .bulk-summary-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .bulk-actions {
            justify-content: stretch;
          }

          .btn {
            flex: 1;
          }

          .bulk-file-item {
            grid-template-columns: auto 1fr;
            gap: 8px;
          }

          .expand-btn {
            grid-column: 1 / -1;
            margin-top: 8px;
            justify-self: center;
          }
        }
      `}</style>
    </div>
  );
}
