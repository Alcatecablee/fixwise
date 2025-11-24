/**
 * Test file for Layer 3 map callback edge cases
 * These are the specific patterns that should work but currently fail with regex fallback
 */

import React from 'react';

// Test Case 1: Simple parameter (no parens)
function Test1({ todos }) {
  return <div>{todos.map(todo => <Todo>{todo}</Todo>)}</div>;
}

// Test Case 2: Simple parameter (with parens)
function Test2({ todos }) {
  return <div>{todos.map((todo) => <Todo>{todo}</Todo>)}</div>;
}

// Test Case 3: Object destructuring
function Test3({ items }) {
  return <div>{items.map(({ id }) => <Item>{id}</Item>)}</div>;
}

// Test Case 4: Object destructuring without parens
function Test4({ items }) {
  return <div>{items.map({ id } => <Item>{id}</Item>)}</div>;
}

// Test Case 5: Two parameters already present
function Test5({ items }) {
  return <div>{items.map((item, i) => <Item>{item}</Item>)}</div>;
}

// Test Case 6: Two parameters with destructuring
function Test6({ items }) {
  return <div>{items.map(({ id }, idx) => <Item>{id}</Item>)}</div>;
}

// Test Case 7: Two parameters with index name
function Test7({ todos }) {
  return <div>{todos.map((todo, index) => <Todo>{todo}</Todo>)}</div>;
}

// CRITICAL EDGE CASES THAT BREAK:

// Test Case 8: Default parameter (contains =)
function Test8({ items }) {
  return <div>{items.map((item = {}) => <Item>{item.name}</Item>)}</div>;
}

// Test Case 9: Empty callback parameters
function Test9({ items }) {
  return <div>{items.map(() => <Item>Static</Item>)}</div>;
}

// Test Case 10: Default with destructuring
function Test10({ items }) {
  return <div>{items.map(({ name = 'unknown' }) => <Item>{name}</Item>)}</div>;
}

// Test Case 11: Multiple defaults
function Test11({ items }) {
  return <div>{items.map((item = {}, idx = 0) => <Item>{item}</Item>)}</div>;
}

// Test Case 12: Destructuring with rest
function Test12({ items }) {
  return <div>{items.map(({ id, ...rest }) => <Item>{id}</Item>)}</div>;
}

// Test Case 13: Array destructuring
function Test13({ pairs }) {
  return <div>{pairs.map(([first, second]) => <Pair>{first}</Pair>)}</div>;
}

// Test Case 14: Nested destructuring
function Test14({ items }) {
  return <div>{items.map(({ data: { id } }) => <Item>{id}</Item>)}</div>;
}

// Dummy components for testing
const Todo = ({ children }) => <div>{children}</div>;
const Item = ({ children }) => <div>{children}</div>;
const Pair = ({ children }) => <div>{children}</div>;
