"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useToast } from "./ui/Toast";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import styles from "./CollaborativeEditor.module.css";
import logger from "../lib/client-logger";
import { delay } from "../lib/async-utils";

// Types for collaboration features
interface CursorPosition {
  line: number;
  column: number;
}

interface Selection {
  start: CursorPosition;
  end: CursorPosition;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  selection?: Selection;
  isActive: boolean;
  isHost?: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  author: string;
  content: string;
  line: number;
  column: number;
  timestamp: string;
  resolved: boolean;
}

interface Operation {
  type: "insert" | "delete" | "replace";
  position: number;
  content?: string;
  length?: number;
  oldLength?: number;
  baseRevision: number;
  clientId?: string;
}

interface CollaborativeEditorProps {
  sessionId?: string;
  initialCode?: string;
  filename?: string;
  language?: string;
  readonly?: boolean;
  onCodeChange?: (code: string) => void;
  onSave?: (code: string) => void;
  userData: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  };
}

/**
 * Collaborative Code Editor Component
 * Following NeuroLint Pro design system
 * Now using real API calls instead of WebSocket for demo purposes
 */
export default function CollaborativeEditor({
  sessionId,
  initialCode = "",
  filename = "untitled.tsx",
  language = "typescript",
  readonly = false,
  onCodeChange,
  onSave,
  userData,
}: CollaborativeEditorProps) {
  // Core state
  const [code, setCode] = useState(initialCode);
  const [isConnected, setIsConnected] = useState(false); // Start as disconnected
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    new Map(),
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );

  // Editor state
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 0,
    column: 0,
  });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [revisionNumber, setRevisionNumber] = useState(0);
  const [isHost, setIsHost] = useState(true); // Default to host in demo mode

  // UI state
  const [showComments, setShowComments] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentPosition, setCommentPosition] = useState<CursorPosition | null>(
    null,
  );
  const [newCommentText, setNewCommentText] = useState("");

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  // Assign a color to the user if not provided
  const userColor = useMemo(() => {
    return (
      userData.color ||
      [
        "#2196f3",
        "#4caf50",
        "#ff9800",
        "#e91e63",
        "#9c27b0",
        "#00bcd4",
        "#ff5722",
        "#795548",
      ][userData.id.charCodeAt(0) % 8]
    );
  }, [userData.color, userData.id]);

  /**
   * Handle text change in editor
   */
  const handleCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = event.target.value;
      setCode(newCode);
      setRevisionNumber((prev) => prev + 1);
      onCodeChange?.(newCode);
    },
    [onCodeChange],
  );

  /**
   * Handle cursor position change
   */
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const { selectionStart, selectionEnd } = textarea;

    // Calculate line and column
    const lines = code.slice(0, selectionStart).split("\n");
    const newCursor = {
      line: lines.length - 1,
      column: lines[lines.length - 1].length,
    };

    setCursorPosition(newCursor);

    // Handle selection
    if (selectionStart !== selectionEnd) {
      const endLines = code.slice(0, selectionEnd).split("\n");
      setSelection({
        start: newCursor,
        end: {
          line: endLines.length - 1,
          column: endLines[endLines.length - 1].length,
        },
      });
    } else {
      setSelection(null);
    }
  }, [code]);

  /**
   * Add comment
   */
  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || !commentPosition) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      authorId: userData.id,
      author: userData.name,
      content: newCommentText,
      line: commentPosition.line,
      column: commentPosition.column,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    setComments((prev) => [...prev, newComment]);
    setNewCommentText("");
    setIsAddingComment(false);
    setCommentPosition(null);
  }, [newCommentText, commentPosition, userData.id, userData.name]);

  /**
   * Start adding comment
   */
  const startAddingComment = useCallback(() => {
    setCommentPosition(cursorPosition);
    setIsAddingComment(true);
  }, [cursorPosition]);

  /**
   * Save code
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      onSave?.(code);
      setLastSaved(new Date());
      showToast({
        type: 'success',
        title: 'Code Saved',
        message: 'Your code has been saved successfully',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save code. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [code, onSave, showToast]);

  /**
   * Run NeuroLint Pro analysis using real API with retry logic
   */
  const runNeuroLint = useCallback(
    async (dryRun = true, layers?: number[], retryCount = 0) => {
      if (!code.trim()) {
        showToast({
          type: 'warning',
          title: 'No Code to Analyze',
          message: 'Please enter some code to analyze',
        });
        return;
      }

      setIsAnalyzing(true);
      if (retryCount === 0) {
        setAnalysisResult(null);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            filename,
            layers: layers || "auto",
            applyFixes: !dryRun,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Analysis failed");
        }

        setAnalysisResult(result);

        // Show analysis completion notification
        const notification = document.createElement("div");
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 0.875rem;
        z-index: 10000;
        transition: opacity 0.3s ease;
      `;
        notification.textContent = `Analysis complete: ${result.analysis?.detectedIssues?.length || 0} issues found`;
        document.body.appendChild(notification);

        delay(3000).then(() => {
          notification.style.opacity = "0";
          delay(300).then(() => document.body.removeChild(notification));
        });

        // If not dry run and we have transformed code, update the editor
        if (!dryRun && result.transformed && result.transformed !== code) {
          setCode(result.transformed);
          onCodeChange?.(result.transformed);
        }
      } catch (error) {
        logger.error("NeuroLint analysis failed", "COLLABORATIVE_EDITOR", { 
          component: 'CollaborativeEditor',
          filename,
          retryCount,
          error: error instanceof Error ? error.message : String(error)
        });

        // Retry logic for network errors
        if (
          retryCount < 2 &&
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message.includes("fetch") ||
            error.message.includes("network"))
        ) {
          logger.info(`Retrying analysis (attempt ${retryCount + 1}/3)`, "COLLABORATIVE_EDITOR", {
            component: 'CollaborativeEditor',
            filename,
            retryCount
          });
          
          // Use delay utility instead of setTimeout
          delay(1000 * (retryCount + 1)).then(() => {
            runNeuroLint(dryRun, layers, retryCount + 1);
          });
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showToast({
          type: 'error',
          title: 'Analysis Failed',
          message: `${errorMessage}${retryCount > 0 ? ` (after ${retryCount + 1} attempts)` : ""}`,
        });
      } finally {
        if (retryCount === 0) {
          setIsAnalyzing(false);
        }
      }
    },
    [code, filename, onCodeChange],
  );

  /**
   * Resolve comment
   */
  const resolveComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      )
    );
  }, []);

  /**
   * Delete comment
   */
  const deleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  // Initialize with demo collaborators
  useEffect(() => {
    if (sessionId) {
      // Add some demo collaborators for demonstration
      const demoCollaborators = new Map<string, Collaborator>();

      demoCollaborators.set("demo-user-1", {
        id: "demo-user-1",
        name: "Sarah Chen",
        color: "#4caf50",
        isActive: true,
        cursor: { line: 5, column: 12 },
      });

      demoCollaborators.set("demo-user-2", {
        id: "demo-user-2",
        name: "Alex Rodriguez",
        color: "#ff9800",
        isActive: true,
        cursor: { line: 15, column: 8 },
      });

      setCollaborators(demoCollaborators);
    }
  }, [sessionId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            handleSave();
            break;
          case "/":
            event.preventDefault();
            startAddingComment();
            break;
          case "Enter":
            if (event.shiftKey) {
              event.preventDefault();
              runNeuroLint(true);
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, startAddingComment, runNeuroLint]);

  return (
    <ErrorBoundary>
      <div className={styles.container} role="application" aria-label="Collaborative Code Editor">
        {/* Header */}
        <header className={styles.header} role="banner">
          <div className={styles.headerContent}>
            <h1 className={styles.title} id="editor-title">
              {filename}
            </h1>

            {/* Connection Status */}
            <div 
              className={`${styles.connectionStatus} ${styles[connectionStatus]}`}
              role="status"
              aria-live="polite"
              aria-label={`Connection status: ${connectionStatus}`}
            >
              <div 
                className={`${styles.statusDot} ${styles[connectionStatus]}`}
                aria-hidden="true"
              />
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
            </div>

            {/* Collaborator Count */}
            {collaborators.size > 0 && (
              <div 
                className={styles.collaboratorCount}
                role="status"
                aria-label={`${collaborators.size + 1} collaborators online`}
              >
                {collaborators.size + 1} collaborators
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions} role="toolbar" aria-label="Editor actions">
            <button
              onClick={startAddingComment}
              className={styles.actionButton}
              disabled={isAddingComment}
              aria-label="Add comment at current cursor position"
              aria-describedby="comment-help"
            >
              {isAddingComment ? "Adding..." : "Add Comment"}
            </button>

            <button
              onClick={() => runNeuroLint(true)}
              className={`${styles.actionButton} ${styles.primary}`}
              disabled={isAnalyzing}
              aria-label="Run code analysis"
              aria-describedby="analysis-help"
            >
              {isAnalyzing ? "Analyzing..." : "Run Analysis"}
            </button>

            <button
              onClick={handleSave}
              className={`${styles.actionButton} ${styles.success}`}
              disabled={isSaving}
              aria-label="Save current code"
              aria-describedby="save-help"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        {/* Help text for screen readers */}
        <div className="sr-only">
          <div id="comment-help">Add a comment at the current cursor position. Use Ctrl+Shift+C as a keyboard shortcut.</div>
          <div id="analysis-help">Run NeuroLint Pro analysis on the current code to find potential improvements.</div>
          <div id="save-help">Save the current code to your local storage. Use Ctrl+S as a keyboard shortcut.</div>
        </div>

        {/* Main Content */}
        <main className={styles.mainContent} role="main">
          {/* Editor Container */}
          <section className={styles.editorContainer} aria-labelledby="editor-title">
            <div className={styles.editorHeader}>
              <div className={styles.editorTabs} role="tablist">
                <div 
                  className={`${styles.tab} ${styles.active}`}
                  role="tab"
                  aria-selected="true"
                  aria-label={`Active tab: ${filename}`}
                >
                  <span aria-hidden="true">📄</span>
                  {filename}
                </div>
              </div>
              <div className={styles.editorActions}>
                <span className={styles.editorInfo} aria-label={`File type: ${language.toUpperCase()}, ${code.length} characters`}>
                  {language.toUpperCase()} • {code.length} characters
                </span>
              </div>
            </div>

            <textarea
              ref={editorRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleCursorChange}
              onSelect={handleCursorChange}
              className={styles.codeEditor}
              placeholder="Enter your code here..."
              readOnly={readonly}
              disabled={isAnalyzing}
              aria-label={`Code editor for ${filename}`}
              aria-describedby="editor-description"
              role="textbox"
              aria-multiline="true"
              aria-required="false"
              tabIndex={0}
            />

            <div className={styles.editorFooter}>
              <div className={styles.editorInfo} role="status" aria-live="polite">
                <span>Lines: {code.split('\n').length}</span>
                <span>Words: {code.split(/\s+/).filter(Boolean).length}</span>
                <span>Last saved: {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Never'}</span>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className={styles.sidebar} role="complementary" aria-label="Collaboration sidebar">
            {/* Comments Section */}
            <section className={styles.sidebarSection} aria-labelledby="comments-title">
              <h3 id="comments-title" className={styles.sectionTitle}>Comments</h3>
              
              {isAddingComment && (
                <div className={styles.commentForm} role="form" aria-label="Add comment form">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className={styles.commentInput}
                    aria-label="Comment text"
                    aria-describedby="comment-instructions"
                  />
                  <div className={styles.actions} role="group" aria-label="Comment form actions">
                    <button
                      onClick={handleAddComment}
                      className={styles.commentButton}
                      disabled={!newCommentText.trim()}
                      aria-label="Add comment"
                    >
                      Add Comment
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingComment(false);
                        setNewCommentText("");
                      }}
                      className={styles.actionButton}
                      aria-label="Cancel adding comment"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div 
                className={styles.commentsList}
                role="list"
                aria-label="Comments list"
                aria-describedby="comments-count"
              >
                {comments.length === 0 ? (
                  <div className={styles.emptyState} role="status" aria-live="polite">
                    <div className={styles.emptyStateIcon} aria-hidden="true">💬</div>
                    <p className={styles.emptyStateText}>No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <article 
                      key={comment.id} 
                      className={styles.commentItem}
                      role="listitem"
                      aria-labelledby={`comment-${comment.id}-author`}
                    >
                      <div className={styles.commentHeader}>
                        <span 
                          id={`comment-${comment.id}-author`}
                          className={styles.commentAuthor}
                        >
                          {comment.author}
                        </span>
                        <span className={styles.commentTimestamp}>
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.commentContent}>{comment.content}</div>
                      <div className={styles.commentActions} role="group" aria-label={`Actions for comment by ${comment.author}`}>
                        {!comment.resolved && (
                          <button
                            onClick={() => resolveComment(comment.id)}
                            className={`${styles.commentActionButton} ${styles.resolve}`}
                            aria-label={`Resolve comment by ${comment.author}`}
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className={`${styles.commentActionButton} ${styles.delete}`}
                          aria-label={`Delete comment by ${comment.author}`}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
              <div id="comments-count" className="sr-only">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </div>
            </section>

            {/* Collaborators Section */}
            <section className={styles.sidebarSection} aria-labelledby="collaborators-title">
              <h3 id="collaborators-title" className={styles.sectionTitle}>Collaborators</h3>
              <div 
                className={styles.collaboratorsList}
                role="list"
                aria-label="Collaborators list"
              >
                {Array.from(collaborators.values()).map((collaborator) => (
                  <div 
                    key={collaborator.id} 
                    className={styles.collaboratorItem}
                    role="listitem"
                    aria-label={`${collaborator.name} is ${collaborator.isActive ? 'online' : 'away'}`}
                  >
                    <div 
                      className={styles.collaboratorAvatar}
                      style={{ backgroundColor: collaborator.color }}
                      aria-hidden="true"
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.collaboratorInfo}>
                      <div className={styles.collaboratorName}>{collaborator.name}</div>
                      <div 
                        className={`${styles.collaboratorStatus} ${styles[collaborator.isActive ? 'online' : 'away']}`}
                        aria-label={`Status: ${collaborator.isActive ? 'Online' : 'Away'}`}
                      >
                        {collaborator.isActive ? 'Online' : 'Away'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </main>

        {/* Hidden description for screen readers */}
        <div id="editor-description" className="sr-only">
          Collaborative code editor with real-time collaboration features. 
          Use Tab to navigate between elements, Enter to activate buttons, 
          and Ctrl+S to save your code.
        </div>
        <div id="comment-instructions" className="sr-only">
          Type your comment here. Press Enter to submit or Escape to cancel.
        </div>
      </div>
    </ErrorBoundary>
  );
}
