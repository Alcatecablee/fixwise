import React from 'react';

// This component has multiple issues that NeuroLint should detect:
// - Missing keys in map
// - console.log statements
// - Hydration issues (localStorage access)
// - Missing prop types

export default function BadComponent({ items }) {
  console.log('Component rendering', items);
  
  // Hydration issue - accessing localStorage without checking
  const savedData = localStorage.getItem('data');
  
  return (
    <div>
      <h1>Bad Component Example</h1>
      {items.map(item => (
        <div>
          <span>{item.name}</span>
        </div>
      ))}
      
      {items.map((item, index) => {
        console.log('Rendering item:', item);
        return (
          <li>
            {item.title}
          </li>
        );
      })}
      
      <p>Saved data: {savedData}</p>
    </div>
  );
}
