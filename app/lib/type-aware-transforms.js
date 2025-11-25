/**
 * Type-Aware Transformation System for NeuroLint Pro
 *
 * Leverages TypeScript's type system for intelligent code transformations
 * Integrates with Enhanced AST Engine for semantic understanding
 *
 * Follows IMPLEMENTATION_PATTERNS.md patterns for safe transformations
 */

const t = require("@babel/types");
const traverse = require("@babel/traverse").default;

/**
 * Type-Aware Transformation System
 * Provides intelligent transformations based on TypeScript type information
 */
class TypeAwareTransforms {
  constructor(astEngine) {
    this.astEngine = astEngine;
    this.typeRegistry = new Map();
    this.componentInterfaces = new Map();
    this.knownLibraryTypes = this.initializeKnownTypes();
  }

  /**
   * Initialize known library types for better transformations
   */
  initializeKnownTypes() {
    return {
      // React component prop types
      Button: {
        variant: [
          "default",
          "primary",
          "secondary",
          "destructive",
          "outline",
          "ghost",
          "link",
        ],
        size: ["default", "sm", "lg", "icon"],
        disabled: "boolean",
        onClick: "function",
      },
      Input: {
        type: ["text", "email", "password", "number", "search", "url", "tel"],
        placeholder: "string",
        value: "string",
        onChange: "function",
        disabled: "boolean",
        required: "boolean",
      },
      Card: {
        className: "string",
        children: "ReactNode",
      },
      Dialog: {
        open: "boolean",
        onOpenChange: "function",
        children: "ReactNode",
      },
      // Next.js specific types
      Image: {
        src: "string",
        alt: "string",
        width: "number",
        height: "number",
        priority: "boolean",
        placeholder: ["blur", "empty"],
      },
      Link: {
        href: "string",
        children: "ReactNode",
        prefetch: "boolean",
      },
    };
  }

  /**
   * Analyze component props and suggest type improvements
   */
  analyzeComponentProps(ast, context) {
    const transformations = [];

    traverse(ast, {
      // Analyze function components
      FunctionDeclaration: (path) => {
        if (this.astEngine.isReactComponent(path)) {
          const analysis = this.analyzeComponentPropsUsage(path, context);
          if (analysis.needsInterface) {
            transformations.push({
              type: "add-props-interface",
              component: path.node.id.name,
              suggestedInterface: analysis.interface,
              confidence: analysis.confidence,
              location: path.node.loc,
              action: () => this.addPropsInterface(path, analysis.interface),
            });
          }
        }
      },

      // Analyze arrow function components
      VariableDeclarator: (path) => {
        if (this.astEngine.isReactComponentVariable(path)) {
          const analysis = this.analyzeComponentPropsUsage(path, context);
          if (analysis.needsInterface) {
            transformations.push({
              type: "add-props-interface",
              component: path.node.id.name,
              suggestedInterface: analysis.interface,
              confidence: analysis.confidence,
              location: path.node.loc,
              action: () =>
                this.addPropsInterfaceForVariable(path, analysis.interface),
            });
          }
        }
      },
    });

    return transformations;
  }

  /**
   * Analyze how props are used in a component to infer types
   */
  analyzeComponentPropsUsage(path, context) {
    const componentName = this.getComponentName(path);
    const propsParam = this.getPropsParameter(path);

    if (!propsParam) {
      return { needsInterface: false };
    }

    const propsUsage = new Map();
    const propsParamName = propsParam.name;

    // Analyze prop access patterns
    traverse(path.node, {
      MemberExpression: (memberPath) => {
        if (t.isIdentifier(memberPath.node.object, { name: propsParamName })) {
          const propName = memberPath.node.property.name;
          if (propName) {
            const usage = this.inferPropType(memberPath, propName);
            propsUsage.set(propName, usage);
          }
        }
      },

      // Destructuring assignment
      ObjectPattern: (destructPath) => {
        if (destructPath.node === propsParam) {
          destructPath.node.properties.forEach((prop) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              const propName = prop.key.name;
              const usage = this.inferPropTypeFromDestructuring(prop);
              propsUsage.set(propName, usage);
            }
          });
        }
      },
    });

    // Check if component already has prop types
    const hasExistingTypes = this.hasExistingPropTypes(path, componentName);

    if (propsUsage.size === 0 || hasExistingTypes) {
      return { needsInterface: false };
    }

    // Generate interface based on usage
    const interfaceProps = Array.from(propsUsage.entries()).map(
      ([name, type]) => ({
        name,
        type: type.inferredType,
        optional: type.optional,
        description: type.description,
      }),
    );

    return {
      needsInterface: true,
      interface: {
        name: `${componentName}Props`,
        properties: interfaceProps,
      },
      confidence: this.calculateTypeConfidence(propsUsage),
    };
  }

  /**
   * Infer prop type from usage context
   */
  inferPropType(memberPath, propName) {
    const parent = memberPath.parent;
    let inferredType = "any";
    let optional = true;
    let description = "";

    // Analyze usage context
    if (t.isCallExpression(parent) && parent.callee === memberPath.node) {
      // Used as function: onClick(), onSubmit()
      inferredType = "() => void";
      description = "Event handler function";
    } else if (t.isBinaryExpression(parent)) {
      // Used in comparison: if (prop === 'value')
      if (t.isStringLiteral(parent.right)) {
        inferredType = "string";
      } else if (t.isNumericLiteral(parent.right)) {
        inferredType = "number";
      } else if (t.isBooleanLiteral(parent.right)) {
        inferredType = "boolean";
      }
    } else if (t.isJSXExpressionContainer(parent)) {
      // Used in JSX: <div className={props.className}>
      if (propName === "className") {
        inferredType = "string";
        optional = true;
      } else if (propName === "children") {
        inferredType = "React.ReactNode";
        optional = true;
      } else if (propName.startsWith("on") && propName.length > 2) {
        inferredType = "() => void";
        description = "Event handler";
      } else {
        inferredType = "string | number";
      }
    } else if (
      t.isArrayExpression(parent) ||
      (t.isMemberExpression(parent) && parent.property.name === "map")
    ) {
      // Used as array: props.items.map()
      inferredType = "any[]";
    }

    // Check for common prop naming patterns
    if (propName === "id") {
      inferredType = "string";
    } else if (
      propName === "disabled" ||
      propName === "loading" ||
      propName === "visible"
    ) {
      inferredType = "boolean";
      optional = true;
    } else if (
      propName === "count" ||
      propName === "index" ||
      propName === "size"
    ) {
      inferredType = "number";
    }

    return {
      inferredType,
      optional,
      description,
      confidence: this.getTypeConfidence(inferredType, propName),
    };
  }

  /**
   * Infer prop type from destructuring with default values
   */
  inferPropTypeFromDestructuring(prop) {
    let inferredType = "any";
    let optional = false;

    if (t.isAssignmentPattern(prop.value)) {
      // Has default value: { disabled = false }
      optional = true;
      const defaultValue = prop.value.right;

      if (t.isBooleanLiteral(defaultValue)) {
        inferredType = "boolean";
      } else if (t.isStringLiteral(defaultValue)) {
        inferredType = "string";
      } else if (t.isNumericLiteral(defaultValue)) {
        inferredType = "number";
      } else if (t.isArrayExpression(defaultValue)) {
        inferredType = "any[]";
      } else if (t.isObjectExpression(defaultValue)) {
        inferredType = "object";
      }
    }

    return {
      inferredType,
      optional,
      description: "",
      confidence: 0.8,
    };
  }

  /**
   * Enhance component props with library-specific knowledge
   */
  enhanceComponentPropsWithLibraryTypes(ast, context) {
    const transformations = [];

    traverse(ast, {
      JSXElement: (path) => {
        const elementName = path.node.openingElement.name.name;

        if (this.knownLibraryTypes[elementName]) {
          const enhancements = this.suggestLibrarySpecificEnhancements(
            path,
            elementName,
          );
          transformations.push(...enhancements);
        }
      },
    });

    return transformations;
  }

  /**
   * Suggest enhancements based on known library component types
   */
  suggestLibrarySpecificEnhancements(path, componentName) {
    const transformations = [];
    const knownProps = this.knownLibraryTypes[componentName];
    const currentProps = new Set();

    // Collect current props
    path.node.openingElement.attributes.forEach((attr) => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        currentProps.add(attr.name.name);
      }
    });

    // Check for missing required props
    Object.entries(knownProps).forEach(([propName, propType]) => {
      if (!currentProps.has(propName)) {
        const suggestion = this.generatePropSuggestion(
          componentName,
          propName,
          propType,
        );
        if (suggestion) {
          transformations.push({
            type: "add-missing-prop",
            component: componentName,
            prop: propName,
            suggestion: suggestion,
            location: path.node.openingElement.loc,
            action: () => this.addProp(path, propName, suggestion.value),
          });
        }
      }
    });

    // Check for prop type mismatches
    path.node.openingElement.attributes.forEach((attr) => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const propName = attr.name.name;
        if (knownProps[propName]) {
          const validation = this.validatePropValue(attr, knownProps[propName]);
          if (!validation.valid) {
            transformations.push({
              type: "fix-prop-type",
              component: componentName,
              prop: propName,
              issue: validation.issue,
              suggestion: validation.suggestion,
              location: attr.loc,
              action: () => this.fixPropValue(attr, validation.suggestion),
            });
          }
        }
      }
    });

    return transformations;
  }

  /**
   * Generate prop suggestions based on component context
   */
  generatePropSuggestion(componentName, propName, propType) {
    // Critical props that should always be present
    const criticalProps = {
      Image: ["alt", "src"],
      Button: [],
      Input: ["type"],
      Link: ["href"],
    };

    if (criticalProps[componentName]?.includes(propName)) {
      if (propName === "alt" && componentName === "Image") {
        return {
          value: '""', // Empty alt for decorative images
          reason: "Required for accessibility",
        };
      } else if (propName === "type" && componentName === "Input") {
        return {
          value: '"text"',
          reason: "Default input type",
        };
      }
    }

    return null;
  }

  /**
   * Validate prop values against known types
   */
  validatePropValue(attr, expectedType) {
    if (!attr.value) {
      return { valid: true };
    }

    const value = attr.value;

    if (Array.isArray(expectedType)) {
      // Enum type validation
      if (t.isStringLiteral(value)) {
        if (!expectedType.includes(value.value)) {
          return {
            valid: false,
            issue: `Invalid value "${value.value}". Expected one of: ${expectedType.join(", ")}`,
            suggestion: expectedType[0], // Suggest first valid option
          };
        }
      }
    } else if (expectedType === "boolean") {
      if (
        !t.isJSXExpressionContainer(value) ||
        !t.isBooleanLiteral(value.expression)
      ) {
        return {
          valid: false,
          issue: "Expected boolean value",
          suggestion: "true",
        };
      }
    } else if (expectedType === "number") {
      if (
        !t.isJSXExpressionContainer(value) ||
        !t.isNumericLiteral(value.expression)
      ) {
        return {
          valid: false,
          issue: "Expected number value",
          suggestion: "0",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Add props interface to component
   */
  addPropsInterface(functionPath, interfaceSpec) {
    const componentName = functionPath.node.id.name;
    const interfaceName = interfaceSpec.name;

    // Create TypeScript interface
    const interfaceDeclaration = t.tsInterfaceDeclaration(
      t.identifier(interfaceName),
      null,
      null,
      t.tsInterfaceBody(
        interfaceSpec.properties.map((prop) =>
          t.tsPropertySignature(
            t.identifier(prop.name),
            t.tsTypeAnnotation(this.createTypeAnnotation(prop.type)),
          ),
        ),
      ),
    );

    // Mark optional properties
    interfaceSpec.properties.forEach((prop, index) => {
      if (prop.optional) {
        interfaceDeclaration.body.body[index].optional = true;
      }
    });

    // Insert interface before component
    functionPath.insertBefore(interfaceDeclaration);

    // Add type annotation to props parameter
    const propsParam = functionPath.node.params[0];
    if (propsParam && t.isIdentifier(propsParam)) {
      propsParam.typeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(t.identifier(interfaceName)),
      );
    }
  }

  /**
   * Create TypeScript type annotation from string type
   */
  createTypeAnnotation(typeString) {
    switch (typeString) {
      case "string":
        return t.tsStringKeyword();
      case "number":
        return t.tsNumberKeyword();
      case "boolean":
        return t.tsBooleanKeyword();
      case "any":
        return t.tsAnyKeyword();
      case "React.ReactNode":
        return t.tsTypeReference(
          t.tsQualifiedName(t.identifier("React"), t.identifier("ReactNode")),
        );
      case "() => void":
        return t.tsFunctionType(
          null,
          [],
          t.tsTypeAnnotation(t.tsVoidKeyword()),
        );
      case "any[]":
        return t.tsArrayType(t.tsAnyKeyword());
      default:
        if (typeString.includes("|")) {
          // Union type
          const types = typeString.split("|").map((t) => t.trim());
          return t.tsUnionType(
            types.map((type) => this.createTypeAnnotation(type)),
          );
        }
        return t.tsAnyKeyword();
    }
  }

  // Helper methods
  getComponentName(path) {
    if (t.isFunctionDeclaration(path.node)) {
      return path.node.id.name;
    } else if (t.isVariableDeclarator(path.node)) {
      return path.node.id.name;
    }
    return "Unknown";
  }

  getPropsParameter(path) {
    let params;
    if (t.isFunctionDeclaration(path.node)) {
      params = path.node.params;
    } else if (
      t.isVariableDeclarator(path.node) &&
      (t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init))
    ) {
      params = path.node.init.params;
    }

    return params && params[0] ? params[0] : null;
  }

  hasExistingPropTypes(path, componentName) {
    // Check for existing TypeScript interface or PropTypes
    let hasTypes = false;

    // Look for interface with ComponentProps pattern
    const program = path.scope.getProgramParent().path;
    traverse(program.node, {
      TSInterfaceDeclaration(interfacePath) {
        if (interfacePath.node.id.name === `${componentName}Props`) {
          hasTypes = true;
        }
      },
    });

    return hasTypes;
  }

  calculateTypeConfidence(propsUsage) {
    let totalConfidence = 0;
    propsUsage.forEach((usage) => {
      totalConfidence += usage.confidence;
    });
    return totalConfidence / propsUsage.size;
  }

  getTypeConfidence(inferredType, propName) {
    if (inferredType === "any") return 0.3;
    if (propName === "className" && inferredType === "string") return 0.9;
    if (propName === "children" && inferredType === "React.ReactNode")
      return 0.9;
    if (propName.startsWith("on") && inferredType === "() => void") return 0.8;
    return 0.7;
  }

  addProp(path, propName, value) {
    const newProp = t.jsxAttribute(
      t.jsxIdentifier(propName),
      t.stringLiteral(value),
    );
    path.node.openingElement.attributes.push(newProp);
  }

  fixPropValue(attr, newValue) {
    attr.value = t.stringLiteral(newValue);
  }

  addPropsInterfaceForVariable(path, interfaceSpec) {
    // Similar to addPropsInterface but for variable declarations
    this.addPropsInterface(path, interfaceSpec);
  }
}

module.exports = { TypeAwareTransforms };
