import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const appointment = await prisma.appointment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: "Randevu güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.appointment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appointment delete error:", error);
    return NextResponse.json({ error: "Randevu silinemedi" }, { status: 500 });
  }
}
