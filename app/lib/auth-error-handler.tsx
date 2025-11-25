"use client";

import { useEffect } from "react";

export function AuthErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (common with auth errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      if (error && typeof error === "object") {
        const errorMessage = error.message || error.toString();

        // Check if it's a Supabase auth error
        if (
          errorMessage.includes("Invalid Refresh Token") ||
          errorMessage.includes("Already Used") ||
          errorMessage.includes("AuthApiError") ||
          error.name === "AuthApiError"
        ) {
          console.warn("Caught auth error in global handler:", errorMessage);

          // Prevent the error from showing in console
          event.preventDefault();

          // Clear auth storage
          try {
            localStorage.removeItem("supabase_session");
            localStorage.removeItem("user_data");
          } catch (e) {
            console.error("Error clearing auth storage:", e);
          }

          // Optionally, you could show a user-friendly notification here
          // or redirect to login page
        }
      }
    };

    // Handle regular errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error;

      if (error && typeof error === "object") {
        const errorMessage = error.message || error.toString();

        if (
          errorMessage.includes("Invalid Refresh Token") ||
          errorMessage.includes("Already Used") ||
          errorMessage.includes("AuthApiError")
        ) {
          console.warn("Caught auth error in error handler:", errorMessage);

          // Clear auth storage
          try {
            localStorage.removeItem("supabase_session");
            localStorage.removeItem("user_data");
          } catch (e) {
            console.error("Error clearing auth storage:", e);
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}

export default AuthErrorHandler;
