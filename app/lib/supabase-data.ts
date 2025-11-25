import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

// Helper function to safely format error messages
function safeLogError(error: any, prefix: string): void {
  if (error instanceof Error) {
    console.error(prefix, error.message);
    return;
  }

  if (typeof error === "object" && error !== null) {
    // Extract error details safely
    const errorDetails: any = {};

    // Common error properties
    if (typeof error.message === "string") errorDetails.message = error.message;
    if (typeof error.code === "string") errorDetails.code = error.code;
    if (typeof error.details === "string") errorDetails.details = error.details;
    if (typeof error.hint === "string") errorDetails.hint = error.hint;
    if (typeof error.status === "number") errorDetails.status = error.status;
    if (typeof error.statusText === "string")
      errorDetails.statusText = error.statusText;

    // Try to extract all enumerable properties
    try {
      const keys = Object.keys(error);
      for (const key of keys) {
        if (
          !errorDetails[key] &&
          typeof error[key] !== "function" &&
          typeof error[key] !== "object"
        ) {
          errorDetails[key] = error[key];
        }
      }
    } catch (e) {
      // Ignore errors in property extraction
    }

    // If still no useful properties, try toString or constructor name
    if (Object.keys(errorDetails).length === 0) {
      try {
        if (error.toString && typeof error.toString === "function") {
          const stringValue = error.toString();
          if (stringValue !== "[object Object]") {
            errorDetails.toString = stringValue;
          }
        }
        if (error.constructor && error.constructor.name) {
          errorDetails.type = error.constructor.name;
        }
        // Last resort: try JSON.stringify with replacer
        if (Object.keys(errorDetails).length === 0) {
          errorDetails.raw = JSON.stringify(error, (key, value) => {
            if (typeof value === "function") return "[Function]";
            if (typeof value === "object" && value !== null && key !== "")
              return "[Object]";
            return value;
          });
        }
      } catch {
        errorDetails.raw = "[Unable to serialize error]";
      }
    }

    console.error(prefix, errorDetails);
    return;
  }

  console.error(prefix, String(error));
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = localStorage.getItem("supabase_session");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.access_token;
    }
  } catch (error) {
    console.warn("Failed to get auth token from localStorage:", error);
  }

  return null;
}

// Helper function to create authenticated Supabase client
function createAuthenticatedClient() {
  const token = getAuthToken();

  if (!token) {
    console.warn("No auth token found - operations may fail due to RLS");
    return supabase;
  }

  // Set the auth header for this request
  const client = createClient(supabaseUrl!, supabaseKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return client;
}

// Data service functions
export const dataService = {
  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const client = createAuthenticatedClient();
      const { data, error } = await client
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          // No settings found, return default settings
          return {
            id: "",
            user_id: userId,
            default_layers: [],
            auto_save: true,
            notifications: true,
            theme: "dark",
          };
        }
        safeLogError(error, "Error fetching user settings:");
        return null;
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
      safeLogError(error, "Error in getUserSettings:");
      return null;
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
      const client = createAuthenticatedClient();
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
        safeLogError(error, "Error saving user settings:");
        return null;
      }

      return data;
    } catch (error) {
      safeLogError(error, "Error in saveUserSettings:");
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
      const client = createAuthenticatedClient();

      const { data, error } = await client
        .from("analysis_history")
        .insert({
          user_id: userId,
          ...analysisData,
        })
        .select()
        .single();

      if (error) {
        safeLogError(error, "Error saving analysis history:");
        return null;
      }

      return data;
    } catch (error) {
      safeLogError(error, "Error in saveAnalysisHistory:");
      return null;
    }
  },

  async getAnalysisHistory(
    userId: string,
    limit = 50,
  ): Promise<AnalysisHistory[]> {
    try {
      const client = createAuthenticatedClient();
      const { data, error } = await client
        .from("analysis_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        safeLogError(error, "Error fetching analysis history:");
        return [];
      }

      return data || [];
    } catch (error) {
      safeLogError(error, "Error in getAnalysisHistory:");
      return [];
    }
  },

  async deleteAnalysisHistory(
    userId: string,
    historyId: string,
  ): Promise<boolean> {
    try {
      const client = createAuthenticatedClient();
      const { error } = await client
        .from("analysis_history")
        .delete()
        .eq("id", historyId)
        .eq("user_id", userId);

      if (error) {
        safeLogError(error, "Error deleting analysis history:");
        return false;
      }

      return true;
    } catch (error) {
      safeLogError(error, "Error in deleteAnalysisHistory:");
      return false;
    }
  },

  async clearAnalysisHistory(userId: string): Promise<boolean> {
    try {
      const client = createAuthenticatedClient();
      const { error } = await client
        .from("analysis_history")
        .delete()
        .eq("user_id", userId);

      if (error) {
        safeLogError(error, "Error clearing analysis history:");
        return false;
      }

      return true;
    } catch (error) {
      safeLogError(error, "Error in clearAnalysisHistory:");
      return false;
    }
  },

  // Projects
  async saveProject(
    userId: string,
    projectData: Omit<Project, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<Project | null> {
    try {
      const token = getAuthToken();

      if (!token) {
        console.error("No authentication token found for project creation");
        return null;
      }

      console.log(
        "Creating project with authenticated user - token exists:",
        !!token,
      );

      const client = createAuthenticatedClient();

      const { data, error } = await client
        .from("projects")
        .insert({
          user_id: userId,
          ...projectData,
        })
        .select()
        .single();

      if (error) {
        safeLogError(error, "Error saving project:");
        return null;
      }

      return data;
    } catch (error) {
      safeLogError(error, "Error in saveProject:");
      return null;
    }
  },

  async getProjects(userId: string): Promise<Project[]> {
    try {
      const client = createAuthenticatedClient();
      const { data, error } = await client
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        safeLogError(error, "Error fetching projects:");
        return [];
      }

      return data || [];
    } catch (error) {
      safeLogError(error, "Error in getProjects:");
      return [];
    }
  },

  async updateProject(
    userId: string,
    projectId: string,
    updates: Partial<Omit<Project, "id" | "user_id" | "created_at">>,
  ): Promise<Project | null> {
    try {
      const client = createAuthenticatedClient();
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
        safeLogError(error, "Error updating project:");
        return null;
      }

      return data;
    } catch (error) {
      safeLogError(error, "Error in updateProject:");
      return null;
    }
  },

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const client = createAuthenticatedClient();
      const { error } = await client
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", userId);

      if (error) {
        safeLogError(error, "Error deleting project:");
        return false;
      }

      return true;
    } catch (error) {
      safeLogError(error, "Error in deleteProject:");
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
      safeLogError(error, "Error saving to localStorage:");
    }

    // If user is authenticated, also save to Supabase
    if (userId) {
      try {
        const result = await this.saveAnalysisHistory(userId, analysisData);
        if (result) {
          console.log("Successfully saved analysis history to Supabase");
        }
      } catch (error) {
        safeLogError(error, "Error saving to Supabase:");
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
            safeLogError(error, "Error updating localStorage:");
          }
          return supabaseHistory;
        }
      } catch (error) {
        safeLogError(
          error,
          "Error fetching from Supabase, falling back to localStorage:",
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
      safeLogError(error, "Error reading from localStorage:");
      return [];
    }
  },
};

export default dataService;
