// Security configuration and constants for NeuroLint Pro

export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false, // Optional for better UX
    MAX_LENGTH: 128,
  },

  // Rate limiting
  RATE_LIMITS: {
    LOGIN: {
      MAX_ATTEMPTS: 5,
      WINDOW_MINUTES: 15,
      PROGRESSIVE_DELAYS: [1000, 2000, 5000, 10000], // ms
    },
    SIGNUP: {
      MAX_ATTEMPTS: 5,
      WINDOW_MINUTES: 1,
    },
    API: {
      FREE: { requestsPerHour: 10, requestsPerDay: 50 },
      PRO: { requestsPerHour: 100, requestsPerDay: 1000 },
      ENTERPRISE: { requestsPerHour: 1000, requestsPerDay: 10000 },
    },
  },

  // Session configuration
  SESSION: {
    MAX_AGE_DAYS: 7,
    REFRESH_THRESHOLD_HOURS: 1, // Refresh if expires within 1 hour
    REMEMBER_ME_DAYS: 30,
  },

  // Input validation
  INPUT: {
    MAX_NAME_LENGTH: 50,
    MAX_EMAIL_LENGTH: 254, // RFC 5321 limit
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ALLOWED_FILE_TYPES: [".js", ".jsx", ".ts", ".tsx"],
    MAX_FILE_SIZE: {
      FREE: 200000, // 200KB
      PRO: 1000000, // 1MB
      ENTERPRISE: 10000000, // 10MB
    },
  },

  // PayPal security
  PAYPAL: {
    WEBHOOK_TIMEOUT_MS: 30000,
    SIGNATURE_ALGORITHM: "sha256",
    CERT_CACHE_HOURS: 24,
  },

  // Headers for security
  SECURITY_HEADERS: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  },
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCOUNT_EXISTS: "An account with this email already exists",
    WEAK_PASSWORD: "Password is too weak. Please choose a stronger password.",
    RATE_LIMITED: "Too many attempts. Please try again later.",
    EMAIL_NOT_CONFIRMED: "Please confirm your email address before signing in",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    UNAUTHORIZED: "You are not authorized to access this resource",
  },
  VALIDATION: {
    REQUIRED_FIELD: "This field is required",
    INVALID_EMAIL: "Please enter a valid email address",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
    PASSWORD_REQUIREMENTS:
      "Password must contain uppercase, lowercase, and numeric characters",
    NAME_TOO_LONG: "Name must be less than 50 characters",
    INVALID_FILE_TYPE: "Please upload a JavaScript or TypeScript file",
    FILE_TOO_LARGE: "File size exceeds the limit for your plan",
  },
  SYSTEM: {
    INTERNAL_ERROR: "An internal error occurred. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    SERVICE_UNAVAILABLE:
      "Service temporarily unavailable. Please try again later.",
    MAINTENANCE: "System is under maintenance. Please try again later.",
  },
  PAYPAL: {
    INVALID_WEBHOOK: "Invalid PayPal webhook signature",
    PAYMENT_FAILED: "Payment processing failed. Please try again.",
    SUBSCRIPTION_ERROR:
      "Error processing subscription. Please contact support.",
  },
} as const;

export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
} as const;

// Utility functions for security
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters long`,
    );
  }

  if (password.length > SECURITY_CONFIG.PASSWORD.MAX_LENGTH) {
    errors.push(
      `Password must be less than ${SECURITY_CONFIG.PASSWORD.MAX_LENGTH} characters long`,
    );
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  return (
    SECURITY_CONFIG.INPUT.EMAIL_REGEX.test(email) &&
    email.length <= SECURITY_CONFIG.INPUT.MAX_EMAIL_LENGTH
  );
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input.trim().substring(0, maxLength);
}

export function getFileSizeLimit(plan: string): number {
  switch (plan) {
    case "pro":
      return SECURITY_CONFIG.INPUT.MAX_FILE_SIZE.PRO;
    case "enterprise":
      return SECURITY_CONFIG.INPUT.MAX_FILE_SIZE.ENTERPRISE;
    default:
      return SECURITY_CONFIG.INPUT.MAX_FILE_SIZE.FREE;
  }
}

export function isAllowedFileType(filename: string): boolean {
  const extension = "." + filename.split(".").pop()?.toLowerCase();
  return SECURITY_CONFIG.INPUT.ALLOWED_FILE_TYPES.includes(
    extension as ".js" | ".jsx" | ".ts" | ".tsx",
  );
}

// Logging utility with security considerations
export function secureLog(level: string, message: string, data?: any) {
  // Remove sensitive data before logging
  const sanitizedData = data ? sanitizeLogData(data) : undefined;

  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(sanitizedData && { data: sanitizedData }),
  };

  console.log(JSON.stringify(logEntry));
}

function sanitizeLogData(data: any): any {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
  ];
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (
      sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
