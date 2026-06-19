import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/admin/settings - load all platform settings
export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => {
    // Mask API keys when reading back
    if (s.key === "ai_api_key" && s.value) {
      map[s.key] = s.value.slice(0, 8) + "..." + s.value.slice(-4);
    } else {
      map[s.key] = s.value;
    }
  });

  return NextResponse.json({ settings: map });
}

// PUT /api/admin/settings - save platform settings
export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedKeys = ["ai_provider", "ai_api_key", "ai_model"];

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;
    if (typeof value !== "string") continue;

    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
