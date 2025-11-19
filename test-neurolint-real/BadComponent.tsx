import React from 'react';
import { useState } from 'react';

function BadComponent() {
  const [count, setCount] = useState(0);
  const theme = localStorage.getItem('theme');
  // [NeuroLint] Removed console.log: 'Rendering component'
  
  const items = ['item1', 'item2', 'item3'];
  
  return (
    <div>
      <h1>"Hello World"</h1>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
      <img src="/logo.png" />
      <div>Window width: {window.innerWidth}</div>
      {items.map(item => (
        <div>{item}</div>
      ))}
    </div>
  );
}

export default BadComponent;
