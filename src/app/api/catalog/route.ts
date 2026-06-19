import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/catalog?companyId=X — list catalog items
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || session.user.companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const where: any = { companyId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const items = await prisma.productCatalog.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

// POST /api/catalog — add a single catalog item
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { companyId, name, description, price, category, link, imageUrl } = body;

  const targetCompanyId = companyId || session.user.companyId;
  if (!targetCompanyId || !name) {
    return NextResponse.json({ error: "companyId and name required" }, { status: 400 });
  }

  const item = await prisma.productCatalog.create({
    data: {
      companyId: targetCompanyId,
      name,
      description: description || null,
      price: price ? parseFloat(price) : null,
      category: category || null,
      link: link || null,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

// DELETE /api/catalog?id=X — delete a catalog item
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await prisma.productCatalog.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.productCatalog.delete({ where: { id } });

  return NextResponse.json({ status: "deleted" });
}
