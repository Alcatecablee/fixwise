import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../../../lib/auth-middleware";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  languages_url: string;
  size: number;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

// GET /api/integrations/github/repositories - Fetch user's repositories
export const GET = createAuthenticatedHandler(async (request, user) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "30");
    const type = url.searchParams.get("type") || "all"; // all, owner, member
    const sort = url.searchParams.get("sort") || "updated"; // created, updated, pushed, full_name
    const direction = url.searchParams.get("direction") || "desc"; // asc, desc

    // In production, get the stored GitHub access token for this user
    // For demo purposes, we'll return mock data or require the token in headers
    const authHeader = request.headers.get("x-github-token");

    if (!authHeader) {
      return NextResponse.json(
        { error: "GitHub access token required" },
        { status: 401 },
      );
    }

    // Fetch repositories from GitHub API
    const reposResponse = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&type=${type}&sort=${sort}&direction=${direction}`,
      {
        headers: {
          Authorization: `Bearer ${authHeader}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "NeuroLint-Pro/1.0",
        },
      },
    );

    const repositories = await reposResponse.json();

    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: repositories.message || "Failed to fetch repositories" },
        { status: reposResponse.status },
      );
    }

    // Filter repositories that contain React/Next.js/TypeScript files
    const processedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      htmlUrl: repo.html_url,
      language: repo.language,
      size: repo.size,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
      // Estimate if repo likely contains React/JS/TS files
      likelyHasReactFiles:
        ["JavaScript", "TypeScript", "JSX"].includes(repo.language || "") ||
        repo.name.toLowerCase().includes("react") ||
        repo.name.toLowerCase().includes("next") ||
        repo.name.toLowerCase().includes("js") ||
        repo.name.toLowerCase().includes("ts"),
    }));

    return NextResponse.json({
      repositories: processedRepos,
      pagination: {
        page,
        perPage,
        hasMore: repositories.length === perPage,
      },
    });
  } catch (error) {
    console.error("GitHub repositories fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// POST /api/integrations/github/repositories/analyze - Analyze a specific repository
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const {
      repositoryId,
      repositoryName,
      branch = "main",
    } = await request.json();

    if (!repositoryId || !repositoryName) {
      return NextResponse.json(
        { error: "Repository ID and name required" },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("x-github-token");

    if (!authHeader) {
      return NextResponse.json(
        { error: "GitHub access token required" },
        { status: 401 },
      );
    }

    // Get repository contents
    const contentsResponse = await fetch(
      `https://api.github.com/repos/${repositoryName}/contents?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${authHeader}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "NeuroLint-Pro/1.0",
        },
      },
    );

    if (!contentsResponse.ok) {
      const error = await contentsResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository contents" },
        { status: contentsResponse.status },
      );
    }

    const contents = await contentsResponse.json();

    // Recursively find React/TypeScript files
    const analyzeableFiles = await findAnalyzeableFiles(
      repositoryName,
      branch,
      authHeader,
      contents,
    );

    return NextResponse.json({
      repositoryId,
      repositoryName,
      branch,
      totalFiles: analyzeableFiles.length,
      files: analyzeableFiles.slice(0, 50), // Limit initial response
      estimatedScanTime: Math.ceil(analyzeableFiles.length * 2), // 2 seconds per file estimate
      scanCost: calculateScanCost(analyzeableFiles.length, user.plan),
    });
  } catch (error) {
    console.error("Repository analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

async function findAnalyzeableFiles(
  repoName: string,
  branch: string,
  token: string,
  contents: any[],
  path = "",
): Promise<any[]> {
  const files: any[] = [];
  const reactFileExtensions = [".tsx", ".ts", ".jsx", ".js"];

  for (const item of contents) {
    if (item.type === "file") {
      const hasReactExtension = reactFileExtensions.some((ext) =>
        item.name.endsWith(ext),
      );
      if (hasReactExtension) {
        files.push({
          name: item.name,
          path: item.path,
          size: item.size,
          downloadUrl: item.download_url,
          sha: item.sha,
        });
      }
    } else if (
      item.type === "dir" &&
      item.name !== "node_modules" &&
      item.name !== ".git"
    ) {
      // Recursively explore directories (with depth limit)
      if (path.split("/").length < 5) {
        // Limit recursion depth
        try {
          const dirResponse = await fetch(
            `https://api.github.com/repos/${repoName}/contents/${item.path}?ref=${branch}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "NeuroLint-Pro/1.0",
              },
            },
          );

          if (dirResponse.ok) {
            const dirContents = await dirResponse.json();
            const subFiles = await findAnalyzeableFiles(
              repoName,
              branch,
              token,
              dirContents,
              item.path,
            );
            files.push(...subFiles);
          }
        } catch (error) {
          console.warn(`Failed to explore directory ${item.path}:`, error);
        }
      }
    }
  }

  return files;
}

function calculateScanCost(
  fileCount: number,
  userPlan: string,
): { credits: number; cost: number } {
  const baseCostPerFile = 1; // 1 credit per file
  const planMultipliers = {
    free: 1,
    pro: 0.8,
    enterprise: 0.5,
  };

  const multiplier =
    planMultipliers[userPlan as keyof typeof planMultipliers] || 1;
  const credits = Math.ceil(fileCount * baseCostPerFile * multiplier);
  const cost = credits * 0.01; // $0.01 per credit

  return { credits, cost };
}
