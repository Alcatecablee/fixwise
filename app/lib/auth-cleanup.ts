/**
 * Utility function to manually clean up expired or invalid auth sessions
 * This can be called when the app detects auth issues
 */

export function cleanupAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    console.log("Cleaning up auth session...");

    // Remove auth-related localStorage items
    localStorage.removeItem("supabase_session");
    localStorage.removeItem("user_data");

    // Clear any other auth-related storage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("supabase") || key.includes("auth"))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("Auth session cleanup completed");

    // Optionally reload the page to ensure clean state
    // window.location.reload();
  } catch (error) {
    console.error("Error during auth cleanup:", error);
  }
}

export function checkAndCleanupExpiredSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedSessionStr = localStorage.getItem("supabase_session");
    if (!storedSessionStr) {
      return false;
    }

    const storedSession = JSON.parse(storedSessionStr);

    // Check if session has expired
    if (
      storedSession.expires_at &&
      storedSession.expires_at * 1000 <= Date.now()
    ) {
      console.log("Session has expired, cleaning up...");
      cleanupAuthSession();
      return true; // Session was expired and cleaned
    }

    return false; // Session is still valid
  } catch (error) {
    console.error("Error checking session expiration:", error);
    cleanupAuthSession(); // Clean up on error
    return true;
  }
}

export default { cleanupAuthSession, checkAndCleanupExpiredSession };
