import { createRoot } from 'react-dom/client';
"use client";

import ReactDOM from 'react-dom';
import App from './App';
const root = createRoot(typeof document !== "undefined" ? document.getElementById('root') : null);
root.render(<App />);