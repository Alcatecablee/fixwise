"use client";

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Test 1: Aliased hooks
import { createRoot, hydrateRoot } from "react-dom/client";
const {
  useState: useCount
} = React;

// Test 2: React.useEffect namespace call
function Component() {
  const [count, setCount] = useCount(0);
  React.useEffect(() => {}, []);
  return <div>{count}</div>;
}

// Test 3: Multiple ReactDOM conversions
const root = createRoot(typeof document !== "undefined" ? document.getElementById('root') : null);
root.render(<App />);
hydrateRoot(typeof document !== "undefined" ? document.getElementById('app') : null, <Component />);