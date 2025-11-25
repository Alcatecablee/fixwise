#!/usr/bin/env node

/**
 * NeuroLint - Licensed under Business Source License 1.1
 * Copyright (c) 2025 NeuroLint
 * Change Date: 2029-11-22 | Change License: GPL-3.0-or-later
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */



/**
 * React 19.2 Feature Detector
 * Detects opportunities to use React 19.2 features:
 * - View Transitions
 * - useEffectEvent
 * - Activity component
 */

const fs = require('fs').promises;
const path = require('path');

class React192FeatureDetector {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.projectPath = options.projectPath || process.cwd();
  }

  log(message, level = 'info') {
    if (this.verbose) {
      const prefix = level === 'error' ? '[ERROR]' : level === 'success' ? '[SUCCESS]' : '[INFO]';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Main detection entry point
   */
  async detect() {
    this.log('Scanning for React 19.2 feature opportunities...', 'info');
    
    try {
      const opportunities = {
        viewTransitions: await this.detectViewTransitionOpportunities(),
        useEffectEvent: await this.detectUseEffectEventOpportunities(),
        activity: await this.detectActivityOpportunities(),
        total: 0
      };

      opportunities.total = opportunities.viewTransitions.length + 
                           opportunities.useEffectEvent.length + 
                           opportunities.activity.length;

      this.printReport(opportunities);

      return opportunities;
    } catch (error) {
      this.log(`Detection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Detect View Transition opportunities
   * Look for manual animation code that could use View Transitions API
   */
  async detectViewTransitionOpportunities() {
    const opportunities = [];
    const files = await this.findSourceFiles();

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');

        // Detect manual animation patterns
        const hasManualAnimations = content.match(/(useSpring|useTransition|animate|transition|framer-motion|react-spring)/i);
        const hasNavigationAnimation = content.match(/(useRouter|useNavigate|Link.*animate)/i);
        
        if (hasManualAnimations || hasNavigationAnimation) {
          opportunities.push({
            file: filePath,
            type: 'view-transition',
            description: 'Manual animation detected - consider using React 19.2 View Transitions',
            example: `import { useTransition } from 'react';\n\nfunction Page() {\n  const [isPending, startTransition] = useTransition();\n  \n  const navigate = () => {\n    startTransition(() => {\n      // Navigation with View Transition\n      router.push('/next-page');\n    });\n  };\n}`
          });
        }
      } catch {
        // Skip file
      }
    }

    return opportunities;
  }

  /**
   * Detect useEffectEvent opportunities
   * Look for non-reactive logic in useEffect
   */
  async detectUseEffectEventOpportunities() {
    const opportunities = [];
    const files = await this.findSourceFiles();

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');

        // Detect useEffect with callbacks
        const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*{([^}]+)}/g;
        let match;

        while ((match = useEffectPattern.exec(content)) !== null) {
          const effectBody = match[1];
          
          // Check if effect calls functions/callbacks
          const hasCallback = effectBody.match(/(onClick|onSubmit|handleClick|handle\w+)\(/);
          const hasDependencies = content.includes('// eslint-disable-next-line react-hooks/exhaustive-deps');
          
          if (hasCallback || hasDependencies) {
            opportunities.push({
              file: filePath,
              type: 'use-effect-event',
              description: 'useEffect with callbacks detected - consider using useEffectEvent to extract non-reactive logic',
              example: `import { useEffectEvent } from 'react';\n\nfunction Component({ onClick }) {\n  const onClickEvent = useEffectEvent(onClick);\n  \n  useEffect(() => {\n    // No need to include onClick in dependencies\n    onClickEvent();\n  }, []);  // No exhaustive-deps warning\n}`
            });
            break; // One per file is enough
          }
        }
      } catch {
        // Skip file
      }
    }

    return opportunities;
  }

  /**
   * Detect Activity component opportunities
   * Look for background rendering patterns
   */
  async detectActivityOpportunities() {
    const opportunities = [];
    const files = await this.findSourceFiles();

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');

        // Detect display:none patterns
        const hasHiddenComponent = content.match(/display:\s*['"]none['"]/);
        const hasConditionalRender = content.match(/{(\w+)\s*\?\s*<\w+/g);
        const hasHiddenAttr = content.match(/hidden={true}/);
        
        if (hasHiddenComponent || (hasConditionalRender && content.includes('hidden'))) {
          opportunities.push({
            file: filePath,
            type: 'activity',
            description: 'Hidden component detected - consider using React 19.2 Activity component to maintain state',
            example: `import { Activity } from 'react';\n\nfunction Component({ isVisible }) {\n  return (\n    <Activity mode={isVisible ? 'visible' : 'hidden'}>\n      {/* Component maintains state even when hidden */}\n      <ExpensiveComponent />\n    </Activity>\n  );\n}`
          });
        }
      } catch {
        // Skip file
      }
    }

    return opportunities;
  }

  /**
   * Print detection report
   */
  printReport(opportunities) {
    console.log('\n' + '='.repeat(60));
    console.log('React 19.2 Feature Opportunities');
    console.log('='.repeat(60));
    console.log(`\nTotal Opportunities: ${opportunities.total}`);
    
    if (opportunities.viewTransitions.length > 0) {
      console.log(`\n[View Transitions] (${opportunities.viewTransitions.length} opportunities)`);
      opportunities.viewTransitions.slice(0, 3).forEach(opp => {
        console.log(`  - ${path.basename(opp.file)}: ${opp.description}`);
      });
      if (opportunities.viewTransitions.length > 3) {
        console.log(`  ... and ${opportunities.viewTransitions.length - 3} more`);
      }
      console.log(`\n  Example:`);
      console.log(`  ${opportunities.viewTransitions[0].example.split('\n').join('\n  ')}`);
    }
    
    if (opportunities.useEffectEvent.length > 0) {
      console.log(`\n[useEffectEvent] (${opportunities.useEffectEvent.length} opportunities)`);
      opportunities.useEffectEvent.slice(0, 3).forEach(opp => {
        console.log(`  - ${path.basename(opp.file)}: ${opp.description}`);
      });
      if (opportunities.useEffectEvent.length > 3) {
        console.log(`  ... and ${opportunities.useEffectEvent.length - 3} more`);
      }
      console.log(`\n  Example:`);
      console.log(`  ${opportunities.useEffectEvent[0].example.split('\n').join('\n  ')}`);
    }
    
    if (opportunities.activity.length > 0) {
      console.log(`\n[Activity Component] (${opportunities.activity.length} opportunities)`);
      opportunities.activity.slice(0, 3).forEach(opp => {
        console.log(`  - ${path.basename(opp.file)}: ${opp.description}`);
      });
      if (opportunities.activity.length > 3) {
        console.log(`  ... and ${opportunities.activity.length - 3} more`);
      }
      console.log(`\n  Example:`);
      console.log(`  ${opportunities.activity[0].example.split('\n').join('\n  ')}`);
    }
    
    if (opportunities.total === 0) {
      console.log('\nNo React 19.2 feature opportunities detected.');
      console.log('Your codebase may already be using modern patterns, or these features may not be applicable.');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Helper: Find all source files
   */
  async findSourceFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!ignoreDirs.includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    await scan(this.projectPath);
    return files;
  }
}

module.exports = React192FeatureDetector;
