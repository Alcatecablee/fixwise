import { NextRequest, NextResponse } from "next/server";
import { apiKeyService, type ApiKey } from "../../../../lib/api-key-utils";
import { authenticateRequest } from "../../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Try to authenticate the request to get the real user ID
    const authResult = await authenticateRequest(request);
    const actualUserId = authResult.success && authResult.user ? authResult.user.id : userId || "demo-user";

    // Create authenticated Supabase client if user is authenticated
    let authenticatedClient;
    if (authResult.success) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        authenticatedClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: { Authorization: `Bearer ${token}` },
            },
          }
        );
      }
    }

    // Get all API keys for user
    const apiKeys = await apiKeyService.getByUserId(actualUserId, authenticatedClient);

    return NextResponse.json({
      apiKeys,
      total: apiKeys.length,
    });
  } catch (error) {
    console.error("API keys GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      permissions = ["analyze", "projects"],
      expiresInDays,
      rateLimit = { requestsPerHour: 100, requestsPerDay: 1000 },
      userId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 },
      );
    }

        // Try to authenticate the request to get the real user ID
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required to create API keys" },
        { status: 401 },
      );
    }

    // Create authenticated Supabase client
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Valid authorization header required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const authenticatedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const { apiKey, key } = await apiKeyService.create({
      name,
      userId: authResult.user.id,
      permissions,
      expiresInDays: expiresInDays || undefined,
      rateLimit,
    }, authenticatedClient);

    return NextResponse.json(
      {
        apiKey: {
          id: apiKey.id,
          key, // Return the key only on creation
          name: apiKey.name,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          rateLimit: apiKey.rateLimit,
        },
        message:
          "API key created successfully. Please save this key as it won't be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API keys POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create API key" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, updates, userId } = body;

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 },
      );
    }

        // Try to authenticate the request to get the real user ID
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Create authenticated Supabase client
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Valid authorization header required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const authenticatedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const updatedApiKey = await apiKeyService.update(keyId, authResult.user.id, updates, authenticatedClient);

    return NextResponse.json({
      apiKey: updatedApiKey,
    });
  } catch (error) {
    console.error("API keys PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update API key" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("keyId");
    const userId = searchParams.get("userId");

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 },
      );
    }

        // Try to authenticate the request to get the real user ID
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Create authenticated Supabase client
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Valid authorization header required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const authenticatedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    await apiKeyService.delete(keyId, authResult.user.id, authenticatedClient);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API keys DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete API key" },
      { status: 500 },
    );
  }
}
