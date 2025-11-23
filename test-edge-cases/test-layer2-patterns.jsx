// Layer 2 Test: Pattern Fixes

import React from 'react';

// Bug #1: Console.log in arrow functions (CRITICAL TEST)
const handler1 = () => {} /* [NeuroLint] Removed console.log: 'test'*/;
const handler2 = value => {} /* [NeuroLint] Removed console.log: value*/;
const handler3 = (a, b) => {} /* [NeuroLint] Removed console.log: a, b*/;
const handler4 = ({
  name
}) => {} /* [NeuroLint] Removed console.log: name*/;

// Console variants
// [NeuroLint] Removed console.log: 'regular'
;
// [NeuroLint] Removed console.info: 'info'
;
// [NeuroLint] Removed console.warn: 'warning'
;
// [NeuroLint] Removed console.error: 'error'
;
// [NeuroLint] Removed console.debug: 'debug'
; // Alert/Confirm/Prompt
// [NeuroLint] Replace with toast notification: 'Hello'
;
const confirmed = // [NeuroLint] Replace with dialog: 'Sure?'
undefined;
const name = // [NeuroLint] Replace with dialog: 'Name?'
undefined;

// createFactory pattern
const divFactory = (props) => <div {...props} />;
const spanFactory = (props) => <span {...props} />;
const buttonFactory = (props) => <button {...props} />;
export default handler1;