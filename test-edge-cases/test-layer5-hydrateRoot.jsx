"use client";

// Layer 5 Test: ReactDOM.hydrate to hydrateRoot

import ReactDOM from 'react-dom';
import React from 'react';

// Should convert to hydrateRoot with correct parameter order
import { hydrateRoot } from "react-dom/client";
hydrateRoot(typeof document !== "undefined" ? document.getElementById('app') : null, <div>SSR App</div>);
export {};