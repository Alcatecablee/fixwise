const ReactCompilerDetector = require('../scripts/react-compiler-detector.js');
const fs = require('fs').promises;
const path = require('path');

describe('React Compiler Detector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, 'fixtures', 'compiler-test');
    await fs.mkdir(testDir, { recursive: true });
    detector = new ReactCompilerDetector({ verbose: false, projectPath: testDir });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('useMemo detection', () => {
    test('should detect useMemo usage', async () => {
      const componentContent = `
import { useMemo } from 'react';

export function Component({ data }) {
  const processed = useMemo(() => data.map(x => x * 2), [data]);
  return <div>{processed}</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'useMemo',
          count: 1
        })
      );
    });

    test('should count multiple useMemo calls', async () => {
      const componentContent = `
import { useMemo } from 'react';

export function Component({ data, items }) {
  const processed = useMemo(() => data.map(x => x * 2), [data]);
  const filtered = useMemo(() => items.filter(x => x.active), [items]);
  const sorted = useMemo(() => filtered.sort(), [filtered]);
  return <div>{processed}</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      const useMemoFinding = result.findings.find(f => f.pattern === 'useMemo');
      expect(useMemoFinding.count).toBe(3);
    });
  });

  describe('useCallback detection', () => {
    test('should detect useCallback usage', async () => {
      const componentContent = `
import { useCallback } from 'react';

export function Component({ onSave }) {
  const handleClick = useCallback(() => {
    onSave();
  }, [onSave]);
  
  return <button onClick={handleClick}>Save</button>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'useCallback',
          count: 1
        })
      );
    });
  });

  describe('React.memo detection', () => {
    test('should detect React.memo usage', async () => {
      const componentContent = `
import React from 'react';

const Component = React.memo(({ value }) => {
  return <div>{value}</div>;
});

export default Component;
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'React.memo',
          count: 1
        })
      );
    });

    test('should detect memo import from react', async () => {
      const componentContent = `
import { memo } from 'react';

const Component = memo(({ value }) => {
  return <div>{value}</div>;
});

export default Component;
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'React.memo',
          count: 1
        })
      );
    });
  });

  describe('useRef for previous values', () => {
    test('should detect useRef for tracking previous values', async () => {
      const componentContent = `
import { useRef, useEffect } from 'react';

export function Component({ value }) {
  const prevValueRef = useRef();
  
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  return <div>Current: {value}, Previous: {prevValueRef.current}</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'useRef for prev values'
        })
      );
    });
  });

  describe('Complex dependency management', () => {
    test('should detect heavy use of empty dependency arrays', async () => {
      const componentContent = `
import { useEffect } from 'react';

export function Component() {
  useEffect(() => {}, []);
  useEffect(() => {}, []);
  useEffect(() => {}, []);
  useEffect(() => {}, []);
  useEffect(() => {}, []);
  
  return <div>Component</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.findings).toContainEqual(
        expect.objectContaining({
          pattern: 'Complex dependency management'
        })
      );
    });
  });

  describe('Recommendation logic', () => {
    test('should strongly recommend compiler with 3+ findings', async () => {
      const componentContent = `
import { useMemo, useCallback, memo } from 'react';

const Component = memo(({ data, onClick }) => {
  const processed = useMemo(() => data.map(x => x * 2), [data]);
  const handleClick = useCallback(() => onClick(), [onClick]);
  
  return <button onClick={handleClick}>{processed}</button>;
});

export default Component;
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.recommendCompiler).toBe(true);
      expect(result.totalFindings).toBeGreaterThanOrEqual(3);
    });

    test('should not recommend compiler with no findings', async () => {
      const componentContent = `
export function Component({ value }) {
  return <div>{value}</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      expect(result.recommendCompiler).toBe(false);
      expect(result.totalFindings).toBe(0);
    });
  });

  describe('File scanning', () => {
    test('should scan multiple files', async () => {
      const comp1Content = `
import { useMemo } from 'react';

export function Component1({ data }) {
  const processed = useMemo(() => data.map(x => x * 2), [data]);
  return <div>{processed}</div>;
}
`;
      const comp2Content = `
import { useCallback } from 'react';

export function Component2({ onClick }) {
  const handleClick = useCallback(() => onClick(), [onClick]);
  return <button onClick={handleClick}>Click</button>;
}
`;
      
      await fs.writeFile(path.join(testDir, 'component1.tsx'), comp1Content);
      await fs.writeFile(path.join(testDir, 'component2.tsx'), comp2Content);

      const result = await detector.analyze();

      expect(result.totalFindings).toBeGreaterThanOrEqual(2);
    });

    test('should ignore node_modules', async () => {
      const nodeModulesDir = path.join(testDir, 'node_modules', 'some-package');
      await fs.mkdir(nodeModulesDir, { recursive: true });
      
      await fs.writeFile(
        path.join(nodeModulesDir, 'index.js'),
        'import { useMemo } from "react"; export const C = () => useMemo(() => {}, []);'
      );

      const result = await detector.analyze();

      // Should not detect useMemo in node_modules
      expect(result.findings.filter(f => f.file.includes('node_modules'))).toHaveLength(0);
    });
  });

  describe('Line number tracking', () => {
    test('should track line numbers for findings', async () => {
      const componentContent = `
import { useMemo } from 'react';

export function Component({ data }) {
  const processed = useMemo(() => data.map(x => x * 2), [data]);
  return <div>{processed}</div>;
}
`;

      await fs.writeFile(path.join(testDir, 'component.tsx'), componentContent);

      const result = await detector.analyze();

      const finding = result.findings.find(f => f.pattern === 'useMemo');
      expect(finding.line).toBeGreaterThan(0);
    });
  });
});
