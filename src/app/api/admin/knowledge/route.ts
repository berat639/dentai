import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const entries = await prisma.knowledgeBase.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Knowledge fetch error:", error);
    return NextResponse.json({ error: "Bilgi tabanı alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Başlık ve içerik gereklidir" },
        { status: 400 }
      );
    }

    const entry = await prisma.knowledgeBase.create({
      data: {
        title,
        content,
        category: category || "genel",
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Knowledge create error:", error);
    return NextResponse.json({ error: "Bilgi kaydı oluşturulamadı" }, { status: 500 });
  }
}
