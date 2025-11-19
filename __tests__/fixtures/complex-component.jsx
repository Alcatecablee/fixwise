import React from 'react';

// Component with multiple issues for comprehensive testing
const ComplexComponent = ({ items, title }) => {
  // Issue: Direct window access without SSR guard
  const width = window.innerWidth;

  // Issue: localStorage without hydration check
  const savedData = localStorage.getItem('data');

  // Issue: console.log should be removed
  console.log('Rendering ComplexComponent');

  // Issue: Missing keys in map
  return (
    <div>
      <h1>{title}</h1>
      <ul>
        {items.map(item => (
          <li>{item.name}</li>
        ))}
      </ul>
      <div style={{ width: width }}>
        Responsive content
      </div>
    </div>
  );
};

export default ComplexComponent;
