import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Only doctors and admins can upload prescription files
    if (
      !session ||
      (session.user.role?.toUpperCase() !== "DOCTOR" &&
        session.user.role?.toUpperCase() !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only PDF, PNG, and JPEG files are allowed.",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, file.name, "prescriptions");

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId,
        fileName: file.name,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error uploading prescription file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 },
    );
  }
}
