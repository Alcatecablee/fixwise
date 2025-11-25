"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "./auth-context";

interface ConditionalAuthWrapperProps {
  children: React.ReactNode;
}

export function ConditionalAuthWrapper({
  children,
}: ConditionalAuthWrapperProps) {
  const pathname = usePathname();

  // Pages that don't need authentication context
  const noAuthPages = ["/docs"];

  // Check if current path should skip auth
  const shouldSkipAuth = noAuthPages.some((path) => pathname?.startsWith(path));

  if (shouldSkipAuth) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
