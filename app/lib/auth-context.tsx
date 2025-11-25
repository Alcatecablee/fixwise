"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import logger from "./client-logger";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  emailConfirmed: boolean;
  createdAt?: string;
  trialPlan?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  trialUsed?: boolean;
  isOnTrial?: boolean;
  trialDaysRemaining?: number;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // During SSR or build time, return safe defaults instead of throwing
    if (typeof window === "undefined") {
      return {
        user: null,
        session: null,
        loading: true,
        signIn: async () => {},
        signUp: async () => {},
        signOut: async () => {},
        updateProfile: async () => {}
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem("neurolint-supabase-auth");
      localStorage.removeItem("supabase_session");
      localStorage.removeItem("user_data");
      setUser(null);
      setSession(null);
    } catch (error) {
      // Still clear state even if localStorage fails
      setUser(null);
      setSession(null);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return;
      }

      const savedSession = localStorage.getItem("neurolint-supabase-auth");

      if (savedSession) {
        let sessionData;
        try {
          sessionData = JSON.parse(savedSession);
        } catch (e) {
          console.error("Invalid session data in localStorage");
          clearSession();
          return;
        }

        // Check if session has expired, considering remember me preference
        const now = Date.now();
        const sessionExpired = sessionData.expires_at && sessionData.expires_at * 1000 < now;
        const rememberMeExpired = sessionData.persistUntil && sessionData.persistUntil < now;

        if (sessionExpired || rememberMeExpired) {
          logger.auth(sessionExpired ? "Session expired" : "Remember me period expired");
          clearSession();
          return;
        }

        // Validate session structure
        if (!sessionData.access_token || !sessionData.refresh_token) {
          console.error("Invalid session structure");
          clearSession();
          return;
        }

        // Verify session is still valid with server
        try {
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${sessionData.access_token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            try {
              // Use cloned response to avoid "body stream already read" errors
              const responseClone = response.clone();
              const userData = await responseClone.json();

              const { user: currentUser } = userData;

              // Additional validation on user data
              if (currentUser && currentUser.id && currentUser.email) {
                logger.auth("Setting user and session");
                setUser(currentUser);
                setSession(sessionData);
              } else {
                console.error("Invalid user data received", currentUser);
                clearSession();
              }
            } catch (jsonError) {
              console.error("Failed to parse user data:", jsonError);
              clearSession();
            }
          } else if (response.status === 401) {
            // Session invalid, try to refresh or clear
            logger.auth("Session invalid, clearing storage");
            clearSession();
          } else {
            console.error("Session validation failed:", response.status);
            clearSession();
          }
        } catch (fetchError) {
          console.warn("Session validation network error:", fetchError);

          // Check if it's a network/timeout error
          const isNetworkError =
            fetchError instanceof TypeError &&
            (fetchError.message.includes("fetch") ||
              fetchError.message.includes("Failed to fetch") ||
              fetchError.name === "AbortError");

          if (
            isNetworkError &&
            sessionData.access_token &&
            sessionData.refresh_token
          ) {
            logger.auth("Using cached session due to network error");
            // Try to get cached user data
            const cachedUserData = localStorage.getItem("user_data");
            if (cachedUserData) {
              try {
                const userData = JSON.parse(cachedUserData);
                if (userData && userData.id && userData.email) {
                  setUser(userData);
                  setSession(sessionData);

                  // Schedule a retry in 30 seconds
                  setTimeout(() => {
                    logger.auth("Retrying session validation");
                    checkSession();
                  }, 30000);

                  return; // Exit early with cached data
                }
              } catch (e) {
                console.error("Invalid cached user data");
              }
            }
          }

          // If we can't use cached data or it's not a network error, clear session
          clearSession();
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);

      // Only clear session if it's not a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn(
          "Network error during session check, will retry on next page load",
        );
        // Don't clear session for network errors - user might be offline
      } else {
        clearSession();
      }
    } finally {
              logger.auth("checkSession setting loading to false");
      setLoading(false);
    }
  }, [clearSession]); // Include clearSession in dependencies

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      console.warn("[AUTH] Forcing loading state to false after 15 seconds");
      setLoading(false);
    }, 15000);

    return () => clearTimeout(fallbackTimeout);
  }, [checkSession]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    try {
      // Input validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      let data;

      try {
        // Use only one method to read the response body
        if (response.headers.get('content-type')?.includes('application/json')) {
          data = await response.json();
        } else {
          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch {
            console.error("Response text:", responseText);
            throw new Error("Server returned invalid response");
          }
        }
      } catch (error) {
        console.error("Failed to parse login response:", error);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Validate response data
      if (!data.session?.access_token || !data.user?.id) {
        throw new Error("Invalid response from server");
      }

      try {
        // Store session with remember me metadata
        const sessionWithMeta = {
          ...data.session,
          rememberMe,
          persistUntil: rememberMe ? Date.now() + (30 * 24 * 60 * 60 * 1000) : undefined // 30 days
        };
        localStorage.setItem("neurolint-supabase-auth", JSON.stringify(sessionWithMeta));
        localStorage.setItem("user_data", JSON.stringify(data.user));
        setUser(data.user);
        setSession(data.session);

        // Note: We avoid setting session directly here to prevent refresh token conflicts
        // The supabase client will be initialized from localStorage when needed
      } catch (storageError) {
        console.error("Failed to save session to localStorage:", storageError);
        // Still set state even if localStorage fails
        setUser(data.user);
        setSession(data.session);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      let data;

      try {
        // Use only one method to read the response body
        if (response.headers.get('content-type')?.includes('application/json')) {
          data = await response.json();
        } else {
          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch {
            console.error("Signup response text:", responseText);
            throw new Error("Server returned invalid response");
          }
        }
      } catch (error) {
        console.error("Failed to parse signup response:", error);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (data.session?.access_token) {
        localStorage.setItem("neurolint-supabase-auth", JSON.stringify(data.session));
        localStorage.setItem("user_data", JSON.stringify(data.user));
        setUser(data.user);
        setSession(data.session);

        // Note: We avoid setting session directly here to prevent refresh token conflicts
        // The supabase client will be initialized from localStorage when needed
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (session?.access_token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearSession();

      // Clear session from centralized Supabase client
      if (typeof window !== "undefined") {
        try {
          const { supabase } = await import("../lib/supabase-client");
          await supabase.auth.signOut({ scope: "local" }); // Only sign out locally to avoid API call issues
          logger.auth("Supabase session cleared after logout");
        } catch (error) {
          console.error("Error clearing Supabase session:", error);
          // Don't throw - logout should always succeed locally
        }
      }

      setLoading(false);
      router.push("/");
    }
  };

  const updateProfile = async (firstName: string, lastName: string) => {
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch("/api/auth/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ firstName, lastName }),
    });

    let data;

    try {
      // Use only one method to read the response body
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      } else {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Profile update response text:", responseText);
          throw new Error("Server returned invalid response");
        }
      }
    } catch (error) {
      console.error("Failed to parse profile update response:", error);
      throw new Error("Server returned invalid response");
    }

    if (!response.ok) {
      throw new Error(data.error || "Profile update failed");
    }

    setUser(data.user);
    localStorage.setItem("user_data", JSON.stringify(data.user));
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  // Always provide context, but with safe defaults when not mounted
  const contextValue = mounted
    ? value
    : {
        user: null,
        session: null,
        loading: true,
        signIn: async () => {},
        signUp: async () => {},
        signOut: async () => {},
        updateProfile: async () => {},
      };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
