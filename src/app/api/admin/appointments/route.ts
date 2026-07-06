import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Appointments fetch error:", error);
    return NextResponse.json({ error: "Randevular alınamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientName, patientPhone, patientEmail, treatmentType, date, time, notes, source } = body;

    if (!patientName || !patientPhone || !treatmentType || !date || !time) {
      return NextResponse.json(
        { error: "Hasta adı, telefon, tedavi türü, tarih ve saat gereklidir" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientName,
        patientPhone,
        patientEmail: patientEmail || null,
        treatmentType,
        date: new Date(date),
        time,
        notes: notes || null,
        source: source || "admin",
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Appointment create error:", error);
    return NextResponse.json({ error: "Randevu oluşturulamadı" }, { status: 500 });
  }
}
