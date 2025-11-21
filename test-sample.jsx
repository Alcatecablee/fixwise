import React from 'react';

export default function TestComponent() {
  const items = ['one', 'two', 'three'];

  return (
    <div>
      {items.map((item) =>
      <div key={item.id || item}>{item}</div>
      )}
    </div>);

}