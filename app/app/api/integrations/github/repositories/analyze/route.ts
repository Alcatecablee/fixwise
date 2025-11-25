import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "../../../../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

interface AnalyzeRequest {
  repositoryId: number;
  repositoryName: string;
  branch: string;
}

// POST /api/integrations/github/repositories/analyze - Analyze repository (fetch files and start scan)
export const POST = createAuthenticatedHandler(async (request, user) => {
  try {
    const {
      repositoryId,
      repositoryName,
      branch
    }: AnalyzeRequest = await request.json();

    if (!repositoryId || !repositoryName) {
      return NextResponse.json(
        { error: "Repository details are required" },
        { status: 400 }
      );
    }

    const githubToken = request.headers.get("x-github-token");
    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub access token required" },
        { status: 401 }
      );
    }

    // Extract repository owner and name from full name
    const [owner, repoName] = repositoryName.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: "Invalid repository name format. Expected 'owner/repo'" },
        { status: 400 }
      );
    }

    console.log(`Fetching files for repository: ${owner}/${repoName} on branch: ${branch || 'main'}`);

    // Fetch repository contents from GitHub
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents`;
    const params = new URLSearchParams();
    if (branch && branch !== 'main') {
      params.set('ref', branch);
    }
    
    const contentsUrl = params.toString() ? `${githubApiUrl}?${params.toString()}` : githubApiUrl;
    
    const contentsResponse = await fetch(contentsUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NeuroLint-Pro/1.0'
      }
    });

    if (!contentsResponse.ok) {
      const errorText = await contentsResponse.text();
      console.error('GitHub API error:', contentsResponse.status, errorText);
      
      if (contentsResponse.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or access denied" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch repository contents: ${contentsResponse.statusText}` },
        { status: contentsResponse.status }
      );
    }

    const contents = await contentsResponse.json();
    
    // Recursively fetch all JavaScript/TypeScript files
    const files = await getAllCodeFiles(contents, githubToken, owner, repoName, branch || 'main');
    
    if (files.length === 0) {
      return NextResponse.json({
        message: "No JavaScript or TypeScript files found in this repository",
        filesFound: 0,
        scanId: null
      });
    }

    console.log(`Found ${files.length} code files to analyze`);

    // Check plan limits
    const planLimits = getPlanLimits(user.plan);
    if (files.length > planLimits.maxFilesPerScan) {
      return NextResponse.json(
        { 
          error: `File limit exceeded. Your plan allows ${planLimits.maxFilesPerScan} files per scan, but ${files.length} files were found.`,
          filesFound: files.length,
          planLimit: planLimits.maxFilesPerScan
        },
        { status: 403 }
      );
    }

    // Forward to scan endpoint
    const scanRequest = {
      repositoryId,
      repositoryName,
      branch: branch || 'main',
      files
    };

    const scanResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/repositories/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-GitHub-Token': githubToken
      },
      body: JSON.stringify(scanRequest)
    });

    const scanResult = await scanResponse.json();
    
    if (!scanResponse.ok) {
      return NextResponse.json(scanResult, { status: scanResponse.status });
    }

    return NextResponse.json({
      ...scanResult,
      filesFound: files.length,
      message: `Started analyzing ${files.length} files from ${repositoryName}`
    });

  } catch (error) {
    console.error("Repository analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

async function getAllCodeFiles(
  contents: any[], 
  githubToken: string, 
  owner: string, 
  repo: string, 
  branch: string,
  basePath: string = ''
): Promise<Array<{
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
  sha: string;
}>> {
  const files: any[] = [];
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
  
  for (const item of contents) {
    if (item.type === 'file') {
      // Check if it's a code file we want to analyze
      const hasCodeExtension = codeExtensions.some(ext => item.name.endsWith(ext));
      
      if (hasCodeExtension && item.size < 1000000) { // Skip files larger than 1MB
        files.push({
          name: item.name,
          path: item.path,
          downloadUrl: item.download_url,
          size: item.size,
          sha: item.sha
        });
      }
    } else if (item.type === 'dir' && !shouldSkipDirectory(item.name)) {
      // Recursively fetch directory contents
      try {
        const dirResponse = await fetch(item.url, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NeuroLint-Pro/1.0'
          }
        });
        
        if (dirResponse.ok) {
          const dirContents = await dirResponse.json();
          const subFiles = await getAllCodeFiles(
            dirContents, 
            githubToken, 
            owner, 
            repo, 
            branch, 
            item.path
          );
          files.push(...subFiles);
        }
      } catch (error) {
        console.warn(`Failed to fetch directory ${item.path}:`, error);
      }
    }
  }
  
  return files;
}

function shouldSkipDirectory(name: string): boolean {
  const skipDirs = [
    'node_modules', 
    '.git', 
    '.next', 
    'dist', 
    'build', 
    'coverage',
    '.nyc_output',
    'public',
    'static',
    'assets'
  ];
  return skipDirs.includes(name) || name.startsWith('.');
}

function getPlanLimits(plan: string) {
  // Limits based on Final NeuroLint Pro Development and Deployment Roadmap
  const limits = {
    free: {
      maxFilesPerScan: 200,
      availableLayers: [1], // Free tier: Layer 1 only (regex)
      monthlyFixLimit: 50,
      description: "50 fixes/month, Layer 1 regex only"
    },
    basic: {
      maxFilesPerScan: 100,
      availableLayers: [1, 2], // Basic: Layers 1-2 (regex)
      monthlyFixLimit: 2000,
      description: "2,000 fixes/month, Layers 1-2 regex"
    },
    professional: {
      maxFilesPerScan: 500,
      availableLayers: [1, 2, 3, 4], // Professional: Layers 1-4 (AST-based)
      monthlyFixLimit: -1, // Unlimited
      description: "Unlimited fixes, Layers 1-4 AST-based"
    },
    business: {
      maxFilesPerScan: 1000,
      availableLayers: [1, 2, 3, 4, 5], // Business: Add Layer 5, API access
      monthlyFixLimit: -1, // Unlimited
      description: "Unlimited fixes, Layers 1-5, API access"
    },
    enterprise: {
      maxFilesPerScan: -1,
      availableLayers: [1, 2, 3, 4, 5, 6], // Enterprise: All layers, custom rules
      monthlyFixLimit: -1, // Unlimited
      description: "Unlimited fixes, all layers, custom rules"
    },
    premium: {
      maxFilesPerScan: -1,
      availableLayers: [1, 2, 3, 4, 5, 6], // Premium: Unlimited, white-glove support
      monthlyFixLimit: -1, // Unlimited
      description: "Unlimited fixes, white-glove support"
    }
  };
  return limits[plan as keyof typeof limits] || limits.free;
}
