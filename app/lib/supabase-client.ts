import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throw error in runtime, not during build
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error("Missing Supabase environment variables");
}

// Create a singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    // Only create client if we have valid environment variables
    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true, // Re-enable auto refresh
          persistSession: true, // Re-enable persistence
          detectSessionInUrl: false, // Keep this disabled to avoid conflicts
          storageKey: 'neurolint-supabase-auth', // Use unique storage key
        },
      });
    } else {
      // Return a mock client for build time
      supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }
  }
  return supabaseInstance;
})();

// Track if token refresh is in progress to prevent race conditions
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Helper function to safely set session with refresh token conflict prevention
export async function setSupabaseSession(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedSessionStr = localStorage.getItem("neurolint-supabase-auth");
    if (!storedSessionStr) {
      return false;
    }

    const storedSession = JSON.parse(storedSessionStr);

    // Check if session is not expired (with 5 minute buffer)
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (
      storedSession.expires_at &&
      storedSession.expires_at * 1000 <= Date.now() + expirationBuffer
    ) {
      // If already refreshing, wait for that operation
      if (isRefreshing && refreshPromise) {
        return await refreshPromise;
      }

      // Start refresh process
      isRefreshing = true;
      refreshPromise = refreshToken(storedSession.refresh_token);

      try {
        const refreshResult = await refreshPromise;
        return refreshResult;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    // Set the session on Supabase client (only if not expired)
    const { error } = await supabase.auth.setSession({
      access_token: storedSession.access_token,
      refresh_token: storedSession.refresh_token,
    });

    if (error) {
      // If error is about invalid refresh token, clear storage and try refresh
      if (
        error.message.includes("Invalid Refresh Token") ||
        error.message.includes("Already Used")
      ) {
        clearAuthStorage();
        return false;
      }

      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to refresh tokens safely
async function refreshToken(refreshToken: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      // Handle specific refresh token errors
      if (
        error.message.includes("Invalid Refresh Token") ||
        error.message.includes("Already Used") ||
        error.message.includes("refresh_token_not_found")
      ) {
        clearAuthStorage();
      }
      return false;
    }

    if (data.session) {
      return true;
    }

    return false;
  } catch (error) {
    clearAuthStorage();
    return false;
  }
}

// Helper function to safely clear auth storage
function clearAuthStorage() {
  try {
    localStorage.removeItem("neurolint-supabase-auth");
    localStorage.removeItem("supabase_session");
    localStorage.removeItem("user_data");
  } catch (error) {
    // Ignore localStorage errors
  }
}

// Safe session initialization that avoids conflicts
export async function initializeSession(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedSessionStr = localStorage.getItem("neurolint-supabase-auth");
    if (!storedSessionStr) {
      return false;
    }

    const storedSession = JSON.parse(storedSessionStr);

    // Only initialize if we have valid tokens and session isn't expired
    if (storedSession.access_token && storedSession.refresh_token) {
      const expirationBuffer = 5 * 60 * 1000; // 5 minutes buffer
      const isExpiringSoon =
        storedSession.expires_at &&
        storedSession.expires_at * 1000 <= Date.now() + expirationBuffer;

      if (!isExpiringSoon) {
        // Session is still valid, use it
        return await setSupabaseSession();
      } else {
        // Session is expiring soon, trigger refresh
        return true; // Return true but let API calls handle refresh
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to get authenticated user
export async function getAuthenticatedUser() {
  // Initialize session if needed
  await initializeSession();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper function to ensure authentication before DB operations
export async function ensureAuthenticated(
  expectedUserId?: string,
): Promise<boolean> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return false;
  }

  if (expectedUserId && user.id !== expectedUserId) {
    return false;
  }

  return true;
}

export default supabase;
