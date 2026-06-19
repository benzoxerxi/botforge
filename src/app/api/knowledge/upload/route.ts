import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/knowledge/upload — Upload PDF/TXT file and add to KB
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = (formData.get("companyId") as string) || session.user.companyId;
    const botId = formData.get("botId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "No company" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt") && !file.name.endsWith(".md") && !file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Unsupported file type. Supported: PDF, TXT, MD, CSV" }, { status: 400 });
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileSize = buffer.length;

    let content = "";

    if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
      // Parse PDF
      try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        content = data.text || "";
      } catch (e) {
        console.error("[PDF parse error]", e);
        return NextResponse.json({ error: "Failed to parse PDF file" }, { status: 500 });
      }
    } else {
      // TXT, MD, CSV — read as text
      content = buffer.toString("utf-8");
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "File is empty or contains no extractable text" }, { status: 400 });
    }

    // Find or create bot for this company
    let bot = null;
    if (botId) {
      bot = await prisma.bot.findUnique({ where: { id: botId } });
    }
    if (!bot) {
      bot = await prisma.bot.findFirst({ where: { companyId, active: true } });
    }

    if (!bot) {
      return NextResponse.json({ error: "No active bot found for this company" }, { status: 400 });
    }

    // Split content into chunks (max ~1000 chars per chunk for better RAG)
    const maxChunkSize = 1000;
    const overlap = 100;
    const chunks: Array<{ question: string; answer: string }> = [];
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 50);

    // Helper: split a long string into chunks
    const splitIntoChunks = (text: string, baseName: string, label: string) => {
      const result: Array<{ question: string; answer: string }> = [];
      for (let i = 0; i < text.length; i += maxChunkSize - overlap) {
        const chunk = text.slice(i, i + maxChunkSize).trim();
        if (chunk.length > 50) {
          result.push({
            question: `From ${baseName} — ${label} ${result.length + 1}`,
            answer: chunk,
          });
        }
      }
      return result;
    };

    if (paragraphs.length <= 1) {
      // Fallback: split entire content by character
      chunks.push(...splitIntoChunks(content, fileName, "part"));
    } else {
      for (let i = 0; i < paragraphs.length; i++) {
        let merged = paragraphs[i];
        // Merge small paragraphs, but split large ones
        if (merged.length >= maxChunkSize) {
          // This paragraph is too large, split it
          chunks.push(...splitIntoChunks(merged, fileName, `section ${chunks.length + 1}`));
          continue;
        }
        while (i + 1 < paragraphs.length && merged.length + paragraphs[i + 1].length < maxChunkSize) {
          i++;
          merged += "\n\n" + paragraphs[i];
        }
        if (merged.trim().length > 50) {
          chunks.push({
            question: `From ${fileName} — section ${chunks.length + 1}`,
            answer: merged.trim(),
          });
        }
      }
    }

    // Save to KB
    const kb = await prisma.knowledgeBase.create({
      data: {
        name: fileName,
        type: "document",
        companyId,
        botId: bot.id,
        fileName,
        fileUrl: null, // We don't store the file itself, just the parsed content
        fileSize,
        fileType: file.type || (fileName.endsWith(".pdf") ? "pdf" : "txt"),
        qaData: JSON.stringify(chunks),
        chunkCount: chunks.length,
      },
    });

    return NextResponse.json({
      knowledge: kb,
      fileInfo: {
        name: fileName,
        size: fileSize,
        type: file.type,
      },
      chunksCreated: chunks.length,
      contentLength: content.length,
    });
  } catch (err: any) {
    console.error("[Upload error]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
