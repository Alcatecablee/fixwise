import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Import the neurolint engine
const getNeuroLintEngine = async () => {
  try {
    const engine = await import("../../../../../neurolint-pro.js");
    return engine.default || engine;
  } catch (error) {
    console.error("Failed to load NeuroLint engine:", error);
    throw new Error("NeuroLint engine not available");
  }
};

// In-memory storage for demo purposes
const projects = new Map();
const projectFiles = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";

    const project = projects.get(projectId);
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const files = projectFiles.get(projectId) || [];

    return NextResponse.json({
      files,
      total: files.length,
      project: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("Project files GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project files" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { files, userId = "demo-user", analyze = false } = body;

    const project = projects.get(projectId);
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Files array is required" },
        { status: 400 },
      );
    }

    const existingFiles = projectFiles.get(projectId) || [];
    const results = [];

    for (const fileData of files) {
      const { filename, content, path: filePath } = fileData;

      if (!filename || !content) {
        continue;
      }

      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      const fileRecord = {
        id: fileId,
        filename,
        path: filePath || filename,
        content,
        size: content.length,
        uploadedAt: new Date().toISOString(),
        lastAnalyzed: null as string | null,
        analysisResults: null as any,
        issues: [] as any[],
        qualityScore: 0,
      };

      // Analyze file if requested
      if (analyze) {
        try {
          const engine = await getNeuroLintEngine();
          const analysisResult = await engine(
            content,
            filename,
            false, // dryRun
            null, // layers
            { singleFile: true },
          );

          fileRecord.lastAnalyzed = new Date().toISOString();
          fileRecord.analysisResults = analysisResult;
          fileRecord.issues = analysisResult.analysis?.detectedIssues || [];
          fileRecord.qualityScore = Math.round(
            (analysisResult.analysis?.confidence || 0) * 100,
          );
        } catch (analysisError) {
          console.error("File analysis error:", analysisError);
          fileRecord.analysisResults = {
            error: "Analysis failed",
            message:
              analysisError instanceof Error
                ? analysisError.message
                : "Unknown error",
          };
        }
      }

      existingFiles.push(fileRecord);
      results.push(fileRecord);
    }

    projectFiles.set(projectId, existingFiles);

    // Update project stats
    const totalFiles = existingFiles.length;
    const totalIssues = existingFiles.reduce(
      (sum: number, file: any) => sum + (file.issues?.length || 0),
      0,
    );
    const avgQuality =
      existingFiles.reduce(
        (sum: number, file: any) => sum + file.qualityScore,
        0,
      ) / totalFiles;

    const updatedProject = {
      ...project,
      stats: {
        ...project.stats,
        totalFiles,
        totalIssues,
        lastAnalyzed: new Date().toISOString(),
        qualityScore: Math.round(avgQuality),
      },
      updatedAt: new Date().toISOString(),
    };

    projects.set(projectId, updatedProject);

    return NextResponse.json({
      files: results,
      project: updatedProject,
      message: `${results.length} files uploaded successfully`,
    });
  } catch (error) {
    console.error("Project files POST error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const userId = searchParams.get("userId") || "demo-user";

    const project = projects.get(projectId);
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const files = projectFiles.get(projectId) || [];

    if (fileId) {
      // Delete specific file
      const updatedFiles = files.filter((file: any) => file.id !== fileId);
      projectFiles.set(projectId, updatedFiles);

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } else {
      // Delete all files
      projectFiles.set(projectId, []);

      // Update project stats
      const updatedProject = {
        ...project,
        stats: {
          ...project.stats,
          totalFiles: 0,
          totalIssues: 0,
          qualityScore: 0,
        },
        updatedAt: new Date().toISOString(),
      };

      projects.set(projectId, updatedProject);

      return NextResponse.json({
        success: true,
        message: "All files deleted successfully",
      });
    }
  } catch (error) {
    console.error("Project files DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 },
    );
  }
}
