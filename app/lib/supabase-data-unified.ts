import {
  supabase,
  ensureAuthenticated,
  setSupabaseSession,
} from "./supabase-client";

// Utility to safely handle responses that might be read multiple times
function createSafeResponse(response: any): any {
  if (!response || typeof response !== "object") {
    return response;
  }

  // If it's already a cloned or safe response, return as-is
  if (response._isSafeResponse) {
    return response;
  }

  // Create a safe wrapper that prevents multiple consumption
  const safeResponse = {
    ...response,
    _isSafeResponse: true,
    _consumed: false,

    async text() {
      if (this._consumed) {
        throw new Error(
          "Response body already consumed - safe response cannot be read multiple times",
        );
      }
      this._consumed = true;
      return response.text ? await response.text() : String(response);
    },

    async json() {
      if (this._consumed) {
        throw new Error(
          "Response body already consumed - safe response cannot be read multiple times",
        );
      }
      this._consumed = true;
      return response.json ? await response.json() : response;
    },
  };

  return safeResponse;
}

// Types for database objects
export interface AnalysisHistory {
  id: string;
  user_id: string;
  filename: string;
  timestamp: string;
  result: any;
  layers: number[];
  execution_time: number;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  files: string[];
  created_at: string;
  updated_at?: string;
  last_analyzed?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_layers: number[];
  auto_save: boolean;
  notifications: boolean;
  theme: "dark" | "light";
  created_at?: string;
  updated_at?: string;
}

// Ultra-safe Supabase error handler that completely avoids response body access
function safeSupabaseErrorHandler(error: any): {
  formattedError: string;
  isRetryable: boolean;
} {
  // Only access the most basic properties to prevent any response body consumption
  let formattedError = "Unknown error";
  let isRetryable = false;

  try {
    // Extract safe properties without deep object traversal
    if (error && typeof error === "object") {
      // Only access known safe properties
      const safeMessage = error.message;
      const safeCode = error.code;
      const safeStatus = error.status;

      if (safeMessage) {
        formattedError = `Error: ${safeMessage}`;
      } else if (safeCode) {
        formattedError = `Error code: ${safeCode}`;
      } else if (safeStatus) {
        formattedError = `Status: ${safeStatus}`;
      }

      // Determine retry-ability from basic properties only
      if (safeCode && typeof safeCode === "string") {
        isRetryable = [
          "ECONNRESET",
          "ENOTFOUND",
          "ETIMEDOUT",
          "ECONNREFUSED",
        ].includes(safeCode);
      } else if (safeStatus && typeof safeStatus === "number") {
        isRetryable = [408, 429, 500, 502, 503, 504].includes(safeStatus);
      }
    } else if (error instanceof Error) {
      formattedError = `${error.name}: ${error.message}`;
    } else {
      formattedError = String(error);
    }
  } catch (e) {
    // If even basic property access fails, use minimal fallback
    formattedError =
      "Error processing failed - potential response body consumption issue";
    isRetryable = false;
  }

  return { formattedError, isRetryable };
}

// Enhanced error formatting function
function formatError(error: any): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "object" && error !== null) {
    // Try to extract meaningful error information without consuming response bodies
    const errorObj: any = {};

    // Extract common Supabase/PostgREST error properties safely
    if (error.message) errorObj.message = error.message;
    if (error.details) errorObj.details = error.details;
    if (error.hint) errorObj.hint = error.hint;
    if (error.code) errorObj.code = error.code;
    if (error.status) errorObj.status = error.status;
    if (error.statusText) errorObj.statusText = error.statusText;

    // Handle PostgREST specific error structure
    if (error.error && typeof error.error === "object") {
      if (error.error.message) errorObj.message = error.error.message;
      if (error.error.details) errorObj.details = error.error.details;
      if (error.error.code) errorObj.code = error.error.code;
    }

    // If we have meaningful properties, format them nicely
    if (Object.keys(errorObj).length > 0) {
      return Object.entries(errorObj)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    }

    // Avoid trying to stringify objects that might contain response bodies
    // or other non-serializable properties
    if (error.constructor && error.constructor.name !== "Object") {
      return `[${error.constructor.name}]: ${error.toString ? error.toString() : "Unknown error"}`;
    }

    // Safe fallback for plain objects
    try {
      // Only stringify if it's a simple object without potential response bodies
      const safeKeys = Object.keys(error).filter(
        (key) =>
          typeof error[key] !== "function" &&
          !key.includes("body") &&
          !key.includes("stream") &&
          !key.includes("response"),
      );

      if (safeKeys.length > 0) {
        const safeError: any = {};
        safeKeys.forEach((key) => {
          safeError[key] = (error as any)[key];
        });
        return JSON.stringify(safeError, null, 2);
      }
    } catch {
      // If JSON.stringify fails, return a safe fallback
    }

    return "[Complex object - unable to safely stringify]";
  }

  return String(error);
}

// Helper function to get auth session
async function getAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Get session from Supabase auth
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("Error getting auth session:", formatError(error));
      return null;
    }

    return session;
  } catch (error) {
    console.warn("Failed to get auth session:", formatError(error));
    return null;
  }
}

// Helper function to create authenticated Supabase client
async function createAuthenticatedClient() {
  // Ensure we have a valid session set
  await setSupabaseSession();
  return supabase;
}

// Data service functions
export const dataService = {
  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      // Add additional safeguards for potential response consumption issues
      const client = await createAuthenticatedClient();

      // Use a timeout to prevent hanging requests that might cause stream issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      const queryPromise = client
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result || {};

      if (error) {
        // Extract only safe properties immediately to avoid any response body access
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === "PGRST116") {
          // No settings found, return default settings without logging error
          console.log(
            `No user settings found for user ${userId}, using defaults`,
          );
          return {
            id: "",
            user_id: userId,
            default_layers: [],
            auto_save: true,
            notifications: true,
            theme: "dark",
          };
        }

        // Handle 406 errors specifically (Not Acceptable - usually RLS or auth issues)
        if (errorCode === "406") {
          console.warn(
            `Supabase 406 error for user_settings: This might be due to RLS policies or missing table. Using defaults for user ${userId}`,
          );
          return {
            id: "",
            user_id: userId,
            default_layers: [],
            auto_save: true,
            notifications: true,
            theme: "dark",
          };
        }

        // Handle other database errors gracefully
        console.warn(
          `Database error fetching user settings for ${userId}: ${errorMessage}. Using defaults.`,
        );
        return {
          id: "",
          user_id: userId,
          default_layers: [],
          auto_save: true,
          notifications: true,
          theme: "dark",
        };
      }

      return data || {
        id: "",
        user_id: userId,
        default_layers: [],
        auto_save: true,
        notifications: true,
        theme: "dark",
      };
    } catch (error) {
      // Handle any other errors (network, timeout, etc.)
      console.warn(
        `Error fetching user settings for ${userId}: ${error}. Using defaults.`,
      );
      return {
        id: "",
        user_id: userId,
        default_layers: [],
        auto_save: true,
        notifications: true,
        theme: "dark",
      };
    }
  },

  async saveUserSettings(
    userId: string,
    settings: Omit<
      UserSettings,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ): Promise<UserSettings | null> {
    try {
      const client = await createAuthenticatedClient();
      const { data, error } = await client
        .from("user_settings")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Handle missing table error gracefully
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation "public.user_settings"'))) {
          console.warn("user_settings table does not exist. Settings not saved.");
          return {
            id: "",
            user_id: userId,
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        console.error("Error saving user settings:", formatError(error));
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in saveUserSettings:", formatError(error));
      return null;
    }
  },

  // Analysis History
  async saveAnalysisHistory(
    userId: string,
    analysisData: Omit<
      AnalysisHistory,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ): Promise<AnalysisHistory | null> {
    try {
      const client = await createAuthenticatedClient();

      const { data, error } = await client
        .from("analysis_history")
        .insert({
          user_id: userId,
          ...analysisData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving analysis history:", formatError(error));
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in saveAnalysisHistory:", formatError(error));
      return null;
    }
  },

  async getAnalysisHistory(
    userId: string,
    limit = 50,
  ): Promise<AnalysisHistory[]> {
    try {
      const client = await createAuthenticatedClient();
      const { data, error } = await client
        .from("analysis_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching analysis history:", formatError(error));
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAnalysisHistory:", formatError(error));
      return [];
    }
  },

  async deleteAnalysisHistory(
    userId: string,
    historyId: string,
  ): Promise<boolean> {
    try {
      const client = await createAuthenticatedClient();
      const { error } = await client
        .from("analysis_history")
        .delete()
        .eq("id", historyId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting analysis history:", formatError(error));
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteAnalysisHistory:", formatError(error));
      return false;
    }
  },

  async clearAnalysisHistory(userId: string): Promise<boolean> {
    try {
      const client = await createAuthenticatedClient();
      const { error } = await client
        .from("analysis_history")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error clearing analysis history:", formatError(error));
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in clearAnalysisHistory:", formatError(error));
      return false;
    }
  },

  // Projects
  async saveProject(
    userId: string,
    projectData: Omit<Project, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<Project | null> {
    try {
      // Ensure user is authenticated
      const isAuthenticated = await ensureAuthenticated(userId);
      if (!isAuthenticated) {
        console.error("User authentication failed for saveProject");
        return null;
      }

      const client = await createAuthenticatedClient();

      console.log("Attempting to save project for user:", userId);
      const { data, error } = await client
        .from("projects")
        .insert({
          user_id: userId,
          ...projectData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving project:", formatError(error));
        return null;
      }

      console.log("Project saved successfully:", data.id);
      return data;
    } catch (error) {
      console.error("Error in saveProject:", formatError(error));
      return null;
    }
  },

  async getProjects(userId: string): Promise<Project[]> {
    try {
      const client = await createAuthenticatedClient();
      const { data, error } = await client
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", formatError(error));
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getProjects:", formatError(error));
      return [];
    }
  },

  async updateProject(
    userId: string,
    projectId: string,
    updates: Partial<Omit<Project, "id" | "user_id" | "created_at">>,
  ): Promise<Project | null> {
    try {
      const client = await createAuthenticatedClient();
      const { data, error } = await client
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating project:", formatError(error));
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in updateProject:", formatError(error));
      return null;
    }
  },

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const client = await createAuthenticatedClient();
      const { error } = await client
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting project:", formatError(error));
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteProject:", formatError(error));
      return false;
    }
  },

  // Hybrid approach: try Supabase first, fallback to localStorage
  async saveAnalysisHistoryHybrid(
    userId: string | null,
    analysisData: Omit<
      AnalysisHistory,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ): Promise<void> {
    // Always save to localStorage for immediate access
    try {
      if (typeof window !== "undefined") {
        const localHistory = JSON.parse(
          localStorage.getItem("neurolint-history") || "[]",
        );
        const newItem = {
          id: Date.now().toString(),
          ...analysisData,
          timestamp: analysisData.timestamp || new Date().toISOString(),
        };
        const updatedHistory = [newItem, ...localHistory].slice(0, 50);
        localStorage.setItem(
          "neurolint-history",
          JSON.stringify(updatedHistory),
        );
      }
    } catch (error) {
      console.error("Error saving to localStorage:", formatError(error));
    }

    // If user is authenticated, also save to Supabase
    if (userId) {
      try {
        const result = await this.saveAnalysisHistory(userId, analysisData);
        if (result) {
          console.log("Successfully saved analysis history to Supabase");
        }
      } catch (error) {
        console.error("Error saving to Supabase:", formatError(error));
      }
    }
  },

  async getAnalysisHistoryHybrid(userId: string | null): Promise<any[]> {
    // If user is authenticated, try Supabase first
    if (userId) {
      try {
        const supabaseHistory = await this.getAnalysisHistory(userId);
        if (supabaseHistory.length > 0) {
          // Also update localStorage with Supabase data
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "neurolint-history",
                JSON.stringify(supabaseHistory),
              );
            }
          } catch (error) {
            console.error("Error updating localStorage:", formatError(error));
          }
          return supabaseHistory;
        }
      } catch (error) {
        console.error(
          "Error fetching from Supabase, falling back to localStorage:",
          formatError(error),
        );
      }
    }

    // Fallback to localStorage
    try {
      if (typeof window !== "undefined") {
        const localHistory = JSON.parse(
          localStorage.getItem("neurolint-history") || "[]",
        );
        return localHistory;
      }
      return [];
    } catch (error) {
      console.error("Error reading from localStorage:", formatError(error));
      return [];
    }
  },
};

export default dataService;
