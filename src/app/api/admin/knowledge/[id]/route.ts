import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const entry = await prisma.knowledgeBase.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Knowledge update error:", error);
    return NextResponse.json({ error: "Bilgi kaydı güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.knowledgeBase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete error:", error);
    return NextResponse.json({ error: "Bilgi kaydı silinemedi" }, { status: 500 });
  }
}
