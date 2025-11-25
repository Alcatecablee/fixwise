'use client';

import React, { useState, useRef, useCallback } from "react";
import { useToast } from "../../../components/ui/Toast";
import logger from "../../../lib/client-logger";

interface CodeAnalysisProps {
  onAnalyzeCode: (code: string, filename: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  currentFile: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadSectionRef?: React.RefObject<HTMLDivElement>;
  pasteSectionRef?: React.RefObject<HTMLDivElement>;
  githubSectionRef?: React.RefObject<HTMLDivElement>;
  onModeChange?: (mode: "upload" | "paste" | "github") => void;
  onNavigateToGitHub?: () => void;
}

export default function CodeAnalysis({
  onAnalyzeCode,
  onFileUpload,
  isLoading,
  currentFile,
  fileInputRef,
  uploadSectionRef,
  pasteSectionRef,
  githubSectionRef,
  onModeChange,
  onNavigateToGitHub,
}: CodeAnalysisProps) {
  const [codeInput, setCodeInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<
    "upload" | "paste" | "github"
  >("upload");
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const { showToast } = useToast();

  const handleAnalyzeClick = useCallback(() => {
    const code = codeInput.trim();
    if (!code) {
      showToast({
        type: 'warning',
        title: 'No Code Provided',
        message: 'Please paste some code first to analyze',
      });
      logger.ui('User attempted to analyze empty code', { component: 'CodeAnalysis' });
      return;
    }

    // Generate a filename based on code content
    let filename = "pasted-code.tsx";
    if (code.includes("export default")) {
      const match = code.match(/export default function (\w+)/);
      if (match) {
        filename = `${match[1]}.tsx`;
      }
    } else if (code.includes("function ")) {
      const match = code.match(/function (\w+)/);
      if (match) {
        filename = `${match[1]}.tsx`;
      }
    }

    onAnalyzeCode(code, filename);

    // Scroll to paste section to show analysis is starting
    if (pasteSectionRef?.current) {
      pasteSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [codeInput, onAnalyzeCode, pasteSectionRef]);

  const handleClearCode = useCallback(() => {
    setCodeInput("");
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
          // Create a fake event for the file handler
          const fakeEvent = {
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onFileUpload(fakeEvent);
        } else {
          showToast({
            type: 'error',
            title: 'Invalid File Type',
            message: 'Please upload a TypeScript or JavaScript file (.ts, .tsx, .js, .jsx)',
          });
          logger.ui('User attempted to upload invalid file type', { 
            component: 'CodeAnalysis',
            fileName: file.name,
            fileType: file.type 
          });
        }
      }
    },
    [onFileUpload],
  );

  const sampleCodes = [
    {
            name: "Legacy React Patterns",
      code: `import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const handleClick = () => {
    // [NeuroLint] Removed console.log: 'Adding to cart:', product.id
    onAddToCart(product);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button type="button">Add to Cart</button>
    </div>
  );
}`,
            description: "Legacy component patterns ready for React 18 modernization",
    },
    {
            name: "Legacy SSR Patterns",
      code: `import React, { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  if (!isClient) return null;

  return (
    <div className="user-profile">
      <h1>Welcome {user?.name}!</h1>
      {window.innerWidth > 768 && (
        <div className="desktop-only">
          <p>Screen width: {window.innerWidth}px</p>
        </div>
      )}
    </div>
  );
}`,
            description: "Legacy SSR patterns that can be modernized for Next.js 14",
    },
    {
            name: "Legacy Next.js Patterns",
      code: `import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BlogPost({ post }) {
  const router = useRouter();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href
      });
    }
  };

  return (
    <article className="blog-post">
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      <Link href="/blog">
        <a>← Back to Blog</a>
      </Link>
    </article>
  );
}`,
            description: "Legacy Next.js patterns ready for App Router migration",
    },
  ];

  return (
    <div className="code-analysis-root">
      {/* Header Section */}
      <div className="analysis-header">
        <div className="header-title">
                    <h2>Legacy Code Scanner</h2>
          <p>
            Upload, paste, or drag files to scan for React/Next.js modernization opportunities
          </p>
        </div>

        <div className="analysis-modes">
          {(["upload", "paste", "github"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setAnalysisMode(mode);
                onModeChange?.(mode);
              }}
              className={`mode-btn ${analysisMode === mode ? "active" : ""}`}
            >
              {mode === "upload"
                ? "UPLOAD"
                : mode === "paste"
                  ? "PASTE"
                  : "GITHUB"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="analysis-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{recentFiles.length}</div>
            <div className="stat-label">Files Analyzed</div>
            <div className="stat-change">
              <span className="trend-indicator success">
                ↗ Ready for Upload
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">Ready</div>
            <div className="stat-label">Analysis Engine</div>
            <div className="stat-change">
              <span className="trend-indicator success">
                ↗ Online & Optimized
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">6</div>
            <div className="stat-label">Analysis Layers</div>
            <div className="stat-breakdown">
              <span className="high">Config</span>
              <span className="medium">Patterns</span>
              <span className="low">Components</span>
            </div>
          </div>
        </div>

        <div className="stat-card performance">
          <div className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">Fast</div>
            <div className="stat-label">Processing</div>
            <div className="stat-trend">
              <span className="trend-icon improving">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </span>
              <span className="trend-text">optimized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="analysis-content">
        {analysisMode === "upload" && (
          <div className="upload-section" ref={uploadSectionRef}>
            <div
              className={`upload-area ${dragActive ? "drag-active" : ""}`}
              onClick={() => {
                fileInputRef.current?.click();
                // Scroll to upload section when clicking
                if (uploadSectionRef?.current) {
                  uploadSectionRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                  });
                }
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload React or Next.js files for analysis"
            >
              <div className="upload-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="48"
                  height="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3>Drop Files Here or Click to Browse</h3>
              <p>Support for .ts, .tsx, .js, .jsx files</p>
              <div className="supported-formats">
                <span className="format-badge">TypeScript</span>
                <span className="format-badge">JavaScript</span>
                <span className="format-badge">React JSX</span>
                <span className="format-badge">Next.js</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept=".jsx,.tsx,.js,.ts"
                onChange={onFileUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>
        )}

        {analysisMode === "paste" && (
          <div className="paste-section" ref={pasteSectionRef}>
            <div className="code-editor-container">
              <div className="editor-header">
                <div className="editor-tabs">
                  <div className="tab active">
                    <span className="tab-icon">CODE</span>
                    <span>Code Input</span>
                  </div>
                </div>
                <div className="editor-actions">
                  <button
                    className="action-btn"
                    onClick={handleClearCode}
                    disabled={!codeInput}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                className="code-textarea"
                placeholder="Paste your React/Next.js code here...

Example:
import React from 'react';

export default function MyComponent() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                rows={16}
                aria-label="Code input area"
              />

              <div className="editor-footer">
                <div className="editor-info">
                  <span className="char-count">
                    {codeInput.length} characters
                  </span>
                  <span className="line-count">
                    {codeInput.split("\n").length} lines
                  </span>
                </div>
                <button
                  className="analyze-btn primary"
                  onClick={handleAnalyzeClick}
                  disabled={isLoading || !codeInput.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Analyze Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {analysisMode === "github" && (
          <div className="github-section" ref={githubSectionRef}>
            <div className="github-card">
              <div className="github-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="48"
                  height="48"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <h3>GitHub Repository Analysis</h3>
              <p>Connect your GitHub account to analyze entire repositories</p>
              <button
                className="github-btn secondary"
                onClick={onNavigateToGitHub}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Go to GitHub Integration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current File Info */}
      {currentFile && (
        <div className="current-file-section">
          <div className="file-info-card">
            <div className="file-icon">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="file-details">
              <h4>Current File</h4>
              <span className="filename">{currentFile}</span>
              <span className="file-status success">Ready for analysis</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .code-analysis-root {
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .header-title h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .header-title p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 1rem;
        }

        .analysis-modes {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 4px;
        }

        .mode-btn {
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .mode-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .mode-btn.active {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          color: #ffffff;
          border: 2px solid #000000;
        }

        .analysis-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(25px) saturate(1.2);
          -webkit-backdrop-filter: blur(25px) saturate(1.2);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .stat-card.primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .stat-card.success {
          background: linear-gradient(
            135deg,
            rgba(76, 175, 80, 0.2) 0%,
            rgba(76, 175, 80, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .stat-card.warning {
          background: linear-gradient(
            135deg,
            rgba(255, 152, 0, 0.2) 0%,
            rgba(255, 152, 0, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .stat-card.performance {
          background: linear-gradient(
            135deg,
            rgba(156, 39, 176, 0.2) 0%,
            rgba(156, 39, 176, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          border-radius: 12px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trend-indicator {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .trend-indicator.success {
          color: #4caf50;
        }

        .stat-breakdown {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .stat-breakdown .high {
          color: #e53e3e;
        }

        .stat-breakdown .medium {
          color: #ff9800;
        }

        .stat-breakdown .low {
          color: #4caf50;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trend-icon {
          display: flex;
          align-items: center;
        }

        .trend-icon.improving {
          color: #4caf50;
        }

        .trend-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: capitalize;
        }

        .analysis-content {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 2rem;
        }

        .upload-area {
          border: 2px dashed #000000;
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .upload-area:hover,
        .upload-area.drag-active {
          border-color: #000000;
          background: rgba(33, 150, 243, 0.05);
          transform: translateY(-2px);
        }

        .upload-icon {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }

        .upload-area h3 {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .upload-area p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin: 0 0 1.5rem 0;
        }

        .supported-formats {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .format-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .code-editor-container {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #000000;
          border-radius: 12px;
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid #000000;
        }

        .editor-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          border-radius: 6px;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .tab.active {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
        }

        .editor-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #000000;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .code-textarea {
          width: 100%;
          min-height: 400px;
          padding: 1.5rem;
          background: transparent;
          border: none;
          color: #ffffff;
          font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .code-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-top: 1px solid #000000;
        }

        .editor-info {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .analyze-btn.primary {
          background: linear-gradient(
            135deg,
            rgba(33, 150, 243, 0.2) 0%,
            rgba(33, 150, 243, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
          color: #ffffff;
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 1px solid #000000;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .github-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .github-card {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }

        .github-icon {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }

        .github-card h3 {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .github-card p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .github-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: 2px solid #000000;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .github-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .github-btn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.15);
        }

        .current-file-section {
          background: linear-gradient(
            135deg,
            rgba(76, 175, 80, 0.2) 0%,
            rgba(76, 175, 80, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .file-info-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #000000;
          border-radius: 12px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .file-details h4 {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .filename {
          display: block;
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .file-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border: 1px solid #000000;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .file-status.success {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        @media (max-width: 768px) {
          .analysis-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .analysis-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .samples-grid {
            grid-template-columns: 1fr;
          }

          .sample-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
