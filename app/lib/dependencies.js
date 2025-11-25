/**
 * Layer Dependency Management
 * Validates and manages layer execution dependencies
 */

/**
 * Layer dependency system ensures proper execution order
 * Validates that required layers are included when others are selected
 */
class LayerDependencyManager {
  
  static DEPENDENCIES = {
    1: [], // Configuration has no dependencies
    2: [1], // Entity cleanup depends on config foundation
    3: [1, 2], // Components depend on config + cleanup
    4: [1, 2, 3], // Hydration depends on all previous layers
    5: [1, 2, 3, 4], // Next.js depends on all previous layers
    6: [1, 2, 3, 4, 5] // Testing depends on all previous layers
  };
  
  static LAYER_INFO = {
    1: { 
      name: 'Configuration', 
      critical: true,
      description: 'Foundation setup and config modernization',
      estimatedTime: 500 // ms
    },
    2: { 
      name: 'Entity Cleanup', 
      critical: false,
      description: 'Pattern cleanup and preprocessing',
      estimatedTime: 800
    },
    3: { 
      name: 'Components', 
      critical: false,
      description: 'React component fixes and improvements',
      estimatedTime: 1200
    },
    4: { 
      name: 'Hydration', 
      critical: false,
      description: 'SSR safety and hydration fixes',
      estimatedTime: 900
    },
    5: { 
      name: 'Next.js', 
      critical: false,
      description: 'Next.js App Router compatibility',
      estimatedTime: 1000
    },
    6: { 
      name: 'Testing', 
      critical: false,
      description: 'Validation and testing improvements',
      estimatedTime: 600
    }
  };
  
  /**
   * Validates and potentially auto-corrects layer selection
   */
  static validateAndCorrectLayers(requestedLayers) {
    const warnings = [];
    const autoAdded = [];
    let correctedLayers = [...requestedLayers];
    
    // Remove invalid layers
    correctedLayers = correctedLayers.filter(layerId => {
      if (!this.LAYER_INFO[layerId]) {
        warnings.push(`Invalid layer ID: ${layerId}. Skipping.`);
        return false;
      }
      return true;
    });
    
    // Sort layers in execution order
    correctedLayers.sort((a, b) => a - b);
    
    // Check dependencies for each requested layer
    for (const layerId of requestedLayers) {
      const dependencies = this.DEPENDENCIES[layerId] || [];
      const missingDeps = dependencies.filter(dep => !correctedLayers.includes(dep));
      
      if (missingDeps.length > 0) {
        // Auto-add missing dependencies
        correctedLayers.push(...missingDeps);
        autoAdded.push(...missingDeps);
        
        warnings.push(
          `Layer ${layerId} (${this.LAYER_INFO[layerId]?.name}) requires ` +
          `${missingDeps.map(dep => `${dep} (${this.LAYER_INFO[dep]?.name})`).join(', ')}. ` +
          `Auto-added missing dependencies.`
        );
      }
    }
    
    // Remove duplicates and sort
    correctedLayers = [...new Set(correctedLayers)].sort((a, b) => a - b);
    
    return {
      correctedLayers,
      warnings,
      autoAdded,
      estimatedTime: this.calculateEstimatedTime(correctedLayers)
    };
  }
  
  /**
   * Calculate estimated execution time for layers
   */
  static calculateEstimatedTime(layers) {
    return layers.reduce((total, layerId) => {
      return total + (this.LAYER_INFO[layerId]?.estimatedTime || 1000);
    }, 0);
  }
  
  /**
   * Suggests optimal layer combinations based on code analysis
   */
  static suggestLayers(code) {
    const recommended = [];
    const reasons = [];
    
    // Always recommend config layer for foundation
    recommended.push(1);
    reasons.push('Configuration layer provides essential foundation');
    
    // Check for HTML entities or old patterns
    if (/&quot;|&amp;|&lt;|&gt;|console\.log/.test(code)) {
      recommended.push(2);
      reasons.push('Entity cleanup needed for HTML entities and old patterns');
    }
    
    // Check for React components needing fixes
    if (code.includes('map(') && code.includes('<') && !code.includes('key=')) {
      recommended.push(3);
      reasons.push('Component fixes needed for missing key props');
    }
    
    // Check for hydration issues
    if (code.includes('localStorage') && !code.includes('typeof window')) {
      recommended.push(4);
      reasons.push('Hydration fixes needed for SSR safety');
    }
    
    // Check for Next.js patterns
    if (code.includes('getInitialProps') || code.includes('_app.') || code.includes('_document.')) {
      recommended.push(5);
      reasons.push('Next.js modernization needed for legacy patterns');
    }
    
    // Check for testing patterns
    if (code.includes('describe(') || code.includes('test(') || code.includes('it(')) {
      recommended.push(6);
      reasons.push('Testing improvements available');
    }
    
    return { recommended, reasons };
  }
  
  /**
   * Check if layer combination is valid
   */
  static isValidCombination(layers) {
    const { correctedLayers, warnings } = this.validateAndCorrectLayers(layers);
    
    return {
      isValid: correctedLayers.length === layers.length && warnings.length === 0,
      correctedLayers,
      issues: warnings
    };
  }
  
  /**
   * Get layer execution plan with dependencies resolved
   */
  static getExecutionPlan(requestedLayers) {
    const { correctedLayers, warnings, autoAdded, estimatedTime } = 
      this.validateAndCorrectLayers(requestedLayers);
    
    const plan = correctedLayers.map(layerId => ({
      id: layerId,
      name: this.LAYER_INFO[layerId].name,
      description: this.LAYER_INFO[layerId].description,
      dependencies: this.DEPENDENCIES[layerId],
      critical: this.LAYER_INFO[layerId].critical,
      estimatedTime: this.LAYER_INFO[layerId].estimatedTime,
      autoAdded: autoAdded.includes(layerId)
    }));
    
    return {
      layers: plan,
      totalLayers: correctedLayers.length,
      totalEstimatedTime: estimatedTime,
      warnings,
      autoAddedCount: autoAdded.length
    };
  }
  
  /**
   * Validate layer prerequisites
   */
  static validatePrerequisites(layerId, availableLayers) {
    const dependencies = this.DEPENDENCIES[layerId] || [];
    const missingDeps = dependencies.filter(dep => !availableLayers.includes(dep));
    
    return {
      canExecute: missingDeps.length === 0,
      missingDependencies: missingDeps,
      requiredDependencies: dependencies
    };
  }
  
  /**
   * Get critical path for layer execution
   */
  static getCriticalPath(targetLayer) {
    const criticalPath = [];
    const dependencies = this.DEPENDENCIES[targetLayer] || [];
    
    // Build path including all dependencies
    const allDeps = new Set([targetLayer, ...dependencies]);
    
    // Sort by execution order
    const sortedPath = Array.from(allDeps).sort((a, b) => a - b);
    
    return sortedPath.map(layerId => ({
      id: layerId,
      name: this.LAYER_INFO[layerId].name,
      critical: this.LAYER_INFO[layerId].critical,
      estimatedTime: this.LAYER_INFO[layerId].estimatedTime
    }));
  }
  
  /**
   * Check for circular dependencies (safety check)
   */
  static detectCircularDependencies() {
    const circular = [];
    
    for (const [layerId, deps] of Object.entries(this.DEPENDENCIES)) {
      const visited = new Set();
      const stack = [parseInt(layerId)];
      
      while (stack.length > 0) {
        const current = stack.pop();
        if (visited.has(current)) {
          circular.push({
            layer: layerId,
            circularPath: Array.from(visited)
          });
          break;
        }
        
        visited.add(current);
        const currentDeps = this.DEPENDENCIES[current] || [];
        stack.push(...currentDeps);
      }
    }
    
    return circular;
  }
  
  /**
   * Generate dependency graph visualization data
   */
  static generateDependencyGraph() {
    const nodes = Object.keys(this.LAYER_INFO).map(layerId => ({
      id: layerId,
      name: this.LAYER_INFO[layerId].name,
      critical: this.LAYER_INFO[layerId].critical
    }));
    
    const edges = [];
    Object.entries(this.DEPENDENCIES).forEach(([layerId, deps]) => {
      deps.forEach(dep => {
        edges.push({
          from: dep,
          to: parseInt(layerId),
          type: 'dependency'
        });
      });
    });
    
    return { nodes, edges };
  }
  
  /**
   * Get layer information by ID
   */
  static getLayerInfo(layerId) {
    return this.LAYER_INFO[layerId] || null;
  }
  
  /**
   * Get all available layers
   */
  static getAllLayers() {
    return Object.keys(this.LAYER_INFO).map(id => parseInt(id)).sort();
  }
  
  /**
   * Filter layers by criteria
   */
  static filterLayers(criteria = {}) {
    const { critical, maxTime, includeOptional = true } = criteria;
    
    return Object.entries(this.LAYER_INFO)
      .filter(([layerId, info]) => {
        if (critical !== undefined && info.critical !== critical) return false;
        if (maxTime !== undefined && info.estimatedTime > maxTime) return false;
        if (!includeOptional && !info.critical) return false;
        return true;
      })
      .map(([layerId]) => parseInt(layerId));
  }
}

module.exports = { LayerDependencyManager };
