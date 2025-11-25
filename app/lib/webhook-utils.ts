import crypto from "crypto";

// In-memory storage for demo purposes
export const webhooks = new Map();
export const userWebhooks = new Map();
export const webhookEvents = new Map();

export interface Webhook {
  id: string;
  url: string;
  name: string;
  userId: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered: string | null;
  totalCalls: number;
  failureCount: number;
  headers?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  timestamp: string;
  status: "success" | "failed" | "pending";
  response?: string;
  retryCount: number;
}

export const generateSecret = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const signPayload = (payload: string, secret: string): string => {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

export const availableEvents = [
  "analysis.completed",
  "analysis.failed",
  "project.created",
  "project.updated",
  "project.deleted",
  "file.uploaded",
  "file.analyzed",
  "bulk.completed",
  "user.subscribed",
  "user.upgraded",
];

// Utility function to trigger webhooks (for use in other routes)
export const triggerWebhook = async (
  userId: string,
  event: string,
  payload: any,
): Promise<void> => {
  try {
    const userHooks = userWebhooks.get(userId) || [];

    for (const hookId of userHooks) {
      const webhook = webhooks.get(hookId);
      if (!webhook || !webhook.isActive || !webhook.events.includes(event)) {
        continue;
      }

      const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const webhookEvent: WebhookEvent = {
        id: eventId,
        webhookId: hookId,
        event,
        payload,
        timestamp: new Date().toISOString(),
        status: "pending",
        retryCount: 0,
      };

      webhookEvents.set(eventId, webhookEvent);

      // Trigger webhook asynchronously
      triggerWebhookCall(webhook, webhookEvent).catch(console.error);
    }
  } catch (error) {
    console.error("Webhook trigger error:", error);
  }
};

// Webhook validation
export const validateWebhookUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || (process.env.NODE_ENV === 'development' && parsedUrl.protocol === 'http:');
  } catch {
    return false;
  }
};

export const validateWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = `sha256=${signPayload(payload, secret)}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

// Retry configuration
const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // 1s, 5s, 15s, 30s, 1m
const MAX_RETRIES = 5;

const triggerWebhookCall = async (
  webhook: Webhook,
  event: WebhookEvent,
): Promise<void> => {
  const maxRetries = event.retryCount >= MAX_RETRIES;

  try {
    const payload = JSON.stringify({
      event: event.event,
      timestamp: event.timestamp,
      data: event.payload,
      delivery_id: event.id,
      webhook_id: webhook.id,
    });

    const signature = signPayload(payload, webhook.secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NeuroLint-Signature": `sha256=${signature}`,
        "X-NeuroLint-Event": event.event,
        "X-NeuroLint-Delivery": event.id,
        "X-NeuroLint-Webhook": webhook.id,
        "X-NeuroLint-Attempt": (event.retryCount + 1).toString(),
        "User-Agent": "NeuroLint-Webhooks/1.0",
        ...webhook.headers,
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    const isSuccess = response.ok;

    const updatedEvent = {
      ...event,
      status: isSuccess ? "success" as const : "failed" as const,
      response: responseText,
      retryCount: event.retryCount,
    };

    webhookEvents.set(event.id, updatedEvent);

    // Update webhook stats
    const updatedWebhook = {
      ...webhook,
      lastTriggered: new Date().toISOString(),
      totalCalls: webhook.totalCalls + 1,
      failureCount: isSuccess ? webhook.failureCount : webhook.failureCount + 1,
    };

    webhooks.set(webhook.id, updatedWebhook);

    // Schedule retry for failed webhooks
    if (!isSuccess && !maxRetries) {
      scheduleRetry(webhook, updatedEvent);
    }

  } catch (error) {
    console.error("Webhook call error:", error);

    const updatedEvent = {
      ...event,
      status: "failed" as const,
      response: error instanceof Error ? error.message : String(error),
      retryCount: event.retryCount,
    };

    webhookEvents.set(event.id, updatedEvent);

    // Update failure count
    const updatedWebhook = {
      ...webhook,
      failureCount: webhook.failureCount + 1,
    };

    webhooks.set(webhook.id, updatedWebhook);

    // Schedule retry for failed webhooks
    if (!maxRetries) {
      scheduleRetry(webhook, updatedEvent);
    }
  }
};

// Retry scheduling with exponential backoff
const scheduleRetry = (webhook: Webhook, event: WebhookEvent): void => {
  if (event.retryCount >= MAX_RETRIES) {
    return;
  }

  const delay = RETRY_DELAYS[event.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

  setTimeout(() => {
    const retryEvent = {
      ...event,
      retryCount: event.retryCount + 1,
      status: "pending" as const,
    };

    webhookEvents.set(event.id, retryEvent);
    triggerWebhookCall(webhook, retryEvent).catch(console.error);
  }, delay);
};

// Webhook health check
export const testWebhook = async (webhook: Webhook): Promise<{ success: boolean; message: string; responseTime?: number }> => {
  const startTime = Date.now();

  try {
    if (!validateWebhookUrl(webhook.url)) {
      return { success: false, message: "Invalid webhook URL. HTTPS required for production." };
    }

    const testPayload = JSON.stringify({
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { test: true },
      delivery_id: `test_${Date.now()}`,
      webhook_id: webhook.id,
    });

    const signature = signPayload(testPayload, webhook.secret);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NeuroLint-Signature": `sha256=${signature}`,
        "X-NeuroLint-Event": "webhook.test",
        "X-NeuroLint-Test": "true",
        "User-Agent": "NeuroLint-Webhooks/1.0",
        ...webhook.headers,
      },
      body: testPayload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        message: `Webhook test successful (${response.status})`,
        responseTime
      };
    } else {
      return {
        success: false,
        message: `Webhook test failed: ${response.status} ${response.statusText}`,
        responseTime
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      message: `Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime
    };
  }
};
