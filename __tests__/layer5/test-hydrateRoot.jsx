import { hydrateRoot } from 'react-dom/client';
"use client";

import ReactDOM from 'react-dom';
import App from './App';
hydrateRoot(typeof document !== "undefined" ? document.getElementById('root') : null, <App />);