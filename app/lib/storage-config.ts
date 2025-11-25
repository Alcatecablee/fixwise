/**
 * Storage Configuration Utility
 * Handles environment variables with STORAGE_URL prefix
 */

export const storageConfig = {
  // Database connection (Supabase URL)
  database:
    process.env.STORAGE_URL_DATABASE ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL,

  // Redis connection
  redis: process.env.STORAGE_URL_REDIS,

  // S3 or object storage
  s3: process.env.STORAGE_URL_S3,

  // Bucket name
  bucket: process.env.STORAGE_URL_BUCKET,

  // CDN URL
  cdn: process.env.STORAGE_URL_CDN,
};

/**
 * Validate that required storage URLs are configured
 */
export function validateStorageConfig() {
  const requiredVars = ["database"];
  const missing = requiredVars.filter((key) => !(storageConfig as any)[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required storage configuration: ${missing.join(", ")}`,
    );
  }
}

/**
 * Get storage URL by type
 */
export function getStorageUrl(
  type: keyof typeof storageConfig,
): string | undefined {
  return storageConfig[type];
}

/**
 * Check if storage configuration is complete
 */
export function isStorageConfigured(): boolean {
  return Boolean(storageConfig.database);
}

// Export individual configurations for easy access
export const {
  database: DATABASE_URL,
  redis: REDIS_URL,
  s3: S3_URL,
  bucket: BUCKET_NAME,
  cdn: CDN_URL,
} = storageConfig;

export default storageConfig;
