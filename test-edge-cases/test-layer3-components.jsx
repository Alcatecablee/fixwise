import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Layer 3 Test: Component Fixes

import React from 'react';

// Missing alt text
function ImageTest() {
  return <img src="photo.jpg" alt="Image" />;
}

// Missing key in map
function ListTest({
  items
}) {
  return <ul>
      {items.map(item => <li key={item.id || item}>{item}</li>)}
    </ul>;
}

// Missing aria-label
function ButtonTest() {
  return <Button aria-label="Button" variant="default">Click</Button>;
}

// Input without label
function InputTest() {
  return <Input type="text" />;
}
export { ImageTest, ListTest, ButtonTest, InputTest };