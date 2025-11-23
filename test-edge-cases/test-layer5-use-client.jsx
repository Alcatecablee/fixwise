"use client";

import { Button } from "@/components/ui/button";
// Layer 5 Test: 'use client' directive

import { useState, useEffect, useCallback } from 'react';
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // [NeuroLint] Removed console.log: 'mounted'
    ;
  }, []);
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  return <Button onClick={increment} aria-label="Button" variant="default">{count}</Button>;
}
export default Counter;