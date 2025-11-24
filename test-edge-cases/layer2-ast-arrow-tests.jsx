/**
 * Comprehensive test cases for AST-based console.log removal in arrow functions
 * Tests all edge cases that regex-based approach couldn't handle reliably
 */

// Test Case 1: Expression-bodied arrow with no parameters
const handler1 = () => {} /* [NeuroLint] Removed console.log: 'test'*/;

// Test Case 2: Expression-bodied arrow with single parameter (no parens)
const handler2 = value => {} /* [NeuroLint] Removed console.log: value*/;

// Test Case 3: Expression-bodied arrow with single parameter (with parens)
const handler3 = value => {} /* [NeuroLint] Removed console.log: value*/;

// Test Case 4: Expression-bodied arrow with multiple parameters
const handler4 = (a, b) => {} /* [NeuroLint] Removed console.log: a, b*/;

// Test Case 5: Block-bodied arrow with ONLY console.log
const handler5 = () => {
  // [NeuroLint] Removed console.log: 'only statement'
  ;
};

// Test Case 6: Block-bodied arrow with console.log AND other statements (should NOT be empty block)
const handler6 = () => {
  // [NeuroLint] Removed console.log: 'logging'
  ;
  return 'value';
};

// Test Case 7: Nested arrow functions
const handler7 = () => {
  const inner = () => {} /* [NeuroLint] Removed console.log: 'nested'*/;
  return inner;
};

// Test Case 8: Arrow function in array
// [NeuroLint] Replace mock data with API fetch:
const handlers = [() => {} /* [NeuroLint] Removed console.log: 'first'*/, x => {} /* [NeuroLint] Removed console.log: x*/, value => {} /* [NeuroLint] Removed console.log: value*/];

// Test Case 9: Arrow function as callback
setTimeout(() => {} /* [NeuroLint] Removed console.log: 'timeout'*/, 1000);
array.map(item => {} /* [NeuroLint] Removed console.log: item*/);
array.forEach(x => {} /* [NeuroLint] Removed console.log: x*/);

// Test Case 10: Console variants (info, warn, error, debug)
const logInfo = () => {} /* [NeuroLint] Removed console.info: 'info'*/;
const logWarn = () => {} /* [NeuroLint] Removed console.warn: 'warning'*/;
const logError = () => {} /* [NeuroLint] Removed console.error: 'error'*/;
const logDebug = () => {} /* [NeuroLint] Removed console.debug: 'debug'*/;

// Test Case 11: Console.log in ternary expression (should replace with undefined)
const result = condition ? // [NeuroLint] Removed console.log: 'yes'
undefined : 'no';

// Test Case 12: Console.log in logical expression (should replace with undefined)
const value = flag && // [NeuroLint] Removed console.log: 'flag is true'
undefined;

// Test Case 13: Console.log as standalone statement (should be removed)
// [NeuroLint] Removed console.log: 'standalone statement'
; // Test Case 14: Alert/confirm/prompt in arrow functions
const alertHandler = () => {} /* [NeuroLint] Replace with toast notification: 'message'*/;
const confirmHandler = () => {} /* [NeuroLint] Replace with dialog: 'Are you sure?'*/;
const promptHandler = () => {} /* [NeuroLint] Replace with dialog: 'Enter value:'*/;

// Test Case 15: Complex expression arrow (console.log with operators)
const complex = () => // [NeuroLint] Removed console.log: 'a'
undefined || // [NeuroLint] Removed console.log: 'b'
undefined;

// Test Case 16: Arrow with destructured params
const destructured = ({
  name,
  age
}) => {} /* [NeuroLint] Removed console.log: name, age*/;

// Test Case 17: Arrow with rest params
const rest = (...args) => {} /* [NeuroLint] Removed console.log: args*/;

// Test Case 18: Arrow with default params
const defaults = (name = 'unknown') => {} /* [NeuroLint] Removed console.log: name*/;

// Test Case 19: Immediately invoked arrow function
(() => {} /* [NeuroLint] Removed console.log: 'IIFE'*/)();

// Test Case 20: Arrow returning arrow with console.log
const curried = x => y => {} /* [NeuroLint] Removed console.log: x, y*/;