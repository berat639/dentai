import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const treatments = await prisma.treatment.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(treatments);
  } catch (error) {
    console.error("Treatments fetch error:", error);
    return NextResponse.json({ error: "Tedaviler alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, minPrice, maxPrice, duration, category } = body;

    if (!name || minPrice === undefined || maxPrice === undefined) {
      return NextResponse.json(
        { error: "Tedavi adı, min ve max fiyat gereklidir" },
        { status: 400 }
      );
    }

    const treatment = await prisma.treatment.create({
      data: {
        name,
        description: description || null,
        minPrice: parseInt(minPrice),
        maxPrice: parseInt(maxPrice),
        duration: duration || null,
        category: category || "genel",
      },
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error("Treatment create error:", error);
    return NextResponse.json({ error: "Tedavi oluşturulamadı" }, { status: 500 });
  }
}
