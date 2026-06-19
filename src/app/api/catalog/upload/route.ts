import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// POST /api/catalog/upload — upload CSV/XLSX to bulk add catalog items
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const companyId = (formData.get("companyId") as string) || session.user.companyId || "";

  if (!file || !companyId) {
    return NextResponse.json({ error: "file and companyId required" }, { status: 400 });
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Parse workbook
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "No sheets found" }, { status: 400 });
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  }

  // Map column names (case-insensitive) to fields
  const headerMap: Record<string, string> = {
    name: "name",
    product: "name",
    title: "name",
    description: "description",
    desc: "description",
    price: "price",
    cost: "price",
    category: "category",
    categories: "category",
    link: "link",
    url: "link",
    image: "imageUrl",
    imageurl: "imageUrl",
    image_url: "imageUrl",
    photo: "imageUrl",
  };

  const created: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mapped: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      const normalized = key.toLowerCase().replace(/[\s_-]+/g, "").trim();
      // Check direct key
      if (headerMap[key.toLowerCase()]) {
        mapped[headerMap[key.toLowerCase()]] = value;
      } else if (headerMap[normalized]) {
        mapped[headerMap[normalized]] = value;
      } else {
        // Try partial match
        for (const [pattern, field] of Object.entries(headerMap)) {
          if (normalized.includes(pattern) || pattern.includes(normalized)) {
            if (!mapped[field]) mapped[field] = value;
            break;
          }
        }
      }
    }

    if (!mapped.name) {
      errors.push(`Row ${i + 2}: missing name`);
      continue;
    }

    try {
      const item = await prisma.productCatalog.create({
        data: {
          companyId,
          name: String(mapped.name).trim(),
          description: mapped.description ? String(mapped.description).trim() : null,
          price: mapped.price ? parseFloat(String(mapped.price)) : null,
          category: mapped.category ? String(mapped.category).trim() : null,
          link: mapped.link ? String(mapped.link).trim() : null,
          imageUrl: mapped.imageUrl ? String(mapped.imageUrl).trim() : null,
        },
      });
      created.push(item);
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  return NextResponse.json({
    created: created.length,
    errors: errors.length > 0 ? errors : undefined,
    items: created,
  });
}
