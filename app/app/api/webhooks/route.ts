import { NextRequest, NextResponse } from "next/server";
import {
  webhooks,
  userWebhooks,
  webhookEvents,
  generateSecret,
  availableEvents,
  type Webhook,
  type WebhookEvent,
} from "../../../lib/webhook-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";
    const webhookId = searchParams.get("webhookId");

    if (webhookId) {
      // Get specific webhook
      const webhook = webhooks.get(webhookId);
      if (!webhook || webhook.userId !== userId) {
        return NextResponse.json(
          { error: "Webhook not found" },
          { status: 404 },
        );
      }

      // Get recent events for this webhook
      const events = Array.from(webhookEvents.values())
        .filter((event: WebhookEvent) => event.webhookId === webhookId)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 50);

      return NextResponse.json({
        webhook,
        events,
        availableEvents,
      });
    }

    // Get all webhooks for user
    const userHooks = userWebhooks.get(userId) || [];
    const hooks = userHooks
      .map((hookId: string) => webhooks.get(hookId))
      .filter(Boolean);

    return NextResponse.json({
      webhooks: hooks,
      total: hooks.length,
      availableEvents,
    });
  } catch (error) {
    console.error("Webhooks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      name,
      events = ["analysis.completed"],
      headers,
      userId = "demo-user",
    } = body;

    if (!url || !name) {
      return NextResponse.json(
        { error: "URL and name are required" },
        { status: 400 },
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Validate events
    const invalidEvents = events.filter(
      (event: string) => !availableEvents.includes(event),
    );
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(", ")}` },
        { status: 400 },
      );
    }

    const webhookId = `hook_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const secret = generateSecret();

    const webhook: Webhook = {
      id: webhookId,
      url,
      name,
      userId,
      events,
      secret,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      totalCalls: 0,
      failureCount: 0,
      headers: headers || {},
    };

    webhooks.set(webhookId, webhook);

    // Add to user's webhook list
    const userHooks = userWebhooks.get(userId) || [];
    userHooks.push(webhookId);
    userWebhooks.set(userId, userHooks);

    return NextResponse.json(
      {
        webhook,
        message: "Webhook created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Webhooks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookId, updates, userId = "demo-user" } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID is required" },
        { status: 400 },
      );
    }

    const webhook = webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Validate events if being updated
    if (updates.events) {
      const invalidEvents = updates.events.filter(
        (event: string) => !availableEvents.includes(event),
      );
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      // Prevent updating sensitive fields
      id: webhook.id,
      userId: webhook.userId,
      secret: webhook.secret,
      createdAt: webhook.createdAt,
    };

    webhooks.set(webhookId, updatedWebhook);

    return NextResponse.json({ webhook: updatedWebhook });
  } catch (error) {
    console.error("Webhooks PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");
    const userId = searchParams.get("userId") || "demo-user";

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID is required" },
        { status: 400 },
      );
    }

    const webhook = webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    webhooks.delete(webhookId);

    // Remove from user's webhook list
    const userHooks = userWebhooks.get(userId) || [];
    const updatedHooks = userHooks.filter((id: string) => id !== webhookId);
    userWebhooks.set(userId, updatedHooks);

    // Delete associated events
    for (const [eventId, event] of webhookEvents.entries()) {
      if ((event as WebhookEvent).webhookId === webhookId) {
        webhookEvents.delete(eventId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhooks DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 },
    );
  }
}
