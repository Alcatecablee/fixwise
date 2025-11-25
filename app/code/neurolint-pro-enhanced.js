#!/usr/bin/env node

/**
 * NeuroLint Pro Enhanced - Premium Debugging Service with Advanced AST Capabilities
 *
 * Implements IMPLEMENTATION_PATTERNS.md with enhanced AST transformations:
 * - Enhanced AST Transformation Engine
 * - Type-Aware Transformations
 * - Next.js App Router Intelligence
 * - Component Relationship Analysis
 * - Performance-Aware Optimizations
 *
 * CRITICAL: Maintains backward compatibility with existing layer system
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Import enhanced AST capabilities
let EnhancedASTEngine,
  TypeAwareTransforms,
  NextJSIntelligence,
  ComponentRelationshipAnalyzer,
  PerformanceOptimizer;

try {
  ({ EnhancedASTEngine } = require("../lib/enhanced-ast-engine"));
  ({ TypeAwareTransforms } = require("../lib/type-aware-transforms"));
  ({ NextJSIntelligence } = require("../lib/nextjs-intelligence"));
  ({
    ComponentRelationshipAnalyzer,
  } = require("../lib/component-relationship-analyzer"));
  ({ PerformanceOptimizer } = require("../lib/performance-optimizer"));
} catch (error) {
  console.warn(
    "[NEUROLINT PRO] Enhanced AST modules not available, falling back to basic mode:",
    error.message,
  );
}

/**
 * Core Architecture Principles (from IMPLEMENTATION_PATTERNS.md)
 * Layers must execute in order (1→2→3→4→5→6) because each builds on the previous
 */
const LAYER_EXECUTION_ORDER = [
  {
    id: 1,
    name: "Configuration",
    description: "Foundation setup",
    useAST: false,
  },
  {
    id: 2,
    name: "Entity Cleanup",
    description: "Preprocessing patterns",
    useAST: false,
  },
  {
    id: 3,
    name: "Components",
    description: "React/TS specific fixes",
    useAST: true,
  },
  {
    id: 4,
    name: "Hydration",
    description: "Runtime safety guards",
    useAST: true,
  },
  {
    id: 5,
    name: "Next.js App Router",
    description: "Next.js specific optimizations",
    useAST: true,
  },
  {
    id: 6,
    name: "Testing & Validation",
    description: "Testing patterns and validation",
    useAST: true,
  },
];

/**
 * Enhanced Layer Dependency Manager with AST awareness
 */
class EnhancedLayerDependencyManager {
  static DEPENDENCIES = {
    1: [], // Configuration has no dependencies
    2: [1], // Entity cleanup depends on config foundation
    3: [1, 2], // Components depend on config + cleanup
    4: [1, 2, 3], // Hydration depends on all previous layers
    5: [1, 2, 3, 4], // Next.js depends on all core layers
    6: [1, 2, 3, 4, 5], // Testing depends on all previous layers
  };

  static LAYER_INFO = {
    1: { name: "Configuration", critical: true, useAST: false },
    2: { name: "Entity Cleanup", critical: false, useAST: false },
    3: { name: "Components", critical: false, useAST: true },
    4: { name: "Hydration", critical: false, useAST: true },
    5: { name: "Next.js App Router", critical: false, useAST: true },
    6: { name: "Testing & Validation", critical: false, useAST: true },
  };

  /**
   * Enhanced layer suggestion with AST-based analysis
   */
  static suggestLayers(code, filename, astEngine = null) {
    const recommended = [];
    const reasons = [];

    // Always recommend config layer for foundation
    recommended.push(1);
    reasons.push("Configuration layer provides essential foundation");

    // Enhanced analysis if AST engine is available
    if (astEngine && EnhancedASTEngine) {
      const parseResult = astEngine.parseCode(code, filename);

      if (parseResult.success) {
        const context = astEngine.semanticContext.get(filename);

        // Smart layer detection based on semantic analysis
        const astRecommendations = this.getASTRecommendations(
          parseResult.ast,
          context,
        );
        recommended.push(...astRecommendations.layers);
        reasons.push(...astRecommendations.reasons);
      } else {
        // Fall back to regex-based analysis
        const regexRecommendations = this.getRegexRecommendations(code);
        recommended.push(...regexRecommendations.layers);
        reasons.push(...regexRecommendations.reasons);
      }
    } else {
      // Original regex-based analysis
      const regexRecommendations = this.getRegexRecommendations(code);
      recommended.push(...regexRecommendations.layers);
      reasons.push(...regexRecommendations.reasons);
    }

    return {
      recommended: [...new Set(recommended)].sort((a, b) => a - b),
      reasons,
    };
  }

  static getASTRecommendations(ast, context) {
    const layers = [];
    const reasons = [];

    // Layer 2: Pattern fixes
    if (
      context.dependencies.has("console.log") ||
      this.hasHTMLEntities(context)
    ) {
      layers.push(2);
      reasons.push("Entity cleanup needed based on AST analysis");
    }

    // Layer 3: Component fixes
    if (context.components.size > 0) {
      layers.push(3);
      reasons.push("React components detected - component fixes recommended");
    }

    // Layer 4: Hydration fixes
    if (
      context.dependencies.has("localStorage") ||
      context.dependencies.has("window")
    ) {
      layers.push(4);
      reasons.push("Browser API usage detected - hydration safety needed");
    }

    // Layer 5: Next.js optimizations
    if (
      context.dependencies.has("next") ||
      this.isNextJSFile(context.filename)
    ) {
      layers.push(5);
      reasons.push(
        "Next.js usage detected - App Router optimizations available",
      );
    }

    // Layer 6: Testing enhancements
    if (context.components.size > 2 || this.hasComplexLogic(context)) {
      layers.push(6);
      reasons.push(
        "Complex component structure - testing enhancements recommended",
      );
    }

    return { layers, reasons };
  }

  static getRegexRecommendations(code) {
    const layers = [];
    const reasons = [];

    // Check for HTML entities or old patterns
    if (/&quot;|&amp;|&lt;|&gt;|console\.log/.test(code)) {
      layers.push(2);
      reasons.push("Entity cleanup needed for HTML entities and old patterns");
    }

    // Check for React components needing fixes
    if (code.includes("map(") && code.includes("<") && !code.includes("key=")) {
      layers.push(3);
      reasons.push("Component fixes needed for missing key props");
    }

    // Check for hydration issues
    if (code.includes("localStorage") && !code.includes("typeof window")) {
      layers.push(4);
      reasons.push("Hydration fixes needed for SSR safety");
    }

    // Check for Next.js patterns
    if (code.includes("next/") || code.includes("'use client'")) {
      layers.push(5);
      reasons.push("Next.js patterns detected");
    }

    return { layers, reasons };
  }

  static hasHTMLEntities(context) {
    // Enhanced check for HTML entities in AST context
    return false; // Placeholder implementation
  }

  static isNextJSFile(filename) {
    const nextJSPatterns = [
      "page.tsx",
      "page.ts",
      "page.jsx",
      "page.js",
      "layout.tsx",
      "layout.ts",
      "layout.jsx",
      "layout.js",
      "route.ts",
      "route.js",
    ];
    const basename = path.basename(filename);
    return nextJSPatterns.includes(basename);
  }

  static hasComplexLogic(context) {
    return context.hooks.size > 3 || context.components.size > 5;
  }

  // Original methods for backward compatibility
  static validateAndCorrectLayers(requestedLayers) {
    const warnings = [];
    const autoAdded = [];
    let correctedLayers = [...requestedLayers];

    // Sort layers in execution order
    correctedLayers.sort((a, b) => a - b);

    // Check dependencies for each requested layer
    for (const layerId of requestedLayers) {
      const dependencies = this.DEPENDENCIES[layerId] || [];
      const missingDeps = dependencies.filter(
        (dep) => !correctedLayers.includes(dep),
      );

      if (missingDeps.length > 0) {
        // Auto-add missing dependencies
        correctedLayers.push(...missingDeps);
        autoAdded.push(...missingDeps);

        warnings.push(
          `Layer ${layerId} (${this.LAYER_INFO[layerId]?.name}) requires ` +
            `${missingDeps.map((dep) => `${dep} (${this.LAYER_INFO[dep]?.name})`).join(", ")}. ` +
            `Auto-added missing dependencies.`,
        );
      }
    }

    // Remove duplicates and sort
    correctedLayers = [...new Set(correctedLayers)].sort((a, b) => a - b);

    return {
      correctedLayers,
      warnings,
      autoAdded,
    };
  }
}

/**
 * Enhanced Transformation Validator with AST support
 */
class EnhancedTransformationValidator {
  static validateTransformation(before, after, layerId, astEngine = null) {
    // Skip validation if no changes were made
    if (before === after) {
      return { shouldRevert: false, reason: "No changes made" };
    }

    // Enhanced validation for AST-enabled layers
    if (astEngine && this.isASTLayer(layerId)) {
      return this.validateASTTransformation(before, after, astEngine);
    }

    // Original validation for regex-based layers
    return this.validateRegexTransformation(before, after);
  }

  static isASTLayer(layerId) {
    return layerId >= 3 && layerId <= 6; // Layers 3-6 use AST
  }

  static validateASTTransformation(before, after, astEngine) {
    // Parse both versions with AST
    const beforeParse = astEngine.parseCode(before, "before.tsx");
    const afterParse = astEngine.parseCode(after, "after.tsx");

    if (!beforeParse.success) {
      return { shouldRevert: false, reason: "Original code has syntax issues" };
    }

    if (!afterParse.success) {
      return {
        shouldRevert: true,
        reason: `AST transformation introduced syntax error: ${afterParse.error}`,
      };
    }

    // Additional AST-based validation could be added here
    return { shouldRevert: false };
  }

  static validateRegexTransformation(before, after) {
    // Original validation logic
    const syntaxCheck = this.validateSyntax(after);
    if (!syntaxCheck.valid) {
      return {
        shouldRevert: true,
        reason: `Syntax error: ${syntaxCheck.error}`,
      };
    }

    const corruptionCheck = this.detectCorruption(before, after);
    if (corruptionCheck.detected) {
      return {
        shouldRevert: true,
        reason: `Corruption detected: ${corruptionCheck.pattern}`,
      };
    }

    const logicalCheck = this.validateLogicalIntegrity(before, after);
    if (!logicalCheck.valid) {
      return {
        shouldRevert: true,
        reason: `Logical issue: ${logicalCheck.reason}`,
      };
    }

    return { shouldRevert: false };
  }

  // Original validation methods
  static validateSyntax(code) {
    try {
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;

      if (openBraces !== closeBraces) {
        return { valid: false, error: "Mismatched braces" };
      }

      if (openParens !== closeParens) {
        return { valid: false, error: "Mismatched parentheses" };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown syntax error",
      };
    }
  }

  static detectCorruption(before, after) {
    const corruptionPatterns = [
      {
        name: "Double function calls",
        regex: /onClick=\{[^}]*\([^)]*\)\s*=>\s*\(\)\s*=>/g,
      },
      {
        name: "Malformed event handlers",
        regex: /onClick=\{[^}]*\)\([^)]*\)$/g,
      },
      {
        name: "Invalid JSX attributes",
        regex: /\w+=\{[^}]*\)[^}]*\}/g,
      },
      {
        name: "Broken import statements",
        regex: /import\s*{\s*\n\s*import\s*{/g,
      },
    ];

    for (const pattern of corruptionPatterns) {
      if (pattern.regex.test(after) && !pattern.regex.test(before)) {
        return {
          detected: true,
          pattern: pattern.name,
        };
      }
    }

    return { detected: false };
  }

  static validateLogicalIntegrity(before, after) {
    const beforeImports = this.extractImports(before);
    const afterImports = this.extractImports(after);

    const removedImports = beforeImports.filter(
      (imp) => !afterImports.includes(imp),
    );
    const criticalImports = ["React", "useState", "useEffect"];

    const removedCritical = removedImports.filter((imp) =>
      criticalImports.some((critical) => imp.includes(critical)),
    );

    if (removedCritical.length > 0) {
      return {
        valid: false,
        reason: `Critical imports removed: ${removedCritical.join(", ")}`,
      };
    }

    return { valid: true };
  }

  static extractImports(code) {
    const importRegex = /import\s+.*?\s+from\s+['"][^'"]+['"]/g;
    return code.match(importRegex) || [];
  }
}

/**
 * Enhanced Layer Execution with AST capabilities
 */
async function executeEnhancedLayers(code, enabledLayers, options = {}) {
  let current = code;
  const results = [];
  const states = [code];
  const filename = options.filename || "unknown.tsx";

  // Initialize enhanced AST engines if available
  let astEngine = null;
  let typeAwareTransforms = null;
  let nextJSIntelligence = null;
  let relationshipAnalyzer = null;
  let performanceOptimizer = null;

  if (EnhancedASTEngine) {
    try {
      astEngine = new EnhancedASTEngine();

      if (TypeAwareTransforms) {
        typeAwareTransforms = new TypeAwareTransforms(astEngine);
      }

      if (NextJSIntelligence) {
        nextJSIntelligence = new NextJSIntelligence(astEngine);
      }

      if (ComponentRelationshipAnalyzer) {
        relationshipAnalyzer = new ComponentRelationshipAnalyzer(astEngine);
      }

      if (PerformanceOptimizer) {
        performanceOptimizer = new PerformanceOptimizer(
          astEngine,
          relationshipAnalyzer,
        );
      }
    } catch (error) {
      console.warn(
        "[NEUROLINT PRO] Failed to initialize AST engines:",
        error.message,
      );
    }
  }

  const totalLayers = enabledLayers.length;
  let completed = 0;

  for (const layerId of enabledLayers) {
    const previous = current;
    const startTime = performance.now();

    if (options.verbose) {
      console.log(
        `\n🔧 [Layer ${layerId}] ${LAYER_EXECUTION_ORDER.find((l) => l.id === layerId)?.name || "Unknown"}`,
      );
    }

    try {
      let transformed = current;
      const layerInfo = LAYER_EXECUTION_ORDER.find((l) => l.id === layerId);

      // Execute layer with appropriate method (AST or regex)
      if (layerInfo?.useAST && astEngine) {
        transformed = await executeASTLayer(layerId, current, filename, {
          astEngine,
          typeAwareTransforms,
          nextJSIntelligence,
          relationshipAnalyzer,
          performanceOptimizer,
          options,
        });
      } else {
        transformed = await executeRegexLayer(layerId, current, options);
      }

      // Validate transformation
      const validation = EnhancedTransformationValidator.validateTransformation(
        previous,
        transformed,
        layerId,
        astEngine,
      );

      if (validation.shouldRevert) {
        console.warn(`⚠️  [Layer ${layerId}] Reverting: ${validation.reason}`);
        current = previous; // Rollback

        results.push({
          layerId,
          success: false,
          code: previous,
          executionTime: performance.now() - startTime,
          changeCount: 0,
          revertReason: validation.reason,
        });
      } else {
        current = transformed; // Accept changes
        states.push(current);

        const changeCount = calculateChanges(previous, transformed);
        const improvements = detectImprovements(previous, transformed, layerId);

        results.push({
          layerId,
          success: true,
          code: current,
          executionTime: performance.now() - startTime,
          changeCount,
          improvements,
        });

        if (options.verbose && changeCount > 0) {
          console.log(`✅ [Layer ${layerId}] Applied ${changeCount} changes`);
          improvements.forEach((improvement) => {
            console.log(`   📝 ${improvement}`);
          });
        }
      }
    } catch (error) {
      console.error(`❌ [Layer ${layerId}] Error: ${error.message}`);

      results.push({
        layerId,
        success: false,
        code: previous,
        executionTime: performance.now() - startTime,
        changeCount: 0,
        error: error.message,
      });

      current = previous; // Keep safe state
    }

    completed++;
    if (options.onProgress) {
      options.onProgress({
        completed,
        total: totalLayers,
        percentage: Math.round((completed / totalLayers) * 100),
        currentLayer: layerId,
      });
    }
  }

  // Generate comprehensive analysis if AST engines are available
  let analysis = null;
  if (astEngine && relationshipAnalyzer && performanceOptimizer) {
    try {
      const parseResult = astEngine.parseCode(current, filename);
      if (parseResult.success) {
        const context = astEngine.semanticContext.get(filename);
        const relationshipAnalysis =
          relationshipAnalyzer.analyzeComponentRelationships(
            parseResult.ast,
            context,
          );
        const performanceAnalysis = performanceOptimizer.optimizePerformance(
          parseResult.ast,
          context,
        );

        analysis = {
          components: relationshipAnalysis.components,
          dataFlow: relationshipAnalysis.dataFlow,
          optimizations: relationshipAnalysis.optimizations.concat(
            performanceAnalysis.optimizations,
          ),
          performanceMetrics: performanceAnalysis.metrics,
          recommendedLayers: EnhancedLayerDependencyManager.suggestLayers(
            current,
            filename,
            astEngine,
          ).recommended,
          detectedIssues: generateIssueReport(results),
          confidence: calculateConfidence(results),
          estimatedImpact: estimateImpact(results),
        };
      }
    } catch (error) {
      console.warn(
        "[NEUROLINT PRO] Analysis generation failed:",
        error.message,
      );
    }
  }

  return {
    success: results.every((r) => r.success),
    dryRun: options.dryRun || false,
    originalCode: code,
    transformed: current,
    layers: results,
    states,
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    successfulLayers: results.filter((r) => r.success).length,
    analysis,
  };
}

/**
 * Execute AST-based layer transformation
 */
async function executeASTLayer(layerId, code, filename, engines) {
  const {
    astEngine,
    typeAwareTransforms,
    nextJSIntelligence,
    relationshipAnalyzer,
    performanceOptimizer,
    options,
  } = engines;

  const parseResult = astEngine.parseCode(code, filename);

  if (!parseResult.success) {
    // Fall back to regex-based transformation
    console.warn(
      `[Layer ${layerId}] AST parsing failed, falling back to regex`,
    );
    return await executeRegexLayer(layerId, code, options);
  }

  const context = astEngine.semanticContext.get(filename);
  let transformations = [];

  // Apply layer-specific AST transformations
  switch (layerId) {
    case 3: // Components layer
      if (typeAwareTransforms) {
        transformations.push(
          ...typeAwareTransforms.analyzeComponentProps(
            parseResult.ast,
            context,
          ),
        );
        transformations.push(
          ...typeAwareTransforms.enhanceComponentPropsWithLibraryTypes(
            parseResult.ast,
            context,
          ),
        );
      }
      transformations.push(
        ...astEngine.transformMissingKeys(parseResult.ast, context),
      );
      transformations.push(
        ...astEngine.transformImports(parseResult.ast, context),
      );
      break;

    case 4: // Hydration layer
      if (nextJSIntelligence) {
        transformations.push(
          ...nextJSIntelligence.fixSSRHydrationIssues(parseResult.ast, context),
        );
        transformations.push(
          ...nextJSIntelligence.analyzeClientDirectiveNeeds(
            parseResult.ast,
            context,
          ),
        );
      }
      break;

    case 5: // Next.js layer
      if (nextJSIntelligence) {
        transformations.push(
          ...nextJSIntelligence.transformNextJsPatterns(
            parseResult.ast,
            context,
          ),
        );
        transformations.push(
          ...nextJSIntelligence.optimizeServerComponents(
            parseResult.ast,
            context,
          ),
        );
        transformations.push(
          ...nextJSIntelligence.optimizeMetadata(parseResult.ast, context),
        );
      }
      break;

    case 6: // Testing & Validation layer
      if (typeAwareTransforms) {
        transformations.push(
          ...typeAwareTransforms.transformWithTypeAwareness(
            parseResult.ast,
            context,
          ),
        );
      }
      if (performanceOptimizer) {
        const perfOptimizations = performanceOptimizer.optimizePerformance(
          parseResult.ast,
          context,
        );
        transformations.push(...perfOptimizations.optimizations);
      }
      break;
  }

  // Apply transformations to AST
  transformations.forEach((transformation) => {
    if (transformation.action && typeof transformation.action === "function") {
      try {
        transformation.action();
      } catch (error) {
        console.warn(
          `[Layer ${layerId}] Transformation failed:`,
          error.message,
        );
      }
    }
  });

  // Generate code from modified AST
  const codeResult = astEngine.generateCode(parseResult.ast, code);

  if (!codeResult.success) {
    console.warn(
      `[Layer ${layerId}] Code generation failed, falling back to original`,
    );
    return code;
  }

  return codeResult.code;
}

/**
 * Execute regex-based layer transformation (original method)
 * FIXED: Now properly delegates to standard engine transformations
 */
async function executeRegexLayer(layerId, code, options) {
  // Import and use the standard engine's transformation functions
  try {
    const standardEngine = require("../lib/original-neurolint.js");

    // Call the standard engine directly for this layer
    console.log(
      `[ENHANCED ENGINE] Delegating Layer ${layerId} to standard engine`,
    );

    // Use the standard engine's applyLayerTransformations function
    if (typeof standardEngine.applyLayerTransformations === "function") {
      return standardEngine.applyLayerTransformations(layerId, code, options);
    }

    // If the function doesn't exist, fall back to the full standard engine
    const result = await standardEngine(
      code,
      options.filename || "unknown.tsx",
      true,
      [layerId],
      {
        ...options,
        isDemoMode: true,
        singleFile: true,
      },
    );

    return result.transformed || code;
  } catch (error) {
    console.warn(
      `[ENHANCED ENGINE] Standard engine fallback failed for Layer ${layerId}:`,
      error.message,
    );

    // Last resort: return original code to prevent crashes
    return code;
  }
}

// Helper functions
function calculateChanges(before, after) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  let changes = Math.abs(beforeLines.length - afterLines.length);

  const minLength = Math.min(beforeLines.length, afterLines.length);
  for (let i = 0; i < minLength; i++) {
    if (beforeLines[i] !== afterLines[i]) changes++;
  }

  return changes;
}

function detectImprovements(before, after, layerId) {
  const improvements = [];
  const layerNames = {
    1: "Configuration modernized",
    2: "Patterns cleaned up",
    3: "Components enhanced",
    4: "Hydration safety added",
    5: "Next.js optimized",
    6: "Testing improved",
  };

  if (before !== after) {
    improvements.push(layerNames[layerId] || `Layer ${layerId} improvements`);
  }

  return improvements;
}

function generateIssueReport(results) {
  const issues = [];

  results.forEach((result) => {
    if (!result.success) {
      issues.push({
        type: "execution-error",
        severity: "high",
        description: `Layer ${result.layerId} failed: ${result.error || result.revertReason}`,
        fixedByLayer: result.layerId,
        pattern: "Layer execution failure",
      });
    }
  });

  return issues;
}

function calculateConfidence(results) {
  const successRate = results.filter((r) => r.success).length / results.length;
  return Math.max(0.5, successRate); // Minimum 50% confidence
}

function estimateImpact(results) {
  const totalChanges = results.reduce(
    (sum, r) => sum + (r.changeCount || 0),
    0,
  );
  const successfulLayers = results.filter((r) => r.success).length;

  let level = "low";
  if (totalChanges > 20 || successfulLayers > 4) {
    level = "high";
  } else if (totalChanges > 5 || successfulLayers > 2) {
    level = "medium";
  }

  return {
    level,
    description: `${totalChanges} total changes across ${successfulLayers} layers`,
    estimatedFixTime: `${Math.max(30, totalChanges * 5)} seconds`,
  };
}

/**
 * Main NeuroLint Pro Enhanced Entry Point
 */
async function NeuroLintProEnhanced(
  code,
  filePath,
  dryRun = true,
  requestedLayers = null,
  options = {},
) {
  try {
    const filename = filePath || "unknown.tsx";

    console.log(
      `[NEUROLINT PRO ENHANCED] Starting analysis${dryRun ? " (dry-run)" : ""}...`,
    );

    // Initialize AST engine for layer suggestion if available
    let astEngine = null;
    if (EnhancedASTEngine) {
      try {
        astEngine = new EnhancedASTEngine();
      } catch (error) {
        console.warn(
          "[NEUROLINT PRO] AST engine initialization failed:",
          error.message,
        );
      }
    }

    // Determine layers to execute
    let layersToExecute;
    if (requestedLayers && Array.isArray(requestedLayers)) {
      const validation =
        EnhancedLayerDependencyManager.validateAndCorrectLayers(
          requestedLayers,
        );
      layersToExecute = validation.correctedLayers;

      if (validation.warnings.length > 0 && options.verbose) {
        validation.warnings.forEach((warning) =>
          console.warn(`⚠️  ${warning}`),
        );
      }
    } else {
      // Auto-suggest layers based on code analysis
      const suggestion = EnhancedLayerDependencyManager.suggestLayers(
        code,
        filename,
        astEngine,
      );
      layersToExecute = suggestion.recommended;

      if (options.verbose) {
        console.log(
          "🎯 Recommended layers:",
          suggestion.recommended.join(", "),
        );
        suggestion.reasons.forEach((reason) => console.log(`   📋 ${reason}`));
      }
    }

    // Execute layers with enhanced capabilities
    const result = await executeEnhancedLayers(code, layersToExecute, {
      ...options,
      filename,
      dryRun,
      verbose: options.verbose || false,
      onProgress: options.onProgress,
    });

    console.log(
      `[NEUROLINT PRO ENHANCED] Analysis complete in ${result.totalExecutionTime.toFixed(0)}ms`,
    );

    return result;
  } catch (error) {
    console.error("[NEUROLINT PRO ENHANCED] Critical error:", error);
    return {
      success: false,
      error: error.message,
      originalCode: code,
      transformed: code,
      layers: [],
      states: [code],
      totalExecutionTime: 0,
      successfulLayers: 0,
    };
  }
}

// Export the enhanced engine
module.exports = NeuroLintProEnhanced;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
NeuroLint Pro Enhanced - Premium React/Next.js Code Fixing Service

Usage:
  node neurolint-pro-enhanced.js <file> [options]

Options:
  --dry-run          Preview changes without applying them (default)
  --apply            Actually apply the fixes
  --layers=1,2,3,4   Specify which layers to run
  --verbose          Show detailed output
  
Examples:
  node neurolint-pro-enhanced.js src/components/Button.tsx --dry-run --verbose
  node neurolint-pro-enhanced.js src/pages/index.tsx --apply --layers=3,4,5
    `);
    process.exit(0);
  }

  const filePath = args[0];
  const dryRun = !args.includes("--apply");
  const verbose = args.includes("--verbose");

  let requestedLayers = null;
  const layersArg = args.find((arg) => arg.startsWith("--layers="));
  if (layersArg) {
    requestedLayers = layersArg.split("=")[1].split(",").map(Number);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(filePath, "utf8");

  NeuroLintProEnhanced(code, filePath, dryRun, requestedLayers, { verbose })
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Analysis completed successfully`);
        console.log(
          `📊 ${result.successfulLayers}/${result.layers.length} layers succeeded`,
        );

        if (!dryRun && result.transformed !== result.originalCode) {
          fs.writeFileSync(filePath, result.transformed);
          console.log(`💾 File updated: ${filePath}`);
        }
      } else {
        console.log(`\n❌ Analysis failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`\n💥 Fatal error: ${error.message}`);
      process.exit(1);
    });
}
