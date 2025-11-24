"use client";

// Layer 5 Test: ReactDOM.render to createRoot
import ReactDOM from 'react-dom';
import React from 'react';

// Bug #2: Multiple ReactDOM.render calls (CRITICAL TEST)
import { createRoot } from "react-dom/client";
const root = createRoot(typeof document !== "undefined" ? document.getElementById('root1') : null);
root.render(<div>App 1</div>);
const root1 = createRoot(typeof document !== "undefined" ? document.getElementById('root2') : null);
root1.render(<div>App 2</div>);
const root2 = createRoot(typeof document !== "undefined" ? document.getElementById('root3') : null);
root2.render(<div>App 3</div>);
export {};