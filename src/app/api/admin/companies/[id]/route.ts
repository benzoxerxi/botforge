import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Only allow specific fields to be updated
  const allowedFields = [
    "active", "plan", "tokenLimit", "tokensUsed",
    "aiApiKey", "aiProvider", "aiModel",
  ];
  const data: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, company });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mask the API key for security
  return NextResponse.json({
    ...company,
    aiApiKey: company.aiApiKey ? company.aiApiKey.slice(0, 8) + "..." : null,
  });
}
