import crypto from "crypto";
import { supabase } from "./supabase-client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create a service role client for API key validation
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ApiKey {
  id: string;
  key?: string; // Only returned during creation
  name: string;
  userId: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
  usageCount: number;
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  keyPreview?: string; // For display purposes
}

export const generateApiKey = (): string => {
  const prefix = "nlp_";
  const key = crypto.randomBytes(32).toString("hex");
  return prefix + key;
};

// Hash API key for secure storage
const hashApiKey = (key: string): string => {
  return crypto.createHash("sha256").update(key).digest("hex");
};

// Get API key prefix for display
const getKeyPrefix = (key: string): string => {
  return key.substring(0, 12);
};

// Database operations for API keys
export const apiKeyService = {
    // Create new API key
    async create(
    data: {
      name: string;
      userId: string;
      permissions?: string[];
      expiresInDays?: number;
      rateLimit?: { requestsPerHour: number; requestsPerDay: number };
    },
    authenticatedClient?: SupabaseClient
  ): Promise<{ apiKey: ApiKey; key: string }> {
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(data.userId)) {
      throw new Error("Invalid user ID format. API keys require authenticated users.");
    }

    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const client = authenticatedClient || supabase;
    const { data: result, error } = await client
      .from('api_keys')
      .insert({
        user_id: data.userId,
        name: data.name,
        key_hash: keyHash,
        permissions: data.permissions || ['analyze', 'projects'],
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    const apiKey: ApiKey = {
      id: result.id,
      name: result.name,
      userId: result.user_id,
      permissions: result.permissions || ['analyze', 'projects'],
      createdAt: result.created_at,
      lastUsed: result.last_used,
      expiresAt: result.expires_at,
      isActive: result.is_active,
      usageCount: 0, // Would need a separate table to track usage
      rateLimit: {
        requestsPerHour: data.rateLimit?.requestsPerHour || 100,
        requestsPerDay: data.rateLimit?.requestsPerDay || 1000,
      },
    };

    return { apiKey, key };
  },

      // Get all API keys for a user
  async getByUserId(userId: string, authenticatedClient?: SupabaseClient): Promise<ApiKey[]> {
    const client = authenticatedClient || supabase;
    const { data, error } = await client
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      permissions: row.permissions || ['analyze', 'projects'], // Use stored permissions or default
      createdAt: row.created_at,
      lastUsed: row.last_used,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      usageCount: 0, // Would need a separate table to track usage
      rateLimit: {
        requestsPerHour: 100, // Default rate limit
        requestsPerDay: 1000, // Default rate limit
      },
      keyPreview: row.key_hash.substring(0, 8) + "..." + "****",
    }));
  },

      // Update API key
  async update(keyId: string, userId: string, updates: Partial<ApiKey>, authenticatedClient?: SupabaseClient): Promise<ApiKey> {
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(userId)) {
      throw new Error("Invalid user ID format. API keys require authenticated users.");
    }

    const client = authenticatedClient || supabase;
    const { data, error } = await client
      .from('api_keys')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
        ...(updates.permissions && { permissions: updates.permissions }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      permissions: data.permissions || ['analyze', 'projects'],
      createdAt: data.created_at,
      lastUsed: data.last_used,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      usageCount: 0,
      rateLimit: {
        requestsPerHour: 100, // Default rate limit
        requestsPerDay: 1000, // Default rate limit
      },
      keyPreview: data.key_hash.substring(0, 8) + "..." + "****",
    };
  },

      // Delete API key
  async delete(keyId: string, userId: string, authenticatedClient?: SupabaseClient): Promise<void> {
    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(userId)) {
      throw new Error("Invalid user ID format. API keys require authenticated users.");
    }

        const client = authenticatedClient || supabase;
    const { error } = await client
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  },

  // Validate API key (for authentication)
  async validate(key: string): Promise<ApiKey | null> {
    const keyHash = hashApiKey(key);

    // Use service role client for API key validation
    const { data, error } = await supabaseService
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Update last_used timestamp using service role client
    await supabaseService
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', data.id);

    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      permissions: data.permissions || ['analyze', 'projects'],
      createdAt: data.created_at,
      lastUsed: data.last_used,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      usageCount: 0,
      rateLimit: {
        requestsPerHour: 100, // Default rate limit
        requestsPerDay: 1000, // Default rate limit
      },
    };
  },
};

// Legacy function for backward compatibility
export const validateApiKey = async (key: string): Promise<ApiKey | null> => {
  return await apiKeyService.validate(key);
};
