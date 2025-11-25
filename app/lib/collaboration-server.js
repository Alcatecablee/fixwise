/**
 * Real-time Collaboration Server for NeuroLint Pro
 *
 * Provides WebSocket-based real-time collaboration features:
 * - Live code editing with operational transforms
 * - User presence and live cursors
 * - Real-time chat and comments
 * - Session management and synchronization
 */

const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const {
  CollaborationErrorRecovery,
} = require("./collaboration-error-recovery");

/**
 * Operational Transform System
 * Handles conflict resolution for concurrent edits
 */
class OperationalTransform {
  constructor() {
    this.operations = [];
    this.revisionNumber = 0;
  }

  /**
   * Apply operation with conflict resolution
   */
  applyOperation(operation) {
    // Transform operation against concurrent operations
    const transformedOp = this.transformOperation(operation);

    // Apply to document
    this.operations.push(transformedOp);
    this.revisionNumber++;

    return {
      operation: transformedOp,
      revision: this.revisionNumber,
      success: true,
    };
  }

  /**
   * Transform operation against concurrent operations
   */
  transformOperation(operation) {
    let transformedOp = { ...operation };

    // Get operations that happened after the client's base revision
    const concurrentOps = this.operations.slice(operation.baseRevision);

    // Transform against each concurrent operation
    for (const concurrentOp of concurrentOps) {
      transformedOp = this.transformAgainst(transformedOp, concurrentOp);
    }

    return transformedOp;
  }

  /**
   * Transform one operation against another
   * Improved algorithm with better edge case handling
   */
  transformAgainst(op1, op2) {
    // Handle replace operations
    if (op1.type === "replace" || op2.type === "replace") {
      return this.transformReplaceOperations(op1, op2);
    }

    // Insert vs Insert
    if (op1.type === "insert" && op2.type === "insert") {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return {
          ...op1,
          position: op1.position + op2.content.length,
        };
      } else {
        // Same position - prioritize by clientId for deterministic behavior
        return op1.clientId < op2.clientId
          ? op1
          : {
              ...op1,
              position: op1.position + op2.content.length,
            };
      }
    }

    // Delete vs Insert
    if (op1.type === "delete" && op2.type === "insert") {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + op2.content.length,
        };
      }
    }

    // Insert vs Delete
    if (op1.type === "insert" && op2.type === "delete") {
      if (op1.position <= op2.position) {
        return op1;
      } else if (op1.position >= op2.position + op2.length) {
        return {
          ...op1,
          position: op1.position - op2.length,
        };
      } else {
        // Insert position is within deleted range
        return {
          ...op1,
          position: op2.position,
        };
      }
    }

    // Delete vs Delete
    if (op1.type === "delete" && op2.type === "delete") {
      if (op1.position >= op2.position + op2.length) {
        // op1 is after op2's deleted range
        return {
          ...op1,
          position: op1.position - op2.length,
        };
      } else if (op1.position + op1.length <= op2.position) {
        // op1 is before op2's deleted range
        return op1;
      } else {
        // Overlapping deletes - need to adjust
        const start1 = op1.position;
        const end1 = op1.position + op1.length;
        const start2 = op2.position;
        const end2 = op2.position + op2.length;

        if (start1 < start2 && end1 > end2) {
          // op1 encompasses op2
          return {
            ...op1,
            length: op1.length - op2.length,
          };
        } else if (start1 >= start2 && end1 <= end2) {
          // op1 is encompassed by op2 - becomes empty
          return {
            ...op1,
            length: 0,
          };
        } else {
          // Partial overlap - complex case
          const newStart = Math.max(
            start1,
            start2 - Math.max(0, start2 - start1),
          );
          const newEnd = Math.min(end1, start2);
          return {
            ...op1,
            position: newStart,
            length: Math.max(0, newEnd - newStart),
          };
        }
      }
    }

    return op1;
  }

  /**
   * Handle transformation of replace operations
   */
  transformReplaceOperations(op1, op2) {
    if (op1.type === "replace" && op2.type === "replace") {
      // Replace vs Replace - later operation wins
      return op1.baseRevision > op2.baseRevision
        ? op1
        : {
            ...op1,
            position: op2.position + op2.content.length,
            oldLength: 0,
          };
    }

    if (op1.type === "replace") {
      // Transform other operations against replace
      if (op2.type === "insert") {
        if (op2.position <= op1.position) {
          return {
            ...op1,
            position: op1.position + op2.content.length,
          };
        }
      } else if (op2.type === "delete") {
        if (op2.position + op2.length <= op1.position) {
          return {
            ...op1,
            position: op1.position - op2.length,
          };
        }
      }
    }

    return op1;
  }
}

/**
 * Collaboration Session Manager
 */
class CollaborationSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.clients = new Map();
    this.document = {
      content: "",
      filename: "untitled.tsx",
      language: "typescript",
    };
    this.operationalTransform = new OperationalTransform();
    this.cursors = new Map();
    this.selections = new Map();
    this.comments = [];
    this.chatMessages = [];
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.isLocked = false;
    this.hostUserId = null;
  }

  /**
   * Add client to session
   */
  addClient(clientId, userData, websocket) {
    if (this.clients.size === 0) {
      this.hostUserId = clientId;
    }

    const client = {
      id: clientId,
      userData,
      websocket,
      joinedAt: new Date(),
      isActive: true,
      cursor: { line: 0, column: 0 },
      selection: null,
    };

    this.clients.set(clientId, client);
    this.lastActivity = new Date();

    // Send initial state to new client
    this.sendToClient(clientId, {
      type: "session-state",
      data: {
        sessionId: this.sessionId,
        document: this.document,
        revision: this.operationalTransform.revisionNumber,
        clients: this.getClientList(),
        cursors: Array.from(this.cursors.entries()),
        selections: Array.from(this.selections.entries()),
        comments: this.comments,
        chatMessages: this.chatMessages.slice(-50), // Last 50 messages
        isHost: clientId === this.hostUserId,
      },
    });

    // Notify other clients
    this.broadcastToOthers(clientId, {
      type: "client-joined",
      data: {
        client: this.getClientInfo(clientId),
        totalClients: this.clients.size,
      },
    });

    return client;
  }

  /**
   * Remove client from session
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);
    this.cursors.delete(clientId);
    this.selections.delete(clientId);

    // Transfer host if needed
    if (this.hostUserId === clientId && this.clients.size > 0) {
      this.hostUserId = Array.from(this.clients.keys())[0];
    }

    // Notify remaining clients
    this.broadcastToAll({
      type: "client-left",
      data: {
        clientId,
        newHost: this.hostUserId,
        totalClients: this.clients.size,
      },
    });

    this.lastActivity = new Date();
  }

  /**
   * Validate and sanitize operation
   */
  validateOperation(operation) {
    if (!operation || typeof operation !== "object") {
      return { valid: false, error: "Invalid operation format" };
    }

    const { type, position, content, length, oldLength } = operation;

    // Validate operation type
    if (!["insert", "delete", "replace"].includes(type)) {
      return { valid: false, error: "Invalid operation type" };
    }

    // Validate position
    if (typeof position !== "number" || position < 0) {
      return { valid: false, error: "Invalid position" };
    }

    // Validate content for insert/replace operations
    if (
      (type === "insert" || type === "replace") &&
      typeof content !== "string"
    ) {
      return { valid: false, error: "Invalid content" };
    }

    // Validate content size (max 10KB per operation)
    if (content && content.length > 10240) {
      return { valid: false, error: "Operation content too large" };
    }

    // Validate length for delete operations
    if (type === "delete" && (typeof length !== "number" || length <= 0)) {
      return { valid: false, error: "Invalid delete length" };
    }

    // Validate oldLength for replace operations
    if (
      type === "replace" &&
      (typeof oldLength !== "number" || oldLength < 0)
    ) {
      return { valid: false, error: "Invalid replace oldLength" };
    }

    // Sanitize content (remove potentially dangerous characters)
    if (content) {
      operation.content = content.replace(
        /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
        "",
      );
    }

    return { valid: true };
  }

  /**
   * Handle code operation with validation
   */
  handleOperation(clientId, operation) {
    if (this.isLocked && this.hostUserId !== clientId) {
      this.sendToClient(clientId, {
        type: "operation-rejected",
        data: { reason: "Session is locked" },
      });
      return;
    }

    // Validate operation
    const validation = this.validateOperation(operation);
    if (!validation.valid) {
      this.sendToClient(clientId, {
        type: "operation-rejected",
        data: { reason: validation.error },
      });
      return;
    }

    try {
      const result = this.operationalTransform.applyOperation(operation);

      if (result.success) {
        // Apply operation to document
        this.applyOperationToDocument(result.operation);

        // Broadcast to all clients
        this.broadcastToAll({
          type: "operation",
          data: {
            operation: result.operation,
            revision: result.revision,
            clientId,
            timestamp: new Date().toISOString(),
          },
        });

        this.lastActivity = new Date();
      }

      return result;
    } catch (error) {
      this.sendToClient(clientId, {
        type: "operation-error",
        data: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply operation to document content with size validation
   */
  applyOperationToDocument(operation) {
    const maxDocumentSize = 2 * 1024 * 1024; // 2MB limit
    let newContent;

    switch (operation.type) {
      case "insert":
        newContent =
          this.document.content.slice(0, operation.position) +
          operation.content +
          this.document.content.slice(operation.position);
        break;

      case "delete":
        newContent =
          this.document.content.slice(0, operation.position) +
          this.document.content.slice(operation.position + operation.length);
        break;

      case "replace":
        newContent =
          this.document.content.slice(0, operation.position) +
          operation.content +
          this.document.content.slice(operation.position + operation.oldLength);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    // Check document size limit
    if (newContent.length > maxDocumentSize) {
      throw new Error(
        `Document size would exceed limit (${maxDocumentSize} bytes)`,
      );
    }

    // Validate position bounds
    if (operation.position > this.document.content.length) {
      throw new Error("Operation position out of bounds");
    }

    this.document.content = newContent;
    this.lastActivity = new Date();

    // Log performance metrics for large documents
    if (newContent.length > 100000) {
      console.log(
        `[COLLABORATION] Large document in session ${this.sessionId}: ${newContent.length} chars, ${this.operationalTransform.operations.length} operations`,
      );
    }
  }

  /**
   * Update cursor position
   */
  updateCursor(clientId, cursor) {
    this.cursors.set(clientId, cursor);

    this.broadcastToOthers(clientId, {
      type: "cursor-update",
      data: { clientId, cursor },
    });
  }

  /**
   * Update selection
   */
  updateSelection(clientId, selection) {
    if (selection) {
      this.selections.set(clientId, selection);
    } else {
      this.selections.delete(clientId);
    }

    this.broadcastToOthers(clientId, {
      type: "selection-update",
      data: { clientId, selection },
    });
  }

  /**
   * Add comment
   */
  addComment(clientId, comment) {
    const newComment = {
      id: uuidv4(),
      clientId,
      author: this.clients.get(clientId)?.userData?.name || "Anonymous",
      content: comment.content,
      line: comment.line,
      column: comment.column,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.comments.push(newComment);

    this.broadcastToAll({
      type: "comment-added",
      data: newComment,
    });

    return newComment;
  }

  /**
   * Add chat message
   */
  addChatMessage(clientId, message) {
    const newMessage = {
      id: uuidv4(),
      clientId,
      author: this.clients.get(clientId)?.userData?.name || "Anonymous",
      content: message.content,
      timestamp: new Date().toISOString(),
      type: message.type || "message",
    };

    this.chatMessages.push(newMessage);

    // Keep only last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }

    this.broadcastToAll({
      type: "chat-message",
      data: newMessage,
    });

    return newMessage;
  }

  /**
   * Get client information
   */
  getClientInfo(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      id: clientId,
      name: client.userData.name,
      avatar: client.userData.avatar,
      color: client.userData.color,
      isHost: clientId === this.hostUserId,
      joinedAt: client.joinedAt,
      isActive: client.isActive,
    };
  }

  /**
   * Get list of all clients
   */
  getClientList() {
    return Array.from(this.clients.keys()).map((clientId) =>
      this.getClientInfo(clientId),
    );
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.websocket.readyState === 1) {
      client.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast to all clients except sender
   */
  broadcastToOthers(senderId, message) {
    for (const [clientId, client] of this.clients) {
      if (clientId !== senderId && client.websocket.readyState === 1) {
        client.websocket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Broadcast to all clients
   */
  broadcastToAll(message) {
    for (const [clientId, client] of this.clients) {
      if (client.websocket.readyState === 1) {
        client.websocket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Check if session is empty
   */
  isEmpty() {
    return this.clients.size === 0;
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      clientCount: this.clients.size,
      documentLength: this.document.content.length,
      operationCount: this.operationalTransform.operations.length,
      commentCount: this.comments.length,
      messageCount: this.chatMessages.length,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
    };
  }
}

/**
 * Main Collaboration Server
 */
class CollaborationServer {
  constructor(port = 8080) {
    this.port = port;
    this.sessions = new Map();
    this.clients = new Map();
    this.wss = null;
    this.rateLimiter = new Map(); // clientId -> { count, resetTime }
    this.maxMessagesPerMinute = 100;
    this.messageHistory = new Map(); // Track message frequency
    this.errorRecovery = new CollaborationErrorRecovery();
  }

  /**
   * Start the collaboration server
   */
  start() {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on("connection", (ws, request) => {
      const clientId = uuidv4();
      console.log(`[COLLABORATION] Client connected: ${clientId}`);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error("[COLLABORATION] Invalid message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              data: { error: "Invalid message format" },
            }),
          );
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(clientId);
      });

      ws.on("error", (error) => {
        console.error(`[COLLABORATION] Client error ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Store client connection
      this.clients.set(clientId, { websocket: ws, sessionId: null });
    });

    // Cleanup inactive sessions periodically
    setInterval(() => {
      this.cleanupSessions();
    }, 60000); // Every minute

    console.log(`[COLLABORATION] Server started on port ${this.port}`);
  }

  /**
   * Check rate limiting for client
   */
  checkRateLimit(clientId) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    if (!this.rateLimiter.has(clientId)) {
      this.rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const clientData = this.rateLimiter.get(clientId);

    if (now > clientData.resetTime) {
      // Reset window
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return true;
    }

    if (clientData.count >= this.maxMessagesPerMinute) {
      return false; // Rate limit exceeded
    }

    clientData.count++;
    return true;
  }

  /**
   * Handle incoming message with rate limiting
   */
  handleMessage(clientId, ws, message) {
    // Rate limiting check
    if (!this.checkRateLimit(clientId)) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { error: "Rate limit exceeded. Please slow down." },
        }),
      );
      return;
    }

    const { type, data } = message;

    switch (type) {
      case "join-session":
        this.handleJoinSession(clientId, data);
        break;

      case "create-session":
        this.handleCreateSession(clientId, data);
        break;

      case "operation":
        this.handleOperation(clientId, data);
        break;

      case "cursor-update":
        this.handleCursorUpdate(clientId, data);
        break;

      case "selection-update":
        this.handleSelectionUpdate(clientId, data);
        break;

      case "add-comment":
        this.handleAddComment(clientId, data);
        break;

      case "chat-message":
        this.handleChatMessage(clientId, data);
        break;

      case "run-neurolint":
        this.handleRunNeuroLint(clientId, data);
        break;

      default:
        console.warn(`[COLLABORATION] Unknown message type: ${type}`);
    }
  }

  /**
   * Handle session join
   */
  handleJoinSession(clientId, data) {
    const { sessionId, userData } = data;

    if (!this.sessions.has(sessionId)) {
      this.sendToClient(clientId, {
        type: "error",
        data: { error: "Session not found" },
      });
      return;
    }

    const session = this.sessions.get(sessionId);
    session.addClient(clientId, userData, this.clients.get(clientId).websocket);

    // Update client session reference
    this.clients.get(clientId).sessionId = sessionId;

    console.log(
      `[COLLABORATION] Client ${clientId} joined session ${sessionId}`,
    );
  }

  /**
   * Handle session creation
   */
  handleCreateSession(clientId, data) {
    const sessionId = data.sessionId || uuidv4();
    const session = new CollaborationSession(sessionId);

    if (data.document) {
      session.document = { ...session.document, ...data.document };
    }

    this.sessions.set(sessionId, session);
    session.addClient(
      clientId,
      data.userData,
      this.clients.get(clientId).websocket,
    );

    // Update client session reference
    this.clients.get(clientId).sessionId = sessionId;

    console.log(`[COLLABORATION] Session created: ${sessionId}`);
  }

  /**
   * Handle code operation
   */
  handleOperation(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.handleOperation(clientId, data);
    }
  }

  /**
   * Handle cursor update
   */
  handleCursorUpdate(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.updateCursor(clientId, data.cursor);
    }
  }

  /**
   * Handle selection update
   */
  handleSelectionUpdate(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.updateSelection(clientId, data.selection);
    }
  }

  /**
   * Handle comment addition
   */
  handleAddComment(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.addComment(clientId, data);
    }
  }

  /**
   * Handle chat message
   */
  handleChatMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.addChatMessage(clientId, data);
    }
  }

  /**
   * Handle NeuroLint Pro execution with improved error handling
   */
  async handleRunNeuroLint(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const session = this.sessions.get(client.sessionId);
    if (!session) return;

    // Validate input
    if (
      !session.document.content ||
      session.document.content.trim().length === 0
    ) {
      session.sendToClient(clientId, {
        type: "neurolint-error",
        data: { error: "No code content to analyze" },
      });
      return;
    }

    // Check document size limit (1MB)
    if (session.document.content.length > 1024 * 1024) {
      session.sendToClient(clientId, {
        type: "neurolint-error",
        data: { error: "Document too large for analysis (max 1MB)" },
      });
      return;
    }

    // Notify start of analysis
    session.broadcastToAll({
      type: "neurolint-started",
      data: {
        triggeredBy: clientId,
        timestamp: new Date().toISOString(),
      },
    });

    try {
      // Import NeuroLint Pro Enhanced with timeout
      const NeuroLintProEnhanced = require("../neurolint-pro-enhanced");

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Analysis timeout (30s)")), 30000);
      });

      // Run analysis with timeout
      const analysisPromise = NeuroLintProEnhanced(
        session.document.content,
        session.document.filename,
        data.dryRun !== false, // Default to dry run for safety
        data.layers || null,
        { verbose: false },
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);

      // Validate result
      if (!result || typeof result !== "object") {
        throw new Error("Invalid analysis result");
      }

      // Broadcast results to all clients in session
      session.broadcastToAll({
        type: "neurolint-result",
        data: {
          result,
          triggeredBy: clientId,
          timestamp: new Date().toISOString(),
        },
      });

      // If applying fixes, update document with additional validation
      if (
        data.dryRun === false &&
        result.success &&
        result.transformed &&
        result.transformed !== session.document.content &&
        typeof result.transformed === "string"
      ) {
        // Validate transformed content
        if (result.transformed.length > 2 * 1024 * 1024) {
          session.sendToClient(clientId, {
            type: "neurolint-error",
            data: { error: "Transformed code too large (max 2MB)" },
          });
          return;
        }

        const operation = {
          type: "replace",
          position: 0,
          oldLength: session.document.content.length,
          content: result.transformed,
          baseRevision: session.operationalTransform.revisionNumber,
          clientId,
          metadata: {
            type: "neurolint-fix",
            layers: data.layers,
            originalLength: session.document.content.length,
            transformedLength: result.transformed.length,
          },
        };

        session.handleOperation(clientId, operation);

        // Log successful transformation
        console.log(
          `[COLLABORATION] NeuroLint transformation applied in session ${session.sessionId}: ${operation.oldLength} -> ${operation.content.length} chars`,
        );
      }
    } catch (error) {
      console.error(
        `[COLLABORATION] NeuroLint error in session ${session.sessionId}:`,
        error,
      );

      // Broadcast error to all clients
      session.broadcastToAll({
        type: "neurolint-error",
        data: {
          error: error.message || "Unknown analysis error",
          triggeredBy: clientId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.sessionId) {
      const session = this.sessions.get(client.sessionId);
      if (session) {
        session.removeClient(clientId);

        // Remove empty sessions
        if (session.isEmpty()) {
          this.sessions.delete(client.sessionId);
          console.log(
            `[COLLABORATION] Session ${client.sessionId} removed (empty)`,
          );
        }
      }
    }

    this.clients.delete(clientId);
    console.log(`[COLLABORATION] Client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.websocket.readyState === 1) {
      client.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Cleanup inactive sessions and prevent memory leaks
   */
  cleanupSessions() {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours absolute limit
    const maxSessions = 100; // Maximum concurrent sessions

    // Clean up inactive/old sessions
    for (const [sessionId, session] of this.sessions) {
      const inactiveTime = now - session.lastActivity;
      const sessionAge = now - session.createdAt;

      if (
        session.isEmpty() ||
        inactiveTime > maxInactiveTime ||
        sessionAge > maxSessionAge
      ) {
        // Properly cleanup session resources
        for (const [clientId, client] of session.clients) {
          if (client.websocket && client.websocket.readyState === 1) {
            client.websocket.close(1000, "Session cleanup");
          }
        }

        this.sessions.delete(sessionId);
        console.log(
          `[COLLABORATION] Session ${sessionId} cleaned up (inactive: ${inactiveTime}ms, age: ${sessionAge}ms)`,
        );
      }
    }

    // If too many sessions, remove oldest inactive ones
    if (this.sessions.size > maxSessions) {
      const sortedSessions = Array.from(this.sessions.entries()).sort(
        ([, a], [, b]) => a.lastActivity - b.lastActivity,
      );

      const sessionsToRemove = sortedSessions.slice(
        0,
        this.sessions.size - maxSessions,
      );

      for (const [sessionId, session] of sessionsToRemove) {
        // Notify clients before removing
        session.broadcastToAll({
          type: "session-closed",
          data: { reason: "Server capacity limit reached" },
        });

        this.sessions.delete(sessionId);
        console.log(
          `[COLLABORATION] Session ${sessionId} removed (capacity limit)`,
        );
      }
    }

    // Log memory usage
    if (this.sessions.size > 50) {
      console.warn(`[COLLABORATION] High session count: ${this.sessions.size}`);
    }
  }

  /**
   * Get comprehensive server statistics
   */
  getStats() {
    const memoryUsage = process.memoryUsage();
    const errorStats = this.errorRecovery.getErrorStats();

    return {
      server: {
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
        },
        timestamp: new Date().toISOString(),
      },
      collaboration: {
        totalSessions: this.sessions.size,
        totalClients: this.clients.size,
        activeConnections: Array.from(this.clients.values()).filter(
          (client) => client.websocket.readyState === 1,
        ).length,
      },
      errors: errorStats,
      sessions: Array.from(this.sessions.values()).map((session) =>
        session.getStats(),
      ),
      rateLimiting: {
        activeClients: this.rateLimiter.size,
        messagesPerMinuteLimit: this.maxMessagesPerMinute,
      },
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    const stats = this.getStats();
    const isHealthy =
      stats.collaboration.totalSessions < 200 &&
      stats.errors.recentErrors < 50 &&
      parseInt(stats.server.memoryUsage.heapUsed) < 1000; // Less than 1GB

    return {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        sessionCount: {
          status: stats.collaboration.totalSessions < 200 ? "ok" : "warning",
          value: stats.collaboration.totalSessions,
          limit: 200,
        },
        errorRate: {
          status: stats.errors.recentErrors < 50 ? "ok" : "warning",
          value: stats.errors.recentErrors,
          limit: 50,
        },
        memoryUsage: {
          status:
            parseInt(stats.server.memoryUsage.heapUsed) < 1000
              ? "ok"
              : "warning",
          value: stats.server.memoryUsage.heapUsed,
          limit: "1000MB",
        },
      },
      suggestions: this.errorRecovery.getRecoverySuggestions(),
    };
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      console.log("[COLLABORATION] Server stopped");
    }
  }
}

module.exports = {
  CollaborationServer,
  CollaborationSession,
  OperationalTransform,
};
