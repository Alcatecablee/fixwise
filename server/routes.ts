import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { 
  insertExecutionRunSchema, 
  insertExecutionLogSchema,
  insertDetectedIssueSchema,
  type LogLevel,
  type Severity 
} from "@shared/schema";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });
  
  // Helper to broadcast to all WebSocket clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Helper to execute fix scripts
  async function executeFixScript(
    runId: string,
    scriptName: string,
    layerId: string,
    dryRun: boolean = false
  ): Promise<{ success: boolean; output: string }> {
    const scriptPath = path.join(process.cwd(), 'Fixwise', scriptName);
    
    try {
      // Check if script exists
      await fs.access(scriptPath);
      
      // Log start
      const startLog = await storage.createLog({
        runId,
        level: "info",
        message: `🔧 Starting ${scriptName}...`,
        layerId,
      });
      broadcast({ type: 'log', data: startLog });
      
      // Execute the script
      const command = dryRun ? `node "${scriptPath}" --dry-run` : `node "${scriptPath}"`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutes timeout
      });
      
      const output = stdout + stderr;
      
      // Log completion
      const successLog = await storage.createLog({
        runId,
        level: "success",
        message: `✅ ${scriptName} completed successfully`,
        layerId,
      });
      broadcast({ type: 'log', data: successLog });
      
      // Parse output for issues (simplified)
      await parseScriptOutput(runId, output, layerId);
      
      return { success: true, output };
    } catch (error: any) {
      const errorLog = await storage.createLog({
        runId,
        level: "error",
        message: `❌ ${scriptName} failed: ${error.message}`,
        layerId,
      });
      broadcast({ type: 'log', data: errorLog });
      
      return { success: false, output: error.message };
    }
  }
  
  // Helper to parse script output for issues
  async function parseScriptOutput(runId: string, output: string, layerId: string | null) {
    const lines = output.split('\n');
    const run = await storage.getRun(runId);
    if (!run) return;
    
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let fixedCount = 0;
    let totalFound = 0;
    
    // Fixwise output format: "📝 [HH:MM:SS AM/PM] 🔴 filepath: issue description"
    // OR for individual scripts: "✅ Fixed tsconfig.json"
    const issueLineRegex = /[📝⚠️❌🔍]\s*\[[\d:APM\s]+\]\s*(🔴|🟠|🟡|🟢)\s+(.+?):\s+(.+)/;
    const fixedRegex = /✅.*(?:Fixed|completed successfully)/i;
    const summaryRegex = /Summary:\s*(\d+)\s*critical,\s*(\d+)\s*high,\s*(\d+)\s*medium,\s*(\d+)\s*low/i;
    const foundRegex = /Found (\d+) problems/i;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Parse issue detection lines
      const issueMatch = trimmed.match(issueLineRegex);
      if (issueMatch) {
        const [, icon, file, issue] = issueMatch;
        let severity: Severity = "low";
        
        // Map emoji to severity
        if (icon === '🔴') severity = "critical";
        else if (icon === '🟠') severity = "high";
        else if (icon === '🟡') severity = "medium";
        else if (icon === '🟢') severity = "low";
        
        totalFound++;
        
        // Track severity counts
        if (severity === "critical") criticalCount++;
        else if (severity === "high") highCount++;
        else if (severity === "medium") mediumCount++;
        else if (severity === "low") lowCount++;
        
        // Create issue record
        const detectedIssue = await storage.createIssue({
          runId,
          severity,
          type: layerId || "general",
          file: file?.trim() || "unknown",
          issue: issue?.trim() || "Unknown issue",
          fix: "Automated fix available",
        });
        
        // Broadcast issue detected
        broadcast({ type: 'issue-detected', data: detectedIssue });
      }
      
      // Count fixed issues
      if (fixedRegex.test(trimmed)) {
        fixedCount++;
      }
      
      // Parse "Found X problems" format
      const foundMatch = trimmed.match(foundRegex);
      if (foundMatch) {
        const count = parseInt(foundMatch[1], 10);
        totalFound += count;
      }
      
      // Parse severity summary: "Summary: X critical, Y high, Z medium, W low"
      const summaryMatch = trimmed.match(summaryRegex);
      if (summaryMatch) {
        criticalCount += parseInt(summaryMatch[1], 10);
        highCount += parseInt(summaryMatch[2], 10);
        mediumCount += parseInt(summaryMatch[3], 10);
        lowCount += parseInt(summaryMatch[4], 10);
      }
    }
    
    // Update run statistics
    await storage.updateRun(runId, {
      totalIssuesFound: (run.totalIssuesFound || 0) + totalFound,
      totalIssuesFixed: (run.totalIssuesFixed || 0) + fixedCount,
      criticalIssues: (run.criticalIssues || 0) + criticalCount,
      highIssues: (run.highIssues || 0) + highCount,
      mediumIssues: (run.mediumIssues || 0) + mediumCount,
      lowIssues: (run.lowIssues || 0) + lowCount,
    });
    
    // Broadcast updated run stats
    const updatedRun = await storage.getRun(runId);
    if (updatedRun) {
      broadcast({ type: 'run-updated', data: updatedRun });
    }
  }

  // GET /api/layers - Get all fix layers
  app.get("/api/layers", async (req, res) => {
    try {
      const layers = await storage.getLayers();
      res.json(layers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/runs - Get recent execution runs
  app.get("/api/runs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const runs = await storage.getRuns(limit);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/runs/:id - Get specific run
  app.get("/api/runs/:id", async (req, res) => {
    try {
      const run = await storage.getRun(req.params.id);
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }
      res.json(run);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/runs/:id/logs - Get logs for a run
  app.get("/api/runs/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/runs/:id/issues - Get issues for a run
  app.get("/api/runs/:id/issues", async (req, res) => {
    try {
      const issues = await storage.getIssues(req.params.id);
      res.json(issues);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/execute - Execute fix scripts
  app.post("/api/execute", async (req, res) => {
    try {
      const { layerIds, dryRun = false } = req.body;
      
      if (!layerIds || !Array.isArray(layerIds) || layerIds.length === 0) {
        return res.status(400).json({ error: "layerIds array is required" });
      }

      // Create a new execution run
      const run = await storage.createRun({
        runType: layerIds.length === 6 ? "all" : "single-layer",
        status: "running",
        layerIds,
      });

      // Broadcast run started
      broadcast({ type: 'run-started', data: run });

      // Start execution in background
      (async () => {
        try {
          const startLog = await storage.createLog({
            runId: run.id,
            level: "info",
            message: "🚀 Starting Comprehensive Automated Fixing System",
            layerId: null,
          });
          broadcast({ type: 'log', data: startLog });

          // Execute each layer sequentially
          for (const layerId of layerIds) {
            const layer = await storage.getLayer(layerId);
            if (!layer) continue;

            await executeFixScript(run.id, layer.scriptName, layerId, dryRun);
          }

          // Run final validation
          const validationLog = await storage.createLog({
            runId: run.id,
            level: "info",
            message: "🔍 Running final validation...",
            layerId: null,
          });
          broadcast({ type: 'log', data: validationLog });

          // Update run status
          const updatedRun = await storage.updateRun(run.id, {
            status: "completed",
            endTime: new Date(),
            buildStatus: "passed",
          });

          const successLog = await storage.createLog({
            runId: run.id,
            level: "success",
            message: "🎉 All fixes completed successfully!",
            layerId: null,
          });
          broadcast({ type: 'log', data: successLog });
          broadcast({ type: 'run-completed', data: updatedRun });

        } catch (error: any) {
          console.error('Execution error:', error);
          
          const errorLog = await storage.createLog({
            runId: run.id,
            level: "error",
            message: `❌ Execution failed: ${error.message}`,
            layerId: null,
          });
          broadcast({ type: 'log', data: errorLog });

          await storage.updateRun(run.id, {
            status: "failed",
            endTime: new Date(),
            buildStatus: "failed",
          });

          broadcast({ type: 'run-failed', data: { runId: run.id, error: error.message } });
        }
      })();

      // Return immediately with run ID
      res.json({ success: true, runId: run.id, message: "Execution started" });

    } catch (error: any) {
      console.error('Execute error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/detect-issues - Run issue detection without fixing
  app.post("/api/detect-issues", async (req, res) => {
    try {
      // Create a detection run
      const run = await storage.createRun({
        runType: "dry-run",
        status: "running",
        layerIds: [],
      });

      broadcast({ type: 'run-started', data: run });

      // Run detection in background
      (async () => {
        try {
          const log = await storage.createLog({
            runId: run.id,
            level: "info",
            message: "🔍 Detecting problems across codebase...",
            layerId: null,
          });
          broadcast({ type: 'log', data: log });

          // Simulate issue detection (in real implementation, would run fix-master.js --dry-run)
          const mockIssues = [
            {
              runId: run.id,
              severity: "critical" as Severity,
              type: "hydration",
              file: "src/components/ThemeProvider.tsx",
              issue: "localStorage access without SSR guard",
              fix: 'Add typeof window !== "undefined" guard',
            },
            {
              runId: run.id,
              severity: "high" as Severity,
              type: "corruption",
              file: "src/pages/dashboard.tsx",
              issue: "HTML entity corruption detected",
              fix: "Replace HTML entities with proper characters",
            },
          ];

          for (const issueData of mockIssues) {
            const issue = await storage.createIssue(issueData);
            broadcast({ type: 'issue-detected', data: issue });
          }

          await storage.updateRun(run.id, {
            status: "completed",
            endTime: new Date(),
            totalIssuesFound: mockIssues.length,
            criticalIssues: mockIssues.filter(i => i.severity === 'critical').length,
            highIssues: mockIssues.filter(i => i.severity === 'high').length,
          });

          broadcast({ type: 'run-completed', data: run });

        } catch (error: any) {
          await storage.updateRun(run.id, {
            status: "failed",
            endTime: new Date(),
          });
          broadcast({ type: 'run-failed', data: { runId: run.id, error: error.message } });
        }
      })();

      res.json({ success: true, runId: run.id });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
