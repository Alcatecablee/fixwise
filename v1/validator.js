/**
 * Transformation Validator
 * Validates code transformations for safety and correctness
 */

class TransformationValidator {
  constructor(options = {}) {
    this.strict = options.strict !== false;
  }

  validate(originalCode, transformedCode, filename) {
    // Basic validation - can be enhanced later
    if (!transformedCode || transformedCode.trim().length === 0) {
      return {
        valid: false,
        errors: ['Transformed code is empty']
      };
    }

    // Check for basic syntax issues (very simple check)
    const hasMatchingBraces = this.checkMatchingBraces(transformedCode);
    if (!hasMatchingBraces) {
      return {
        valid: false,
        errors: ['Mismatched braces in transformed code']
      };
    }

    return {
      valid: true,
      errors: []
    };
  }

  checkMatchingBraces(code) {
    const stack = [];
    const pairs = { '{': '}', '[': ']', '(': ')' };
    
    for (const char of code) {
      if (char in pairs) {
        stack.push(pairs[char]);
      } else if (Object.values(pairs).includes(char)) {
        if (stack.pop() !== char) return false;
      }
    }
    
    return stack.length === 0;
  }

  validateFile(filePath, originalCode, transformedCode) {
    // Validate file transformation
    return this.validate(originalCode, transformedCode, filePath);
  }

  static validateCode(code, filename) {
    const validator = new TransformationValidator();
    return validator.validate('', code, filename);
  }
}

module.exports = TransformationValidator;
