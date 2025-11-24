"use client";

// NeuroLint Comprehensive Test - All Layers 1-7
// This file tests all layer transformations in one place

// ============ LAYER 2: Pattern Fixes ============

// Console.log with arrow functions (Bug #1 - should be fixed)
const handler = () => {} /* [NeuroLint] Removed console.log: 'test'*/;
const single = value => {} /* [NeuroLint] Removed console.log: value*/;
const multiParam = (a, b) => {} /* [NeuroLint] Removed console.log: a, b*/;
const destructured = ({
  name
}) => {} /* [NeuroLint] Removed console.log: name*/;

// Alert/Confirm/Prompt patterns
const result =
// [NeuroLint] Replace with dialog: 'Are you sure?'
undefined;
// [NeuroLint] Replace with toast notification: 'Hello World'
;
const input =
// [NeuroLint] Replace with dialog: 'Enter name:'
undefined;

// createFactory pattern
import React from 'react';
const divFactory = props => <div {...props} />;
const buttonFactory = props => <Button {...props} aria-label="Button" variant="default" />;

// ============ LAYER 3: Component Fixes ============

// Missing accessibility attributes
function ImageComponent() {
  return <img src="photo.jpg" alt="Image" />;
}

// Missing key props in map
function ListComponent({
  items
}) {
  return <ul>
      {items.map(item => <li key={item.id || item}>{item}</li>)}
    </ul>;
}

// Button without accessibility
function ButtonComponent() {
  return <Button aria-label="Button" variant="default">Click me</Button>;
}

// ============ LAYER 4: Hydration/SSR Fixes ============

// localStorage without SSR guard
const theme = typeof window !== "undefined" ? localStorage.getItem('theme') : null;
const user = typeof window !== "undefined" ? sessionStorage.getItem('user') : null;

// window access without guard
const width = typeof window !== "undefined" ? window.innerWidth : null;
const path = typeof window !== "undefined" ? window.location.pathname : null;

// document access without guard
const element = typeof document !== "undefined" ? document.getElementById('root') : null;
const title = document.title;

// Deep nesting (from bug reports)
if (typeof window !== "undefined") {
  window.navigator.geolocation.watchPosition = () => {};
}
if (typeof document !== "undefined") {
  document.body.firstElementChild.textContent = 'test';
} // ============ LAYER 5: Next.js Fixes ============
// Component with hooks (should get 'use client')
import { useState, useEffect } from 'react';
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // [NeuroLint] Removed console.log: 'mounted'
    ;
  }, []);
  return <Button onClick={() => setCount(count + 1)} aria-label="Button" variant="default">{count}</Button>;
}

// ReactDOM.render (should convert to createRoot) - Bug #2 test
import ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from "react-dom/client";
const root = createRoot(typeof document !== "undefined" ? document.getElementById('root1') : null);
root.render(<div>App 1</div>);
const root1 = createRoot(typeof document !== "undefined" ? document.getElementById('root2') : null);
root1.render(<div>App 2</div>);
const root2 = createRoot(typeof document !== "undefined" ? document.getElementById('root3') : null);
root2.render(<div>App 3</div>); // ReactDOM.hydrate (should convert to hydrateRoot)
hydrateRoot(typeof document !== "undefined" ? document.getElementById('app') : null, <div>SSR App</div>);

// ============ LAYER 6: Testing Fixes ============

// Component that should get test file suggestion
export function Calculator({
  a,
  b
}) {
  return <div>{a + b}</div>;
}

// ============ LAYER 7: Adaptive Learning ============

// Patterns that adaptive layer should learn from
// [NeuroLint] Removed console.log: 'adaptive test'
;
const inlineStyle = <div style={{
  color: 'red'
}}>Styled</div>;
export default Counter;