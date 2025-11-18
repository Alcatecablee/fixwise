import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fixLayers = pgTable("fix_layers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  scriptName: text("script_name").notNull(),
  layerNumber: integer("layer_number").notNull(),
});

export const executionRuns = pgTable("execution_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runType: text("run_type").notNull(), // 'all', 'single-layer', 'dry-run'
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  layerIds: text("layer_ids").array(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalIssuesFound: integer("total_issues_found").default(0),
  totalIssuesFixed: integer("total_issues_fixed").default(0),
  criticalIssues: integer("critical_issues").default(0),
  highIssues: integer("high_issues").default(0),
  mediumIssues: integer("medium_issues").default(0),
  lowIssues: integer("low_issues").default(0),
  buildStatus: text("build_status"), // 'passed', 'failed', 'pending'
});

export const executionLogs = pgTable("execution_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(), // 'info', 'success', 'warning', 'error', 'debug'
  message: text("message").notNull(),
  layerId: varchar("layer_id"),
});

export const detectedIssues = pgTable("detected_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull(),
  severity: text("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  type: text("type").notNull(), // 'config', 'corruption', 'react', 'hydration', etc.
  file: text("file").notNull(),
  issue: text("issue").notNull(),
  fix: text("fix").notNull(),
  fixed: integer("fixed").default(0), // 0 or 1 (boolean)
});

// Insert schemas
export const insertFixLayerSchema = createInsertSchema(fixLayers).omit({
  id: true,
});

export const insertExecutionRunSchema = createInsertSchema(executionRuns).omit({
  id: true,
  startTime: true,
});

export const insertExecutionLogSchema = createInsertSchema(executionLogs).omit({
  id: true,
  timestamp: true,
});

export const insertDetectedIssueSchema = createInsertSchema(detectedIssues).omit({
  id: true,
});

// Types
export type FixLayer = typeof fixLayers.$inferSelect;
export type InsertFixLayer = z.infer<typeof insertFixLayerSchema>;

export type ExecutionRun = typeof executionRuns.$inferSelect;
export type InsertExecutionRun = z.infer<typeof insertExecutionRunSchema>;

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;

export type DetectedIssue = typeof detectedIssues.$inferSelect;
export type InsertDetectedIssue = z.infer<typeof insertDetectedIssueSchema>;

// Severity type for frontend
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
export type RunStatus = 'running' | 'completed' | 'failed' | 'pending';
export type BuildStatus = 'passed' | 'failed' | 'pending' | null;
