'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface ThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (root) {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      }
    }
  }, [theme]);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}

export default ThemeProvider;