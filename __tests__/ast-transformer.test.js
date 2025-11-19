const ASTTransformer = require('../ast-transformer');

describe('ASTTransformer', () => {
  let transformer;

  beforeEach(() => {
    transformer = new ASTTransformer();
  });

  describe('Initialization', () => {
    test('should create transformer instance', () => {
      expect(transformer).toBeInstanceOf(ASTTransformer);
    });

    test('should have parseCode method', () => {
      expect(typeof transformer.parseCode).toBe('function');
    });

    test('should have generateCode method', () => {
      expect(typeof transformer.generateCode).toBe('function');
    });
  });

  describe('Code Parsing', () => {
    test('should parse valid JavaScript code', () => {
      const code = 'const x = 1;';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('File');
    });

    test('should parse React JSX code', () => {
      const code = 'const Component = () => <div>Hello</div>;';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
    });

    test('should handle TypeScript syntax', () => {
      const code = 'const x: number = 1;';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
    });

    test('should throw error for invalid syntax', () => {
      const code = 'const x = ;';
      expect(() => transformer.parseCode(code)).toThrow();
    });
  });

  describe('Code Generation', () => {
    test('should generate code from AST', () => {
      const code = 'const x = 1;';
      const ast = transformer.parseCode(code);
      const generated = transformer.generateCode(ast);
      expect(generated).toBeDefined();
      expect(generated.code).toBeDefined();
      expect(typeof generated.code).toBe('string');
    });

    test('should preserve code structure', () => {
      const code = 'function hello() { return "world"; }';
      const ast = transformer.parseCode(code);
      const generated = transformer.generateCode(ast);
      expect(generated.code).toContain('hello');
      expect(generated.code).toContain('world');
    });
  });

  describe('AST Traversal', () => {
    test('should parse code with variables', () => {
      const code = 'const x = 1; const y = 2;';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('File');
    });

    test('should handle JSX elements', () => {
      const code = 'const elem = <div><span>Hello</span></div>;';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('File');
    });
  });

  describe('Code Transformations', () => {
    test('should parse and generate code', () => {
      const code = 'const x = 1;';
      const ast = transformer.parseCode(code);
      const result = transformer.generateCode(ast);
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });

    test('should handle code with functions', () => {
      const code = 'function test() { return 42; }';
      const ast = transformer.parseCode(code);
      const result = transformer.generateCode(ast);
      expect(result.code).toContain('test');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed code gracefully', () => {
      const code = 'const x = ';
      expect(() => transformer.parseCode(code)).toThrow();
    });

    test('should handle empty code', () => {
      const code = '';
      const ast = transformer.parseCode(code);
      expect(ast).toBeDefined();
    });

    test('should parse valid code without errors', () => {
      const code = 'const x = 1;';
      expect(() => transformer.parseCode(code)).not.toThrow();
    });
  });
});
