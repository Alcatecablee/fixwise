import { 
  type FixLayer, 
  type InsertFixLayer,
  type ExecutionRun,
  type InsertExecutionRun,
  type ExecutionLog,
  type InsertExecutionLog,
  type DetectedIssue,
  type InsertDetectedIssue
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Fix Layers
  getLayers(): Promise<FixLayer[]>;
  getLayer(id: string): Promise<FixLayer | undefined>;
  createLayer(layer: InsertFixLayer): Promise<FixLayer>;
  
  // Execution Runs
  getRuns(limit?: number): Promise<ExecutionRun[]>;
  getRun(id: string): Promise<ExecutionRun | undefined>;
  createRun(run: InsertExecutionRun): Promise<ExecutionRun>;
  updateRun(id: string, updates: Partial<ExecutionRun>): Promise<ExecutionRun | undefined>;
  
  // Execution Logs
  getLogs(runId: string): Promise<ExecutionLog[]>;
  createLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  
  // Detected Issues
  getIssues(runId: string): Promise<DetectedIssue[]>;
  createIssue(issue: InsertDetectedIssue): Promise<DetectedIssue>;
  updateIssue(id: string, updates: Partial<DetectedIssue>): Promise<DetectedIssue | undefined>;
}

export class MemStorage implements IStorage {
  private layers: Map<string, FixLayer>;
  private runs: Map<string, ExecutionRun>;
  private logs: Map<string, ExecutionLog>;
  private issues: Map<string, DetectedIssue>;

  constructor() {
    this.layers = new Map();
    this.runs = new Map();
    this.logs = new Map();
    this.issues = new Map();
    
    // Initialize with default layers
    this.initializeLayers();
  }

  private initializeLayers() {
    const defaultLayers: InsertFixLayer[] = [
      {
        name: "Configuration Fixes",
        description: "TypeScript, Next.js, and package.json optimization",
        scriptName: "fix-layer-1-config.js",
        layerNumber: 1,
      },
      {
        name: "Bulk Pattern Fixes",
        description: "HTML entities, imports, React patterns, TypeScript issues",
        scriptName: "fix-layer-2-patterns.js",
        layerNumber: 2,
      },
      {
        name: "Component-Specific Fixes",
        description: "Button variants, form components, icon sizing, key props",
        scriptName: "fix-layer-3-components.js",
        layerNumber: 3,
      },
      {
        name: "Hydration and SSR Fixes",
        description: "SSR guards, theme providers, localStorage protection",
        scriptName: "fix-layer-4-hydration.js",
        layerNumber: 4,
      },
      {
        name: "Next.js App Router Fixes",
        description: "App Router specific patterns and optimizations",
        scriptName: "fix-layer-5-nextjs.js",
        layerNumber: 5,
      },
      {
        name: "Testing and Validation",
        description: "Test setup, validation, and quality checks",
        scriptName: "fix-layer-6-testing.js",
        layerNumber: 6,
      },
    ];

    defaultLayers.forEach((layer) => {
      const id = `layer-${layer.layerNumber}`;
      this.layers.set(id, { ...layer, id });
    });
  }

  // Fix Layers
  async getLayers(): Promise<FixLayer[]> {
    return Array.from(this.layers.values()).sort((a, b) => a.layerNumber - b.layerNumber);
  }

  async getLayer(id: string): Promise<FixLayer | undefined> {
    return this.layers.get(id);
  }

  async createLayer(insertLayer: InsertFixLayer): Promise<FixLayer> {
    const id = randomUUID();
    const layer: FixLayer = { ...insertLayer, id };
    this.layers.set(id, layer);
    return layer;
  }

  // Execution Runs
  async getRuns(limit?: number): Promise<ExecutionRun[]> {
    const runs = Array.from(this.runs.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return limit ? runs.slice(0, limit) : runs;
  }

  async getRun(id: string): Promise<ExecutionRun | undefined> {
    return this.runs.get(id);
  }

  async createRun(insertRun: InsertExecutionRun): Promise<ExecutionRun> {
    const id = randomUUID();
    const run: ExecutionRun = {
      ...insertRun,
      id,
      startTime: new Date(),
      endTime: null,
      totalIssuesFound: 0,
      totalIssuesFixed: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      buildStatus: null,
    };
    this.runs.set(id, run);
    return run;
  }

  async updateRun(id: string, updates: Partial<ExecutionRun>): Promise<ExecutionRun | undefined> {
    const run = this.runs.get(id);
    if (!run) return undefined;
    
    const updatedRun = { ...run, ...updates };
    this.runs.set(id, updatedRun);
    return updatedRun;
  }

  // Execution Logs
  async getLogs(runId: string): Promise<ExecutionLog[]> {
    return Array.from(this.logs.values())
      .filter((log) => log.runId === runId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createLog(insertLog: InsertExecutionLog): Promise<ExecutionLog> {
    const id = randomUUID();
    const log: ExecutionLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.logs.set(id, log);
    return log;
  }

  // Detected Issues
  async getIssues(runId: string): Promise<DetectedIssue[]> {
    return Array.from(this.issues.values())
      .filter((issue) => issue.runId === runId);
  }

  async createIssue(insertIssue: InsertDetectedIssue): Promise<DetectedIssue> {
    const id = randomUUID();
    const issue: DetectedIssue = {
      ...insertIssue,
      id,
      fixed: 0,
    };
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssue(id: string, updates: Partial<DetectedIssue>): Promise<DetectedIssue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { ...issue, ...updates };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }
}

export const storage = new MemStorage();
