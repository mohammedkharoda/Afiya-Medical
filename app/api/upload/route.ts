import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const relativeUploadDir = "/uploads/medical-documents";
    const uploadDir = join(process.cwd(), "public", relativeUploadDir);

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = createId();
    const originalName = file.name;
    const extension = originalName.split(".").pop();
    const fileName = `${uniqueId}.${extension}`;
    const filePath = join(uploadDir, fileName);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return the URL path
    const fileUrl = `${relativeUploadDir}/${fileName}`;

    return NextResponse.json({
      fileUrl,
      fileName: originalName,
      success: true,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
