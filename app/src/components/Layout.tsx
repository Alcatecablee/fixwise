import * as React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Layout = React.forwardRef<HTMLElement, LayoutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn('min-h-screen flex flex-col', className)}
        {...props}
      >
        {children}
      </main>
    );
  }
);

Layout.displayName = 'Layout'; 