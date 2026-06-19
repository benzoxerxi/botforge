import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET /api/company/agents?companyId=X — List agents for a company
export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;

  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  // Only super_admin or company_admin of that company can list agents
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agents = await prisma.user.findMany({
    where: { companyId, role: "agent" },
    select: { id: true, name: true, email: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}

// POST /api/company/agents — Create a new agent user
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, email, password, companyId } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const targetCompanyId = companyId || session.user.companyId;
  if (!targetCompanyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  // Only super_admin or company_admin can create agents
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== targetCompanyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const agent = await prisma.user.create({
    data: {
      name: name || null,
      email,
      password: hashed,
      role: "agent",
      companyId: targetCompanyId,
      active: true,
    },
    select: { id: true, name: true, email: true, active: true, createdAt: true },
  });

  return NextResponse.json({ agent }, { status: 201 });
}

// PATCH /api/company/agents — Toggle agent active/inactive
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { agentId, active } = body;

  if (!agentId || active === undefined) {
    return NextResponse.json({ error: "agentId and active required" }, { status: 400 });
  }

  const agent = await prisma.user.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== agent.companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: agentId },
    data: { active: !!active },
  });

  return NextResponse.json({ status: "updated" });
}

// DELETE /api/company/agents?agentId=X — Delete an agent
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const agent = await prisma.user.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "super_admin" && user.companyId !== agent.companyId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: agentId } });

  return NextResponse.json({ status: "deleted" });
}
