const TransformationValidator = require('../validator');

describe('TransformationValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new TransformationValidator();
  });

  describe('Static Methods', () => {
    test('validateFile should exist as static method', () => {
      expect(typeof TransformationValidator.validateFile).toBe('function');
    });

    test('validateTransformation should exist as static method', () => {
      expect(typeof TransformationValidator.validateTransformation).toBe('function');
    });

    test('validateTransformation should validate code transformations', async () => {
      const originalCode = 'const x = 1;';
      const transformedCode = 'const x = 2;';
      const result = await TransformationValidator.validateTransformation(
        originalCode,
        transformedCode
      );
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('shouldRevert');
    });

    test('validateTransformation should detect empty code', async () => {
      const originalCode = 'const x = 1;';
      const transformedCode = '';
      const result = await TransformationValidator.validateTransformation(
        originalCode,
        transformedCode
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    test('should create validator instance', () => {
      expect(validator).toBeInstanceOf(TransformationValidator);
    });

    test('should have validate method', () => {
      expect(typeof validator.validate).toBe('function');
    });

    test('should have checkMatchingBraces method', () => {
      expect(typeof validator.checkMatchingBraces).toBe('function');
    });

    test('should validate code with proper braces', () => {
      const code = 'function test() { return true; }';
      const result = validator.validate('', code);
      expect(result).toHaveProperty('valid');
      expect(result.valid).toBe(true);
    });

    test('should detect mismatched braces', () => {
      const code = 'function test() { return true;';
      const result = validator.validate('', code);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mismatched braces in transformed code');
    });

    test('should reject empty code', () => {
      const code = '';
      const result = validator.validate('const x = 1;', code);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transformed code is empty');
    });
  });

  describe('Brace Matching', () => {
    test('should match curly braces', () => {
      expect(validator.checkMatchingBraces('{ }')).toBe(true);
      expect(validator.checkMatchingBraces('{ } { }')).toBe(true);
      expect(validator.checkMatchingBraces('{ { } }')).toBe(true);
    });

    test('should match square brackets', () => {
      expect(validator.checkMatchingBraces('[ ]')).toBe(true);
      expect(validator.checkMatchingBraces('[ [ ] ]')).toBe(true);
    });

    test('should match parentheses', () => {
      expect(validator.checkMatchingBraces('( )')).toBe(true);
      expect(validator.checkMatchingBraces('( ( ) )')).toBe(true);
    });

    test('should detect mismatched braces', () => {
      expect(validator.checkMatchingBraces('{ ]')).toBe(false);
      expect(validator.checkMatchingBraces('{ { }')).toBe(false);
      expect(validator.checkMatchingBraces('( ( )')).toBe(false);
    });

    test('should handle mixed braces', () => {
      expect(validator.checkMatchingBraces('{ [ ( ) ] }')).toBe(true);
      expect(validator.checkMatchingBraces('{ [ ( ] ) }')).toBe(false);
    });
  });

  describe('Configuration', () => {
    test('should use strict mode by default', () => {
      expect(validator.strict).toBe(true);
    });

    test('should allow non-strict mode', () => {
      const nonStrictValidator = new TransformationValidator({ strict: false });
      expect(nonStrictValidator.strict).toBe(false);
    });
  });
});
