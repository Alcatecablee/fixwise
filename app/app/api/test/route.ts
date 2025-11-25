import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Test with a sample file if it exists
    const testFilePath = path.join(process.cwd(), "test-sample.jsx");

    if (!fs.existsSync(testFilePath)) {
      return NextResponse.json(
        {
          error: "Test file not found",
          message: "Please create test-sample.jsx in the root directory",
        },
        { status: 404 },
      );
    }

    const testCode = fs.readFileSync(testFilePath, "utf8");

    // Import and run NeuroLint
    const NeuroLintPro = await import("../../../neurolint-pro.js");
    const engine = NeuroLintPro.default || NeuroLintPro;

    const result = await engine(testCode, testFilePath, true, null, {
      singleFile: true,
    });

    return NextResponse.json({
      success: true,
      filename: "test-sample.jsx",
      result,
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
