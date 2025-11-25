import React from 'react';
import {  Provider  } from "react-redux";
import {  store  } from "@/store/store";
import {  ThemeProvider  } from "./ThemeProvider";

interface RootLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>);

}

export default RootLayout;