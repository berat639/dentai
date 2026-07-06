import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.minPrice !== undefined) body.minPrice = parseInt(body.minPrice);
    if (body.maxPrice !== undefined) body.maxPrice = parseInt(body.maxPrice);

    const treatment = await prisma.treatment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Treatment update error:", error);
    return NextResponse.json({ error: "Tedavi güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.treatment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Treatment delete error:", error);
    return NextResponse.json({ error: "Tedavi silinemedi" }, { status: 500 });
  }
}
